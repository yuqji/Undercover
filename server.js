// Undercover — a real-time online party word game. No human host: every step runs on timers.
// Run: npm install && npm start   (then open http://localhost:3000)
const path = require("path");
const http = require("http");
const express = require("express");
const { Server } = require("socket.io");
const QRCode = require("qrcode");
const crypto = require("crypto");
const WORDS = require("./words");
const rules = require("./rules");
const Bots = require("./bots");
const LLM = require("./llm"); // real AI for AI players, when ANTHROPIC_API_KEY is set

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
const HOUSE_WAIT = 180; // house rooms: a rolling 3-minute clock, even while empty
const HOUSE_FILL = Number(process.env.HOUSE_FILL ?? 4); // AI fills a house room up to this many players
const HOUSE_JOIN_WAIT = Number(process.env.HOUSE_JOIN_WAIT ?? 60); // max wait once a person is in a house room
const PRIVATE_WAIT = Number(process.env.PRIVATE_WAIT || 30); // private rooms: seconds until the start once enough players are in
const PUBLIC_WAIT = 120; // public rooms: seconds until an automatic start once enough players are in
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
// Short invite links: /r/ABCD opens the game and joins room ABCD.
app.get("/r/:code", (_req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));
app.get("/health", (_req, res) => res.send("ok"));
/* ---------- contact form ---------- */
// "Contact us" messages are emailed to the site owner; senders never see the address.
// Set CONTACT_TO (where messages go) and RESEND_API_KEY (from resend.com) on the host.
// Without them, messages are kept in the server log so nothing is lost while setting up.
const contactHits = new Map(); // ip -> [timestamps]
app.post("/api/contact", express.json({ limit: "16kb" }), async (req, res) => {
  const ip = String(req.headers["x-forwarded-for"] || req.socket.remoteAddress || "").split(",")[0].trim();
  const now = Date.now(), recent = (contactHits.get(ip) || []).filter((t) => now - t < 3600e3);
  if (recent.length >= 5) return res.status(429).json({ error: "Too many messages. Please try again later." });
  const message = String(req.body?.message || "").trim().slice(0, 4000);
  const from = String(req.body?.email || "").trim().slice(0, 200);
  const name = String(req.body?.name || "").trim().slice(0, 100);
  if (message.length < 5) return res.status(400).json({ error: "Please write a short message." });
  if (from && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(from)) return res.status(400).json({ error: "That email address doesn't look right." });
  recent.push(now); contactHits.set(ip, recent);
  const text = `New message from the Undercover contact form\n\nName: ${name || "—"}\nReply to: ${from || "—"}\n\n${message}`;
  console.log("[contact]", text.replace(/\n+/g, " | "));
  if (process.env.RESEND_API_KEY && process.env.CONTACT_TO) {
    try {
      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: process.env.CONTACT_FROM || "Undercover <onboarding@resend.dev>", to: [process.env.CONTACT_TO], subject: "Undercover · Contact us" + (name ? ` · ${name}` : ""), text, ...(from ? { reply_to: from } : {}) }),
      });
      if (!r.ok) console.error("[contact] email failed", r.status, await r.text());
    } catch (e) { console.error("[contact] email failed", e.message); }
  }
  res.json({ ok: true });
});

/* ---------- accounts (optional Google sign-in through Supabase) ---------- */
// Set SUPABASE_URL and SUPABASE_ANON_KEY on the host to turn sign-in on. The anon key is the
// public "browser" key; the page needs it too. Signed-in players get a public ID tied to their
// account instead of their browser, so friends follow them to any device.
const SUPA_URL = (process.env.SUPABASE_URL || "").trim().replace(/\/+$/, "").replace(/\/rest\/v1$/, ""); // accepts the URL with or without /rest/v1/
const SUPA_KEY = process.env.SUPABASE_ANON_KEY || "";
// Rough country for the "show my country" flag: from the CDN header if present, otherwise a free IP lookup.
const okCountry = (c) => typeof c === "string" && /^[A-Z]{2}$/.test(c) && c !== "XX" && c !== "T1";
const geoCache = new Map();
app.get("/api/geo", async (req, res) => {
  const h = String(req.headers["cf-ipcountry"] || req.headers["x-country-code"] || "").toUpperCase();
  if (okCountry(h)) return res.json({ country: h });
  const ip = String(req.headers["x-forwarded-for"] || req.socket.remoteAddress || "").split(",")[0].trim();
  if (!ip || /^(127\.|10\.|192\.168\.|::1|::ffff:127\.)/.test(ip)) return res.json({ country: null });
  if (geoCache.has(ip)) return res.json({ country: geoCache.get(ip) });
  try {
    const r = await fetch("https://api.country.is/" + encodeURIComponent(ip), { signal: AbortSignal.timeout(3000) });
    const c = r.ok ? String((await r.json()).country || "").toUpperCase() : "";
    const out = okCountry(c) ? c : null;
    if (geoCache.size > 5000) geoCache.clear();
    geoCache.set(ip, out); res.json({ country: out });
  } catch { res.json({ country: null }); }
});
app.get("/api/ai-status", (req, res) => res.json(LLM.status()));
app.get("/api/config", (_req, res) => res.json({ supabaseUrl: SUPA_URL || null, supabaseKey: SUPA_KEY || null }));
const userCache = new Map(); // access token -> { id, t }
async function verifyUser(access) {
  if (!SUPA_URL || !SUPA_KEY || typeof access !== "string" || access.length > 4000) return null;
  const hit = userCache.get(access);
  if (hit && Date.now() - hit.t < 10 * 60e3) return hit.id;
  try {
    const r = await fetch(SUPA_URL + "/auth/v1/user", { headers: { Authorization: "Bearer " + access, apikey: SUPA_KEY } });
    if (!r.ok) return null;
    const u = await r.json();
    if (!u || !u.id) return null;
    userCache.set(access, { id: u.id, t: Date.now() });
    if (userCache.size > 5000) userCache.delete(userCache.keys().next().value);
    return u.id;
  } catch { return null; }
}

/* ---------- friends ---------- */
// Each browser has a private token (it holds your seat). Friends see only a public ID derived
// from it, which can't be turned back into the token. Friend lists live in each browser;
// the server only knows who is online right now and passes requests and invites along.
const PUB_SALT = process.env.PUB_SALT || "undercover-friends-v1";
const pubId = (token) => crypto.createHash("sha256").update(PUB_SALT + ":" + token).digest("base64url").slice(0, 12);
const online = new Map(); // pubId -> Set(socket.id)
const pending = new Map(); // pubId -> [events waiting for them to come online]
function deliver(toPub, event, data) {
  const ids = online.get(toPub);
  if (ids && ids.size) { for (const id of ids) io.to(id).emit(event, data); return true; }
  const q = (pending.get(toPub) || []).filter((x) => !(x.event === event && x.data.from === data.from)).slice(-20);
  q.push({ event, data, t: Date.now() }); pending.set(toPub, q);
  return false;
}

// Public rooms anyone can browse and join. Private rooms are reachable only by code or link.
app.get("/api/packs", (_req, res) => res.json(WORDS.CATALOG));

app.get("/api/rooms", (_req, res) => {
  res.set("Cache-Control", "no-store");
  res.json(publicRooms().slice(0, 50).map((r) => {
    const here = [...r.players.values()].filter((p) => p.connected);
    return {
      code: r.code,
      owner: r.players.get(r.ownerId)?.name || "",
      house: !!r.system,
      lang: r.settings.lang || "en",
      pubs: here.filter((p) => !p.bot).map((p) => p.pub || pubId(p.id)), // lets a viewer hide rooms with people they blocked
      packIds: r.settings.packs,
      need: Math.max(0, rules.minPlayers(r.settings) - here.length), // players still needed to start
      startsIn: r.autoAt ? Math.max(0, r.autoAt - Date.now()) : null, // ms until the automatic start
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
const NAME_MAX = 25;
// Avatars are indexes into the picture set the page draws (public/index.html AVATARS).
const AVATAR_COUNT = 24;
const okAvatar = (a) => Number.isInteger(a) && a >= 0 && a < AVATAR_COUNT;
function freeAvatar(room) {
  const used = new Set([...room.players.values()].map((x) => x.avatar));
  const free = [...Array(AVATAR_COUNT).keys()].filter((i) => !used.has(i));
  const pool = free.length ? free : [...Array(AVATAR_COUNT).keys()];
  return pool[Math.floor(Math.random() * pool.length)];
}
// Links of any kind (http://, www., something.com, discord.gg/…) are not allowed in chat or names.
const TLDS = "com|net|org|io|gg|me|co|ly|app|xyz|info|biz|us|uk|ca|cn|tv|link|site|online|club|top|shop|store|live|dev|ai|to|cc|ru|de|fr|jp|kr|in|au|nl|es|it|br|onion|page|fun|vip|win|bet|cash|money|click|lol|pro|one|world|cloud|email";
const LINK_RE = new RegExp(`(https?:|ftp:|www\\.|:\\/\\/|\\b[a-z0-9-]+\\.(?:${TLDS})\\b|\\b[a-z0-9-]+(?:\\s*[\\(\\[]\\s*dot\\s*[\\)\\]]\\s*|\\s+dot\\s+)(?:com|net|org|gg|io)\\b)`, "i");
const hasLink = (t) => LINK_RE.test(String(t || ""));
// Links to this site itself (e.g. a room's invite link) are fine in chat.
const OWN_HOSTS = (process.env.SITE_HOSTS || "undercover-party.onrender.com").split(",").map((h) => h.trim().toLowerCase()).filter(Boolean);
const OWN_LINK_RE = new RegExp(`(?:https?:\\/\\/)?(?:www\\.)?(?:${OWN_HOSTS.map((h) => h.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})(?:\\/[^\\s]*)?`, "gi");
const hasOutsideLink = (t) => hasLink(String(t || "").replace(OWN_LINK_RE, " "));
const cleanName = (n) => String(n || "").replace(/[\u0000-\u001f<>]/g, "").replace(/\s+/g, " ").trim().slice(0, NAME_MAX);

// The room owner's choices: undercover count, Mr. White and word packs (any mix, at least one).
const LANGS = ["en", "zh"];
const basicPack = (lang) => (lang === "zh" ? "zh_basic" : "basic");
function applySettings(room, s) {
  // Language first: switching it swaps the word packs over to that language.
  if (LANGS.includes(s.lang) && s.lang !== room.settings.lang) { room.settings.lang = s.lang; room.settings.packs = [basicPack(s.lang)]; }
  if (s.undercovers === "auto" || [1, 2, 3, 4].includes(s.undercovers)) room.settings.undercovers = s.undercovers;
  if (typeof s.mrWhite === "boolean") room.settings.mrWhite = s.mrWhite;
  if (typeof s.whiteHint === "boolean") room.settings.whiteHint = s.whiteHint;
  if (Array.isArray(s.packs)) {
    const lang = room.settings.lang || "en";
    const valid = s.packs.filter((id) => typeof id === "string" && WORDS.PACKS[id] && WORDS.PACKS[id].lang === lang);
    if (valid.length) room.settings.packs = [...new Set(valid)]; // an empty choice keeps the current packs
  }
}

function makeRoom(ownerId) {
  return {
    code: newCode(),
    ownerId, // the room owner only picks settings; the game itself runs automatically
    players: new Map(), // id -> {id,name,connected,sockets:Set,score,joinedAt,ready,dropTimer}
    settings: { undercovers: "auto", mrWhite: false, whiteHint: true, packs: ["basic"], visibility: "private", lang: "en" },
    usedPairs: new Set(),
    game: null,
    gameNo: 0,
    startAt: null,
    autoAt: null,
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
    .filter((r) => r.settings.visibility === "public" && r.players.size < MAX_PLAYERS && (r.system || [...r.players.values()].some((p) => !p.bot && p.connected)))
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
    if (room.system) resetHouseRoom(room); // a house room stays open for the next visitors
    else rooms.delete(room.code);
    maintainHouseRooms();
    return;
  }
  ensureOwner(room);
}

/* ---------- house rooms: public rooms that are always there to join ---------- */
// So the home page never shows an empty list, the server keeps its own public rooms waiting for
// players (one random word pack each). The first person in a house room runs it.
// House rooms: the site keeps PUBLIC_POOL of its own public rooms open to join (players' own public
// rooms don't count and have no limit), but adds them one at a time — at least HOUSE_GAP seconds apart — so their start clocks are spread out instead of all
// starting together. When one fills up or starts its game, a replacement follows (also staggered).
const PUBLIC_POOL = Number(process.env.PUBLIC_POOL ?? 3); // English house rooms
const ZH_POOL = Number(process.env.ZH_POOL ?? 2); // Chinese house rooms
const POOLS = { en: PUBLIC_POOL, zh: ZH_POOL };
const HOUSE_GAP = Number(process.env.HOUSE_GAP ?? 60);
const lastHouseAt = {}, houseNext = {};
function randomPacks(lang = "en", avoid = []) {
  const ids = Object.keys(WORDS.PACKS).filter((id) => WORDS.PACKS[id].lang === lang).sort(() => Math.random() - 0.5);
  const fresh = ids.filter((id) => !avoid.includes(id));
  return (fresh.length ? fresh : ids).slice(0, 1); // one theme per house room, different from the others open
}
const housePacksInUse = (except) => [...rooms.values()].filter((r) => r.system && r !== except).flatMap((r) => r.settings.packs);
function makeHouseRoom(lang = "en") {
  const room = makeRoom(null);
  room.system = true;
  room.settings.visibility = "public";
  room.settings.lang = lang;
  room.settings.packs = randomPacks(lang, housePacksInUse());
  rooms.set(room.code, room);
  lastHouseAt[lang] = Date.now();
  checkAutoStart(room);
  return room;
}
function resetHouseRoom(room) {
  for (const p of room.players.values()) clearTimeout(p.dropTimer);
  room.players.clear();
  room.game = null;
  room.ownerId = null;
  room.chat = [];
  room.autoFilled = false; room.lastPeople = 0;
  const lang = room.settings.lang || "en";
  room.settings = { undercovers: "auto", mrWhite: false, whiteHint: true, packs: randomPacks(lang, housePacksInUse(room)), visibility: "public", lang };
  room.touched = Date.now();
}
function maintainHouseRooms() {
  const joinable = (r) => inLobby(r) && r.players.size < MAX_PLAYERS;
  for (const [lang, pool] of Object.entries(POOLS)) {
    let open = [...rooms.values()].filter((r) => r.system && (r.settings.lang || "en") === lang && joinable(r));
    // People left and there are more empty house rooms than needed: close the extras.
    for (const r of open.filter((x) => !x.players.size)) {
      if (open.length <= pool) break;
      rooms.delete(r.code);
      open = open.filter((x) => x !== r);
    }
    if (open.length < pool) {
      const wait = (lastHouseAt[lang] || 0) + ms(HOUSE_GAP) - Date.now();
      const made = !open.length || wait <= 0;
      if (made) { makeHouseRoom(lang); open.push(null); }
      clearTimeout(houseNext[lang]); houseNext[lang] = null;
      if (open.length < pool) houseNext[lang] = setTimeout(maintainHouseRooms, (made ? ms(HOUSE_GAP) : wait) + 50);
    }
  }
  for (const r of rooms.values()) if (r.system && inLobby(r) && !r.autoTimer) checkAutoStart(r); // e.g. after a game ends
}

/* ---------- auto start: everyone Ready → 3, 2, 1 ---------- */
function addBotTo(room) {
  const id = "bot-" + Math.random().toString(36).slice(2, 10);
  const name = Bots.botName([...room.players.values()].map((x) => x.name), room.settings.lang);
  const bot = { id, name, avatar: freeAvatar(room), bot: true, connected: true, sockets: new Set(), score: 0, joinedAt: Date.now(), ready: true, dropTimer: null };
  room.players.set(id, bot);
  return bot;
}
function scheduleAuto(room, secs) {
  room.autoAt = Date.now() + ms(secs);
  room.autoTimer = setTimeout(() => {
    room.autoTimer = null;
    room.autoAt = null;
    if (!rooms.has(room.code) || !inLobby(room)) return;
    const here = [...room.players.values()].filter((p) => p.connected);
    // House rooms never leave a person waiting: when the clock runs out, AI players fill the empty seats.
    if (room.system && here.some((p) => !p.bot)) {
      const target = Math.min(MAX_PLAYERS, rules.minPlayers(room.settings));
      while (here.length < target) here.push(addBotTo(room));
    }
    if (here.some((p) => !p.bot) && !rules.checkSetup(here.length, room.settings)) {
      const err = startGame(room);
      if (err) io.to(room.code).emit("problem", err);
    } else checkAutoStart(room); // not enough players yet: a house room starts its clock over
    broadcast(room);
  }, ms(secs));
}
// House rooms are never short of players: when the first person walks in, AI players fill it up to
// HOUSE_FILL. After that the owner is in charge — AI players they remove stay removed, ones they add
// stay — and each new person who joins takes the seat of an auto-added AI player.
// With no people left, the AI players go and the room starts fresh.
function balanceHouseBots(room) {
  if (!room.system || !inLobby(room)) return;
  const people = humans(room).length;
  const allBots = [...room.players.values()].filter((p) => p.bot);
  if (!people) { for (const b of allBots) room.players.delete(b.id); room.autoFilled = false; room.lastPeople = 0; return; }
  const target = Math.min(MAX_PLAYERS, Math.max(rules.minPlayers(room.settings), HOUSE_FILL));
  if (!room.autoFilled) {
    room.autoFilled = true; room.lastPeople = people;
    while (room.players.size < target) addBotTo(room);
    return;
  }
  // A new person arrived: drop auto-added AI players so the room doesn't grow past the target.
  const autos = allBots.filter((p) => !p.manual);
  while (autos.length && room.players.size > target && people > (room.lastPeople || 0)) room.players.delete(autos.pop().id);
  room.lastPeople = people;
}
function checkAutoStart(room) {
  if (!inLobby(room)) return;
  balanceHouseBots(room);
  const here = [...room.players.values()].filter((p) => p.connected);
  // At least one person must be here — AI players never start a game on their own.
  const people = here.some((p) => !p.bot);
  const okSize = !rules.checkSetup(here.length, room.settings);
  // Nobody taps Ready: being in the room means you're in. Games start on a clock.
  // House rooms run a rolling 3-minute clock, even when empty (no players → it starts over).
  // Other rooms start their clock once there are enough players: 2 minutes in a public room,
  // 30 seconds in a private one. The room owner can always start sooner with "Start now".
  if (room.system) {
    if (!room.autoTimer) scheduleAuto(room, people ? HOUSE_JOIN_WAIT : HOUSE_WAIT);
    // Someone just walked into an empty house room: they wait at most HOUSE_JOIN_WAIT, not the full clock.
    else if (people && room.autoAt - Date.now() > ms(HOUSE_JOIN_WAIT)) { clearTimeout(room.autoTimer); room.autoTimer = null; scheduleAuto(room, HOUSE_JOIN_WAIT); }
  } else if (people && okSize) {
    if (!room.autoTimer) scheduleAuto(room, room.settings.visibility === "public" ? PUBLIC_WAIT : PRIVATE_WAIT);
  } else if (room.autoTimer) {
    clearTimeout(room.autoTimer);
    room.autoTimer = null;
    room.autoAt = null;
  }
  if (room.startTimer && !(people && okSize)) {
    clearTimeout(room.startTimer);
    room.startTimer = null;
    room.startAt = null;
  }
}

// The owner's "Start now": a 3-second countdown, then the game.
function startSoon(room) {
  if (room.startTimer) return;
  room.startAt = Date.now() + ms(START_COUNTDOWN);
  room.startTimer = setTimeout(() => {
    room.startTimer = null;
    room.startAt = null;
    if (!inLobby(room)) return;
    const err = startGame(room);
    if (err) io.to(room.code).emit("problem", err);
    broadcast(room);
  }, ms(START_COUNTDOWN));
}

/* ---------------- game ---------------- */
function stopGameTimers(room) {
  clearTimeout(room.autoTimer);
  room.autoTimer = null;
  room.autoAt = null;
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
  clearTimeout(room.autoTimer); room.autoTimer = null; room.autoAt = null;
  setTimeout(maintainHouseRooms, 0);
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
  // Mr. White's hint: a word close to the Civilians' word (never either secret word or a form of it).
  const near = Bots.assocOf(pair[0]).filter((c) => !rules.checkClue(c, pair[0], []).error && !rules.checkClue(c, pair[1], []).error);
  const hintWord = near.length ? near[Math.floor(Math.random() * near.length)] : category;

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
    category, // used by AI players
    hintWord, // shown only to Mr. White, and only once they've had to speak first
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
  // Mr. White opening a round has nothing to go on — give them a hint word.
  // (The room owner can switch this hint off when creating the room.)
  if (g.roles[g.turnOrder[0]] === "white" && room.settings.whiteHint !== false) g.whiteHint = true;
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

// Someone still in the game walks out: they count as out (role revealed, no points this game),
// and the round carries on without them — exactly as if they'd been voted out.
function forfeit(room, id) {
  const g = room.game;
  if (!g || g.phase === "over" || !g.alive.includes(id)) return;
  (g.left ||= {})[id] = true;
  g.alive = g.alive.filter((x) => x !== id);
  g.outRoles[id] = g.roles[id];
  delete g.votes[id];
  for (const [voter, target] of Object.entries(g.votes)) if (target === id) delete g.votes[voter];
  if (g.candidates) g.candidates = g.candidates.filter((x) => x !== id);
  const w = rules.winner(g.alive, g.roles);
  if (w) return endGame(room, w);
  if (g.phase === "clue") {
    const i = g.turnOrder.indexOf(id);
    if (i > g.turnIdx) g.turnOrder.splice(i, 1);
    else if (i === g.turnIdx) { g.turnOrder.splice(i, 1); startTurn(room); }
  } else if (g.phase === "whiteguess" && g.lastResult?.id === id) return whiteGuessed(room, null);
  else if (g.phase === "vote" && g.candidates && g.candidates.length < 2) g.candidates = null; // a tied player left: everyone is votable again
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
    if (g.left && g.left[id]) continue; // left mid-game: no points
    const p = room.players.get(id);
    if (p) p.score += pts;
  }
  // Offline players are dropped from the room between games.
  for (const p of [...room.players.values()]) if (!p.connected) scheduleDrop(room, p);
  checkAutoStart(room); // public rooms: start the clock for the next game
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
    id: p.id, pub: p.bot ? null : p.pub || pubId(p.id), name: p.name, avatar: p.avatar ?? 0, country: p.country || null, named: !!(p.named || p.bot), connected: p.connected, score: p.score, ready: p.ready, bot: !!p.bot,
    inGame: !!(g && p.id in g.roles), alive: !!(g && g.alive.includes(p.id)),
  }));
  const here = players.filter((p) => p.connected).length;
  const plan = { undercovers: rules.undercoverCount(Math.max(here, 3), room.settings), need: rules.minPlayers(room.settings), auto: rules.autoUndercovers(Math.max(here, 3)) };
  const v = { code: room.code, house: !!room.system, ownerId: room.ownerId, you: pid, players, chat: room.chat, plan, settings: room.settings, packs: WORDS.CATALOG, times: { clue: CLUE_SECS, vote: VOTE_SECS }, gameNo: room.gameNo, startAt: room.startAt, autoAt: room.autoAt || null, now: Date.now(), game: null };
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
    // How many hidden players are still in — a count only, never who.
    left: { und: g.alive.filter((id) => g.roles[id] === "und").length, white: g.alive.filter((id) => g.roles[id] === "white").length },
    whiteGuess: g.whiteGuess,
    winner: g.winner,
    // What *this* player knows about themself. The Undercover is NOT told they are the Undercover.
    me: !myRole ? { spectator: true } : myRole === "white" ? { white: true, hint: g.whiteHint ? g.hintWord : null } : { word: g.words[myRole] },
    reveal: g.phase === "over" ? { roles: g.roles, words: g.words, category: g.category } : null,
    whiteId: g.phase === "whiteguess" ? g.lastResult.id : null,
    leftIds: Object.keys(g.left || {}),
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
    if (room.players.get(pid)?.bot) later("clue" + g.turnIdx, 1.5 + Math.random() * 3, async () => {
      if (g.phase !== "clue" || g.turnOrder[g.turnIdx] !== pid) return;
      const used = g.clues.map((c) => c.word).filter(Boolean);
      const role = g.roles[pid], myWord = role === "white" ? null : g.words[role];
      // Real AI first (when switched on); the word-list AI covers anything it gets wrong.
      let check = { error: "none" };
      if (LLM.enabled()) {
        const w = await LLM.clue(g, pid, room.settings.lang);
        if (room.game !== g || g.phase !== "clue" || g.turnOrder[g.turnIdx] !== pid) return;
        if (w) check = rules.checkClue(w, myWord, used);
        if (!check.error && role !== "white" && rules.revealsWord(check.word, g.words[role === "civ" ? "und" : "civ"])) check = { error: "names the other word" };
      }
      if (check.error) {
        const w = role === "white" ? Bots.whiteClue(g, packs, used) : Bots.smartClue(g, pid);
        check = w ? rules.checkClue(w, myWord, used) : { error: "none" };
      }
      recordClue(room, pid, check.error ? null : check.word);
    });
  }
  if (g.phase === "vote") {
    for (const pid of g.alive) {
      if (!room.players.get(pid)?.bot) continue;
      later((g.revote ? "revote" : "vote") + pid, 3 + Math.random() * 7, async () => {
        const targets = voteTargets(g, pid);
        // Real AI reads the clues; a share of hunch votes keeps AI players beatable.
        let t = LLM.enabled() && Math.random() > 0.25 ? await LLM.vote(g, pid, targets, room.settings.lang) : null;
        if (room.game !== g || g.phase !== "vote" || !g.alive.includes(pid)) return;
        if (!t || !voteTargets(g, pid).includes(t)) t = Bots.chooseVote(g, pid, voteTargets(g, pid), packs);
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

  // Friends: say who you are once connected, so friends can see you're online.
  // Also sent again after signing in or out, with the account's access token.
  socket.on("hello", async ({ token, access } = {}) => {
    if (!token || typeof token !== "string" || token.length > 80) return;
    const uid = access ? await verifyUser(access) : null;
    const me = uid ? pubId("acct:" + uid) : pubId(token);
    if (socket.data.pub === me) return socket.emit("me", { pub: me, account: !!uid });
    if (socket.data.pub) { const old = online.get(socket.data.pub); if (old) { old.delete(socket.id); if (!old.size) online.delete(socket.data.pub); } }
    socket.data.pub = me;
    socket.data.uid = uid;
    if (!online.has(me)) online.set(me, new Set());
    online.get(me).add(socket.id);
    socket.emit("me", { pub: me, account: !!uid });
    for (const x of pending.get(me) || []) if (Date.now() - x.t < 7 * 864e5) socket.emit(x.event, x.data);
    pending.delete(me);
    const { room, p } = ctx();
    if (room && p) { p.pub = me; broadcast(room); }
  });
  const sent = [];
  const tooFast = () => { const now = Date.now(); while (sent.length && now - sent[0] > 60e3) sent.shift(); if (sent.length >= 20) return true; sent.push(now); return false; };
  const profile = (p = {}) => ({ name: String(p.name || "Player").slice(0, 25), avatar: Number.isInteger(p.avatar) ? p.avatar : 0 });
  socket.on("friendRequest", ({ to, me } = {}) => {
    if (!socket.data.pub || typeof to !== "string" || to === socket.data.pub || tooFast()) return;
    deliver(to, "friendRequest", { from: socket.data.pub, ...profile(me) });
  });
  socket.on("friendAccept", ({ to, me } = {}) => {
    if (!socket.data.pub || typeof to !== "string" || tooFast()) return;
    deliver(to, "friendAccepted", { from: socket.data.pub, ...profile(me) });
  });
  // Which of these friends are online, and where (room code, and whether a game is running).
  socket.on("presence", (list, ack) => {
    if (typeof ack !== "function" || !Array.isArray(list)) return;
    ack(list.slice(0, 200).map((id) => {
      const ids = online.get(id);
      if (!ids || !ids.size) return { pub: id, online: false };
      let where = null;
      for (const sid of ids) { const c = io.sockets.sockets.get(sid)?.data.code; if (c && rooms.has(c)) where = c; }
      const r = where && rooms.get(where);
      return { pub: id, online: true, room: where, playing: !!(r && !inLobby(r)) };
    }));
  });
  socket.on("invite", ({ to, me } = {}) => {
    const { room } = ctx();
    if (!room || !socket.data.pub || typeof to !== "string" || tooFast()) return;
    deliver(to, "invite", { from: socket.data.pub, ...profile(me), code: room.code });
  });
  const ctx = () => {
    const room = rooms.get(socket.data.code);
    const p = room && room.players.get(socket.data.pid);
    return { room, p };
  };

  function attach(room, p) {
    socket.data.code = room.code;
    socket.data.pid = p.id;
    if (socket.data.pub) p.pub = socket.data.pub;
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
    let k = 2; while (nameTaken(room, `${base.slice(0, NAME_MAX - 3)} ${k}`)) k++;
    return `${base.slice(0, NAME_MAX - 3)} ${k}`;
  }
  function seat(room, token, rawName, rawAvatar, rawCountry) {
    const wanted = cleanName(rawName);
    let name = wanted ? freeName(room, wanted) : null;
    if (!name) { let k = room.players.size + 1; while (nameTaken(room, "Player " + k)) k++; name = "Player " + k; }
    const p = { id: token, name, avatar: okAvatar(rawAvatar) ? rawAvatar : freeAvatar(room), country: okCountry(rawCountry) ? rawCountry : null, named: !!wanted, connected: true, sockets: new Set(), score: 0, joinedAt: Date.now(), ready: false, dropTimer: null };
    room.players.set(token, p);
    return p;
  }

  // Public or private is chosen when the room is created and stays that way.
  socket.on("create", ({ name, avatar, country, token, visibility, settings } = {}) => {
    if (!token || typeof token !== "string" || token.length > 80) return fail("Refresh the page and try again.");
    const room = makeRoom(token);
    room.settings.visibility = visibility === "public" ? "public" : "private";
    if (settings && typeof settings === "object") applySettings(room, settings);
    rooms.set(room.code, room);
    attach(room, seat(room, token, name, avatar, country));
  });

  function joinRoom(room, name, token, avatar, country) {
    const back = room.players.get(token);
    if (back) { if (country !== undefined) back.country = okCountry(country) ? country : null; return attach(room, back); } // reconnect: same seat, same word
    if (room.players.size >= MAX_PLAYERS && room.system && inLobby(room)) { // a person takes an AI player's seat
      const bots = [...room.players.values()].filter((p) => p.bot), bot = bots.find((p) => !p.manual) || bots[0]; if (bot) room.players.delete(bot.id);
    }
    if (room.players.size >= MAX_PLAYERS) return fail("This room is full (16 players).");
    attach(room, seat(room, token, name, avatar, country));
  }
  const badToken = (t) => !t || typeof t !== "string" || t.length > 80;

  socket.on("join", ({ code, name, avatar, country, token } = {}) => {
    code = String(code || "").toUpperCase().trim();
    const room = rooms.get(code);
    if (!room) return fail(`No room called ${code || "that"}. Check the code and try again.`);
    if (badToken(token)) return fail("Refresh the page and try again.");
    if (room.banned && room.banned.has(token)) return fail("The room owner removed you from this room.");
    joinRoom(room, name, token, avatar, country);
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
  // Takes a plain name, or { name, avatar }.
  socket.on("rename", (arg, ack) => {
    const reply = typeof ack === "function" ? ack : () => {};
    const raw = arg && typeof arg === "object" ? arg.name : arg;
    const avatar = arg && typeof arg === "object" ? arg.avatar : undefined;
    const { room, p } = ctx();
    if (!room || !p) return reply({ error: "You're not in a room." });
    if (room.game && !inLobby(room) && p.id in room.game.roles) return reply({ error: "You can change your name after this game." });
    const typed = String(raw || "").replace(/\s+/g, " ").trim();
    if (typed.length > NAME_MAX) return reply({ error: `Names can be up to ${NAME_MAX} characters.` });
    const name = cleanName(raw);
    if (!name) return reply({ error: "Type a name first." });
    if (hasLink(name)) return reply({ error: "Names can't contain links." });
    if (nameTaken(room, name, p.id)) return reply({ error: `Someone here is already called ${name}. Add an initial?` });
    p.name = name;
    p.named = true;
    if (okAvatar(avatar)) p.avatar = avatar;
    for (const m of room.chat) if (m.id === p.id) m.name = name;
    reply({ ok: true, name, avatar: p.avatar });
    broadcast(room);
  });

  // Change your picture any time, even mid-game (your name is locked while you're playing).
  socket.on("avatar", (a) => {
    const { room, p } = ctx();
    if (!room || !p || !okAvatar(a)) return;
    p.avatar = a;
    broadcast(room);
  });

  // Show or hide your country flag (null hides it). Any time.
  socket.on("country", (c) => {
    const { room, p } = ctx();
    if (!room || !p) return;
    p.country = okCountry(c) ? c : null;
    broadcast(room);
  });

  // Room owner: skip the wait and start in 3 seconds (needs enough players).
  socket.on("start", () => {
    const { room, p } = ctx();
    if (!room || room.ownerId !== p?.id || !inLobby(room)) return;
    const n = [...room.players.values()].filter((x) => x.connected).length;
    const err = rules.checkSetup(n, room.settings);
    if (err) return fail(err);
    startSoon(room);
    broadcast(room);
  });

  socket.on("settings", (s = {}) => {
    const { room, p } = ctx();
    if (!room || room.ownerId !== p?.id || !inLobby(room)) return;
    applySettings(room, s);
    const gameplay = "undercovers" in s || "mrWhite" in s || "packs" in s;
    checkAutoStart(room);
    broadcast(room);
  });

  socket.on("addBot", () => {
    const { room, p } = ctx();
    if (!room || room.ownerId !== p?.id || !inLobby(room)) return;
    if (room.players.size >= MAX_PLAYERS) return fail("This room is full (16 players).");
    addBotTo(room).manual = true; // added by hand: never taken away to make room
    checkAutoStart(room);
    broadcast(room);
  });

  // The room owner removes a player — in the lobby, or mid-game (they count as out, role shown).
  // A removed person can't come back into this room.
  socket.on("kick", (id) => {
    const { room, p } = ctx();
    if (!room || room.ownerId !== p?.id || id === p.id) return;
    const k = room.players.get(id);
    if (!k) return;
    if (!k.bot) (room.banned ||= new Set()).add(id);
    for (const sid of k.sockets) { io.to(sid).emit("kicked"); const so = io.sockets.sockets.get(sid); if (so) { so.leave(room.code); so.data.code = null; } }
    if (!inLobby(room) && room.game && id in room.game.roles) {
      forfeit(room, id);
      k.sockets.clear(); k.connected = false; // keeps the seat (shown as out) until this game ends
      if (room.game?.phase === "over") scheduleDrop(room, k);
      broadcast(room);
      return;
    }
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
    if (hasOutsideLink(text)) return reply({ error: "Only links to this game are allowed in chat." });
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
    // Walking out mid-game while still in it counts as being out (see forfeit).
    if (!inLobby(room) && room.game.alive.includes(p.id)) forfeit(room, p.id);
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
    if (socket.data.pub) { const set = online.get(socket.data.pub); if (set) { set.delete(socket.id); if (!set.size) online.delete(socket.data.pub); } }
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

maintainHouseRooms();
const houseTick = setInterval(maintainHouseRooms, 15 * 1000);
if (houseTick.unref) houseTick.unref();
const cleanup = setInterval(() => {
  const now = Date.now();
  for (const [code, r] of rooms) if (now - r.touched > ROOM_TTL_MS && !(r.system && !r.players.size)) { stopGameTimers(r); rooms.delete(code); }
  maintainHouseRooms();
}, 10 * 60 * 1000);
if (cleanup.unref) cleanup.unref();

if (require.main === module) server.listen(PORT, () => console.log(`Undercover running on http://localhost:${PORT}`));
module.exports = { server, rooms, app, io };
