// Undercover — a real-time online party word game. No human host: every step runs on timers.
// Run: npm install && npm start   (then open http://localhost:3000)
const path = require("path");
const http = require("http");
const express = require("express");
const { Server } = require("socket.io");
const QRCode = require("qrcode");
const WORDS = require("./words");
const rules = require("./rules");
const Bots = require("./bots");

const PORT = process.env.PORT || 3000;
const T = Number(process.env.TIME_SCALE || 1); // tests speed time up; leave at 1 in production
const MAX_PLAYERS = 16;
const ROOM_TTL_MS = 4 * 60 * 60 * 1000; // idle rooms are removed after 4h
const START_COUNTDOWN = 3; // seconds after everyone is Ready
const OFFLINE_TURN = 8; // seconds an offline player keeps their turn before it is skipped
const VOTE_LAST_CALL = 5; // once everyone has voted, seconds left to change your mind
const RESULT_SECS = 8; // seconds the round result stays up before the next round
const WHITE_GUESS_SECS = 30;
const LOBBY_DROP_SECS = 60; // offline players are removed from the lobby after this
const CLUE_SECS = 45; // fixed for everyone — not a room setting
const VOTE_SECS = 30;
const CHAT_KEEP = 80; // messages kept per room
const CHAT_MAX = 200; // characters per message
const CHAT_GAP_MS = 700; // per-player rate limit
const ms = (secs) => secs * 1000 * T;

const app = express();
const server = http.createServer(app);
const io = new Server(server, { pingInterval: 20000, pingTimeout: 20000 });

app.use(express.static(path.join(__dirname, "public")));
app.get("/health", (_req, res) => res.send("ok"));
// Public rooms anyone can browse and join. Private rooms are reachable only by code or link.
app.get("/api/rooms", (_req, res) => {
  res.set("Cache-Control", "no-store");
  res.json(publicRooms().slice(0, 50).map((r) => {
    const here = [...r.players.values()].filter((p) => p.connected);
    return {
      code: r.code,
      owner: r.players.get(r.ownerId)?.name || "",
      players: here.length,
      ai: here.filter((p) => p.bot).length,
      max: MAX_PLAYERS,
      playing: !inLobby(r),
      packs: r.settings.packs.map((id) => WORDS.PACKS[id]?.name).filter(Boolean),
      mrWhite: r.settings.mrWhite,
    };
  }));
});
app.get("/qr", async (req, res) => {
  const u = String(req.query.u || "").slice(0, 400);
  if (!/^https?:\/\//.test(u)) return res.status(400).end();
  try {
    res.type("image/svg+xml").send(await QRCode.toString(u, { type: "svg", margin: 1 }));
  } catch {
    res.status(400).end();
  }
});

/* ---------------- rooms ---------------- */
const rooms = new Map();
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // no I / O

function newCode() {
  let c;
  do c = Array.from({ length: 4 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join("");
  while (rooms.has(c));
  return c;
}
const shuffle = (a) => {
  a = a.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
const cleanName = (n) => String(n || "").replace(/[\u0000-\u001f<>]/g, "").replace(/\s+/g, " ").trim().slice(0, 18);

function makeRoom(ownerId) {
  return {
    code: newCode(),
    ownerId, // the room owner only picks settings; the game itself runs automatically
    players: new Map(), // id -> {id,name,connected,sockets:Set,score,joinedAt,ready,dropTimer}
    settings: { undercovers: "auto", mrWhite: false, packs: ["basic"], visibility: "private" },
    usedPairs: new Set(),
    game: null,
    gameNo: 0,
    startAt: null,
    startTimer: null,
    botKeys: new Set(), // AI actions already scheduled, so each happens once
    chat: [], // last CHAT_KEEP messages: {id, name, text, t}
    touched: Date.now(),
  };
}

const inLobby = (room) => !room.game || room.game.phase === "over";
// Open public rooms, best first: waiting before playing, then the fullest (more fun to join).
function publicRooms() {
  return [...rooms.values()]
    .filter((r) => r.settings.visibility === "public" && r.players.size < MAX_PLAYERS && [...r.players.values()].some((p) => !p.bot && p.connected))
    .sort((a, b) => (inLobby(b) - inLobby(a)) || (b.players.size - a.players.size));
}
const sortedPlayers = (room) => [...room.players.values()].sort((a, b) => a.joinedAt - b.joinedAt);

const humans = (room) => [...room.players.values()].filter((p) => !p.bot);

function ensureOwner(room) {
  const o = room.players.get(room.ownerId);
  if (o && o.connected && !o.bot) return;
  const next = sortedPlayers(room).find((p) => p.connected && !p.bot);
  if (next) room.ownerId = next.id;
}

function removePlayer(room, id) {
  const p = room.players.get(id);
  if (!p) return;
  clearTimeout(p.dropTimer);
  room.players.delete(id);
  if (!humans(room).length) { // only AI players left: close the room
    stopGameTimers(room);
    rooms.delete(room.code);
    return;
  }
  ensureOwner(room);
}

/* ---------- auto start: everyone Ready → 3, 2, 1 ---------- */
function checkAutoStart(room) {
  if (!inLobby(room)) return;
  const here = [...room.players.values()].filter((p) => p.connected);
  // At least one person must be here — AI players never start a game on their own.
  const allReady = here.some((p) => !p.bot) && here.every((p) => p.ready);
  const okSize = !rules.checkSetup(here.length, room.settings);
  if (allReady && okSize) {
    if (room.startTimer) return;
    room.startAt = Date.now() + ms(START_COUNTDOWN);
    room.startTimer = setTimeout(() => {
      room.startTimer = null;
      room.startAt = null;
      const err = startGame(room);
      if (err) io.to(room.code).emit("problem", err);
      broadcast(room);
    }, ms(START_COUNTDOWN));
  } else if (room.startTimer) {
    clearTimeout(room.startTimer);
    room.startTimer = null;
    room.startAt = null;
  }
}

/* ---------------- game ---------------- */
function stopGameTimers(room) {
  clearTimeout(room.startTimer);
  room.startTimer = null;
  room.startAt = null;
  if (room.game) clearTimer(room.game);
}
function clearTimer(g) {
  if (g && g.timer) clearTimeout(g.timer);
  if (g) g.timer = null;
}
function setTimer(room, secs, fn) {
  const g = room.game;
  clearTimer(g);
  g.endsAt = Date.now() + ms(secs);
  g.timer = setTimeout(() => {
    if (room.game === g) fn();
  }, ms(secs) + 250 * T);
}

function startGame(room) {
  const ids = sortedPlayers(room).filter((p) => p.connected).map((p) => p.id);
  const err = rules.checkSetup(ids.length, room.settings);
  if (err) return err;

  // Draw from the chosen word packs; no pair repeats in a room until the packs run out.
  const chosen = WORDS.ALL.filter((w) => room.settings.packs.includes(w.pack));
  let pool = chosen.filter((w) => !room.usedPairs.has(w.id));
  if (!pool.length) {
    for (const w of chosen) room.usedPairs.delete(w.id);
    pool = chosen;
  }
  const w = pool[Math.floor(Math.random() * pool.length)];
  room.usedPairs.add(w.id);
  const category = w.hint;
  // Chat filter list for this game: both secret words, their related words, plus two decoy pairs from the
  // same category — so a blocked chat message never proves which word is the other side's.
  const decoys = WORDS.ALL.filter((x) => x.hint === w.hint && x.id !== w.id).sort(() => Math.random() - 0.5).slice(0, 2);
  const chatBlock = [w, ...decoys].flatMap((x) => [x.a, x.b]);
  const pair = Math.random() < 0.5 ? [w.a, w.b] : [w.b, w.a];

  const order = shuffle(ids);
  const und = rules.undercoverCount(ids.length, room.settings);
  const roles = {};
  order.forEach((id, i) => {
    roles[id] = i < und ? "und" : i === und && room.settings.mrWhite ? "white" : "civ";
  });
  for (const p of room.players.values()) p.ready = !!p.bot; // AI players are always ready

  room.gameNo++;
  room.botKeys.clear();
  room.game = {
    phase: "clue",
    roles,
    words: { civ: pair[0], und: pair[1] },
    outRoles: {},
    category, // shown only to Mr. White, and only once they've had to speak first
    chatBlock,
    whiteHint: false,
    alive: ids.slice(),
    round: 0,
    turnOrder: [],
    turnIdx: 0,
    endsAt: null,
    clues: [], // {round,id,word|null}
    votes: {},
    candidates: null,
    revote: false,
    lastResult: null,
    winner: null,
    whiteGuess: null,
    timer: null,
  };
  nextRound(room);
  return null;
}

function nextRound(room) {
  const g = room.game;
  g.round++;
  g.turnOrder = rules.speakingOrder(g.alive, g.roles, shuffle);
  // Mr. White opening a round has nothing to go on — give them the category as a hint.
  if (g.roles[g.turnOrder[0]] === "white") g.whiteHint = true;
  g.turnIdx = 0;
  g.votes = {};
  g.candidates = null;
  g.revote = false;
  g.whiteGuess = null;
  g.phase = "clue";
  startTurn(room);
}

function startTurn(room) {
  const g = room.game;
  if (g.turnIdx >= g.turnOrder.length) return startVote(room);
  const pid = g.turnOrder[g.turnIdx];
  const online = room.players.get(pid)?.connected;
  g.graceFor = online ? null : pid;
  setTimer(room, online ? CLUE_SECS : OFFLINE_TURN, () => recordClue(room, pid, null));
}

function recordClue(room, pid, word) {
  const g = room.game;
  if (!g || g.phase !== "clue" || g.turnOrder[g.turnIdx] !== pid) return;
  g.clues.push({ round: g.round, id: pid, word });
  g.turnIdx++;
  startTurn(room);
  broadcast(room);
}

function startVote(room, candidates) {
  const g = room.game;
  g.phase = "vote";
  g.votes = {};
  g.candidates = candidates || null;
  // Votes stay secret and can be changed until the countdown ends.
  setTimer(room, VOTE_SECS, () => tally(room));
  broadcast(room);
}

function castVote(room, pid, target) {
  const g = room.game;
  if (!g || g.phase !== "vote" || !g.alive.includes(pid)) return false;
  if (!voteTargets(g, pid).includes(target)) return false;
  if (g.votes[pid] === target) return true;
  g.votes[pid] = target; // first vote or a change — allowed until the countdown ends
  // Everyone has voted: cut to a short last call instead of making people wait.
  if (g.alive.every((id) => id in g.votes) && g.endsAt - Date.now() > ms(VOTE_LAST_CALL))
    setTimer(room, VOTE_LAST_CALL, () => tally(room));
  broadcast(room);
  return true;
}

function voteTargets(g, voterId) {
  return (g.candidates || g.alive).filter((id) => id !== voterId);
}

function tally(room) {
  const g = room.game;
  clearTimer(g);
  // Only the totals are ever shown — never who voted for whom.
  const res = rules.tally(g.votes, g.candidates || g.alive, g.revote);
  if (res.outcome === "revote") {
    g.revote = true;
    g.lastResult = { type: "tie", tied: res.tied, counts: res.counts };
    return startVote(room, res.tied);
  }
  if (res.outcome === "none") {
    g.lastResult = { type: "none", counts: res.counts, tied: res.tied };
    return showResult(room);
  }
  const out = res.eliminated;
  g.alive = g.alive.filter((id) => id !== out);
  g.lastResult = { type: "out", id: out, role: g.roles[out], counts: res.counts };
  g.outRoles[out] = g.roles[out]; // revealed to everyone when they're voted out
  if (g.roles[out] === "white") {
    g.phase = "whiteguess";
    const wait = room.players.get(out)?.connected ? WHITE_GUESS_SECS : OFFLINE_TURN;
    setTimer(room, wait, () => whiteGuessed(room, null));
    return broadcast(room);
  }
  finishOrContinue(room);
}

function whiteGuessed(room, guess) {
  const g = room.game;
  if (!g || g.phase !== "whiteguess") return;
  const right = !!guess && rules.sameWord(guess, g.words.civ);
  g.whiteGuess = { guess: guess || null, right };
  if (right) return endGame(room, "white");
  finishOrContinue(room);
}

function finishOrContinue(room) {
  const g = room.game;
  const w = rules.winner(g.alive, g.roles);
  if (w) return endGame(room, w);
  showResult(room);
}

function showResult(room) {
  const g = room.game;
  g.phase = "result";
  setTimer(room, RESULT_SECS, () => {
    nextRound(room);
    broadcast(room);
  });
  broadcast(room);
}

function endGame(room, winner) {
  const g = room.game;
  clearTimer(g);
  g.endsAt = null;
  g.phase = "over";
  g.winner = winner;
  for (const [id, pts] of Object.entries(rules.points(winner, g.roles, g.alive))) {
    const p = room.players.get(id);
    if (p) p.score += pts;
  }
  // Offline players are dropped from the room between games.
  for (const p of [...room.players.values()]) if (!p.connected) scheduleDrop(room, p);
  broadcast(room);
}

function scheduleDrop(room, p) {
  clearTimeout(p.dropTimer);
  p.dropTimer = setTimeout(() => {
    if (!p.connected && inLobby(room) && room.players.get(p.id) === p) {
      removePlayer(room, p.id);
      if (rooms.has(room.code)) {
        checkAutoStart(room);
        broadcast(room);
      }
    }
  }, ms(LOBBY_DROP_SECS));
}

/* ---------------- views ---------------- */
function view(room, pid) {
  const g = room.game;
  const players = sortedPlayers(room).map((p) => ({
    id: p.id, name: p.name, named: !!(p.named || p.bot), connected: p.connected, score: p.score, ready: p.ready, bot: !!p.bot,
    inGame: !!(g && p.id in g.roles), alive: !!(g && g.alive.includes(p.id)),
  }));
  const here = players.filter((p) => p.connected).length;
  const plan = { undercovers: rules.undercoverCount(Math.max(here, 3), room.settings), need: rules.minPlayers(room.settings), auto: rules.autoUndercovers(Math.max(here, 3)) };
  const v = { code: room.code, ownerId: room.ownerId, you: pid, players, chat: room.chat, plan, settings: room.settings, packs: WORDS.CATALOG, times: { clue: CLUE_SECS, vote: VOTE_SECS }, gameNo: room.gameNo, startAt: room.startAt, now: Date.now(), game: null };
  if (!g) return v;
  const myRole = g.roles[pid];
  v.game = {
    phase: g.phase,
    round: g.round,
    alive: g.alive,
    turnOrder: g.turnOrder,
    turnIdx: g.turnIdx,
    endsAt: g.endsAt,
    clues: g.clues,
    candidates: g.candidates,
    revote: g.revote,
    votedCount: Object.keys(g.votes).length, // a count only: never who, never for whom
    myVote: g.votes[pid] || null,
    targets: g.phase === "vote" && g.alive.includes(pid) ? voteTargets(g, pid) : [],
    lastResult: g.lastResult,
    outRoles: g.outRoles,
    whiteGuess: g.whiteGuess,
    winner: g.winner,
    // What *this* player knows about themself. The Undercover is NOT told they are the Undercover.
    me: !myRole ? { spectator: true } : myRole === "white" ? { white: true, hint: g.whiteHint ? g.category : null } : { word: g.words[myRole] },
    reveal: g.phase === "over" ? { roles: g.roles, words: g.words, category: g.category } : null,
    whiteId: g.phase === "whiteguess" ? g.lastResult.id : null,
  };
  return v;
}

function broadcast(room) {
  if (!rooms.has(room.code)) return;
  room.touched = Date.now();
  for (const p of room.players.values()) {
    if (p.bot) continue;
    const state = view(room, p.id);
    for (const sid of p.sockets) io.to(sid).emit("state", state);
  }
  botTick(room);
}

/* ---------------- AI players ---------------- */
// Schedules whatever the AI players need to do in the current phase, with a human-like pause.
function botTick(room) {
  const g = room.game;
  if (!g || g.phase === "over") return;
  const tag = (k) => `${room.gameNo}:${g.round}:${k}`;
  const later = (k, secs, fn) => {
    const key = tag(k);
    if (room.botKeys.has(key)) return;
    room.botKeys.add(key);
    setTimeout(() => { if (rooms.get(room.code) === room && room.game === g) fn(); }, ms(secs));
  };
  const packs = room.settings.packs;
  if (g.phase === "clue") {
    const pid = g.turnOrder[g.turnIdx];
    if (room.players.get(pid)?.bot) later("clue" + g.turnIdx, 2 + Math.random() * 4, () => {
      if (g.phase !== "clue" || g.turnOrder[g.turnIdx] !== pid) return;
      const used = g.clues.map((c) => c.word).filter(Boolean);
      const role = g.roles[pid], myWord = role === "white" ? null : g.words[role];
      const w = role === "white" ? Bots.whiteClue(g, packs, used) : Bots.smartClue(g, pid);
      const check = w ? rules.checkClue(w, myWord, used) : { error: "none" };
      recordClue(room, pid, check.error ? null : check.word);
    });
  }
  if (g.phase === "vote") {
    for (const pid of g.alive) {
      if (!room.players.get(pid)?.bot) continue;
      later((g.revote ? "revote" : "vote") + pid, 3 + Math.random() * 7, () => {
        const t = Bots.chooseVote(g, pid, voteTargets(g, pid), packs);
        if (t) castVote(room, pid, t);
      });
    }
  }
  if (g.phase === "whiteguess" && room.players.get(g.lastResult.id)?.bot)
    later("whiteguess", 3 + Math.random() * 3, () => whiteGuessed(room, Bots.whiteGuess(g, packs)));
}

/* ---------------- sockets ---------------- */
io.on("connection", (socket) => {
  const fail = (msg) => socket.emit("problem", msg);
  const ctx = () => {
    const room = rooms.get(socket.data.code);
    const p = room && room.players.get(socket.data.pid);
    return { room, p };
  };

  function attach(room, p) {
    socket.data.code = room.code;
    socket.data.pid = p.id;
    p.sockets.add(socket.id);
    p.connected = true;
    clearTimeout(p.dropTimer);
    socket.join(room.code);
    ensureOwner(room);
    // Back online during your own turn: restore the full clue timer.
    const g = room.game;
    if (g && g.phase === "clue" && g.turnOrder[g.turnIdx] === p.id && g.graceFor === p.id) {
      g.graceFor = null;
      setTimer(room, CLUE_SECS, () => recordClue(room, p.id, null));
    }
    checkAutoStart(room);
    broadcast(room);
  }

  // Take a seat. People pick their name after they're in the room: until then they get a placeholder
  // ("Player 3") and can't Ready up. A name remembered on their device is used straight away.
  const nameTaken = (room, n, except) => [...room.players.values()].some((x) => x.id !== except && x.name.toLowerCase() === n.toLowerCase());
  function freeName(room, base) {
    if (!nameTaken(room, base)) return base;
    let k = 2; while (nameTaken(room, `${base.slice(0, 15)} ${k}`)) k++;
    return `${base.slice(0, 15)} ${k}`;
  }
  function seat(room, token, rawName) {
    const wanted = cleanName(rawName);
    let name = wanted ? freeName(room, wanted) : null;
    if (!name) { let k = room.players.size + 1; while (nameTaken(room, "Player " + k)) k++; name = "Player " + k; }
    const p = { id: token, name, named: !!wanted, connected: true, sockets: new Set(), score: 0, joinedAt: Date.now(), ready: false, dropTimer: null };
    room.players.set(token, p);
    return p;
  }

  // Public or private is chosen when the room is created and stays that way.
  socket.on("create", ({ name, token, visibility } = {}) => {
    if (!token || typeof token !== "string" || token.length > 80) return fail("Refresh the page and try again.");
    const room = makeRoom(token);
    room.settings.visibility = visibility === "public" ? "public" : "private";
    rooms.set(room.code, room);
    attach(room, seat(room, token, name));
  });

  function joinRoom(room, name, token) {
    const back = room.players.get(token);
    if (back) return attach(room, back); // reconnect: same seat, same word
    if (room.players.size >= MAX_PLAYERS) return fail("This room is full (16 players).");
    attach(room, seat(room, token, name));
  }
  const badToken = (t) => !t || typeof t !== "string" || t.length > 80;

  socket.on("join", ({ code, name, token } = {}) => {
    code = String(code || "").toUpperCase().trim();
    const room = rooms.get(code);
    if (!room) return fail(`No room called ${code || "that"}. Check the code and try again.`);
    if (badToken(token)) return fail("Refresh the page and try again.");
    joinRoom(room, name, token);
  });

  // Quick join: the best waiting public room, or a fresh public room if there is none.
  socket.on("quickJoin", ({ name, token } = {}) => {
    if (badToken(token)) return fail("Refresh the page and try again.");
    const room = publicRooms().find((r) => inLobby(r));
    if (room) return joinRoom(room, name, token);
    const fresh = makeRoom(token);
    fresh.settings.visibility = "public";
    rooms.set(fresh.code, fresh);
    attach(fresh, seat(fresh, token, name));
  });

  // Pick or change your name. Allowed between games (and while watching), not mid-game.
  socket.on("rename", (raw, ack) => {
    const reply = typeof ack === "function" ? ack : () => {};
    const { room, p } = ctx();
    if (!room || !p) return reply({ error: "You're not in a room." });
    if (room.game && !inLobby(room) && p.id in room.game.roles) return reply({ error: "You can change your name after this game." });
    const name = cleanName(raw);
    if (!name) return reply({ error: "Type a name first." });
    if (nameTaken(room, name, p.id)) return reply({ error: `Someone here is already called ${name}. Add an initial?` });
    p.name = name;
    p.named = true;
    for (const m of room.chat) if (m.id === p.id) m.name = name;
    reply({ ok: true, name });
    broadcast(room);
  });

  socket.on("ready", (on) => {
    const { room, p } = ctx();
    if (!room || !p || !inLobby(room)) return;
    if (on && !p.named) return fail("Pick your name first.");
    p.ready = !!on;
    checkAutoStart(room);
    broadcast(room);
  });

  socket.on("settings", (s = {}) => {
    const { room, p } = ctx();
    if (!room || room.ownerId !== p?.id || !inLobby(room)) return;
    if (s.undercovers === "auto" || [1, 2, 3, 4].includes(s.undercovers)) room.settings.undercovers = s.undercovers;
    if (typeof s.mrWhite === "boolean") room.settings.mrWhite = s.mrWhite;
    if (Array.isArray(s.packs)) {
      const valid = s.packs.filter((id) => typeof id === "string" && WORDS.PACKS[id]);
      room.settings.packs = ["basic", ...new Set(valid.filter((id) => id !== "basic"))]; // Basic is always on
    }
    const gameplay = "undercovers" in s || "mrWhite" in s || "packs" in s;
    // A gameplay change resets Ready so nobody starts a game they didn't agree to (AI players stay ready).
    if (gameplay) for (const x of room.players.values()) x.ready = !!x.bot;
    checkAutoStart(room);
    broadcast(room);
  });

  socket.on("addBot", () => {
    const { room, p } = ctx();
    if (!room || room.ownerId !== p?.id || !inLobby(room)) return;
    if (room.players.size >= MAX_PLAYERS) return fail("This room is full (16 players).");
    const id = "bot-" + Math.random().toString(36).slice(2, 10);
    const name = Bots.botName([...room.players.values()].map((x) => x.name));
    room.players.set(id, { id, name, bot: true, connected: true, sockets: new Set(), score: 0, joinedAt: Date.now(), ready: true, dropTimer: null });
    checkAutoStart(room);
    broadcast(room);
  });

  socket.on("kick", (id) => {
    const { room, p } = ctx();
    if (!room || room.ownerId !== p?.id || id === p.id || !inLobby(room)) return;
    const k = room.players.get(id);
    if (!k) return;
    for (const sid of k.sockets) io.to(sid).emit("kicked");
    removePlayer(room, id);
    checkAutoStart(room);
    broadcast(room);
  });

  socket.on("clue", (raw, ack) => {
    const reply = typeof ack === "function" ? ack : () => {};
    const { room, p } = ctx();
    const g = room?.game;
    if (!g || g.phase !== "clue" || g.turnOrder[g.turnIdx] !== p?.id) return reply({ error: "It's not your turn." });
    const myWord = g.roles[p.id] === "white" ? null : g.words[g.roles[p.id]];
    const check = rules.checkClue(raw, myWord, g.clues.map((c) => c.word).filter(Boolean));
    if (check.error) return reply({ error: check.error });
    reply({ ok: true });
    recordClue(room, p.id, check.word);
  });

  // Room chat. While a game is on, nobody may post either secret word or anything related to it.
  // Decoy words from the same category are blocked too, so a refusal never reveals the other word.
  socket.on("chat", (raw, ack) => {
    const reply = typeof ack === "function" ? ack : () => {};
    const { room, p } = ctx();
    if (!room || !p) return reply({ error: "You're not in a room." });
    const text = String(raw ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, CHAT_MAX);
    if (!text) return reply({ error: "Type a message first." });
    const now = Date.now();
    if (now - (p.lastChat || 0) < CHAT_GAP_MS) return reply({ error: "Slow down a little." });
    const g = room.game;
    if (g && g.phase !== "over" && g.chatBlock.some((w) => rules.chatLeaks(text, w, Bots.assocOf(w))))
      return reply({ error: "Not sent — it's too close to this game's secret words. Try saying it another way." });
    p.lastChat = now;
    room.chat.push({ id: p.id, name: p.name, text, t: now });
    if (room.chat.length > CHAT_KEEP) room.chat.splice(0, room.chat.length - CHAT_KEEP);
    reply({ ok: true });
    broadcast(room);
  });

  socket.on("vote", (target) => {
    const { room, p } = ctx();
    const g = room?.game;
    if (!g || g.phase !== "vote" || !g.alive.includes(p?.id)) return;
    if (!castVote(room, p.id, target)) fail("You can't vote for that player.");
  });

  // Tap your vote again to take it back (allowed until the countdown ends).
  socket.on("unvote", () => {
    const { room, p } = ctx();
    const g = room?.game;
    if (!g || g.phase !== "vote" || !(p?.id in g.votes)) return;
    delete g.votes[p.id];
    broadcast(room);
  });

  socket.on("whiteGuess", (raw) => {
    const { room, p } = ctx();
    const g = room?.game;
    if (!g || g.phase !== "whiteguess" || g.lastResult?.id !== p?.id) return;
    const guess = String(raw || "").trim().slice(0, 40);
    if (guess) whiteGuessed(room, guess);
  });

  socket.on("leave", () => {
    const { room, p } = ctx();
    if (!room || !p) return;
    p.sockets.delete(socket.id);
    socket.leave(room.code);
    socket.data.code = null;
    if (inLobby(room) || !(p.id in room.game.roles)) removePlayer(room, p.id);
    else p.connected = p.sockets.size > 0; // mid-game: keep the seat so the round stays fair
    if (!rooms.has(room.code)) return;
    ensureOwner(room);
    checkAutoStart(room);
    broadcast(room);
  });

  socket.on("disconnect", () => {
    const { room, p } = ctx();
    if (!room || !p) return;
    p.sockets.delete(socket.id);
    p.connected = p.sockets.size > 0;
    if (p.connected) return;
    ensureOwner(room);
    const g = room.game;
    // Offline on your own turn: short grace, then skip.
    if (g && g.phase === "clue" && g.turnOrder[g.turnIdx] === p.id && g.endsAt - Date.now() > ms(OFFLINE_TURN)) {
      g.graceFor = p.id;
      setTimer(room, OFFLINE_TURN, () => recordClue(room, p.id, null));
    }
    if (inLobby(room) || !(p.id in (g?.roles || {}))) scheduleDrop(room, p);
    checkAutoStart(room);
    broadcast(room);
  });
});

const cleanup = setInterval(() => {
  const now = Date.now();
  for (const [code, r] of rooms) if (now - r.touched > ROOM_TTL_MS) { stopGameTimers(r); rooms.delete(code); }
}, 10 * 60 * 1000);
if (cleanup.unref) cleanup.unref();

if (require.main === module) server.listen(PORT, () => console.log(`Undercover running on http://localhost:${PORT}`));
module.exports = { server, rooms, app, io };
