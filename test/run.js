// End-to-end test: rules + a full simulated game with 5 phones.  Run: npm test
const assert = require("assert/strict");
const { io: Client } = require("socket.io-client");
const R = require("../rules");
const WORDS = require("../words");
const PAIRS = WORDS.ALL.map((w) => [w.a, w.b, w.hint]);

let passed = 0;
const ok = (name, fn) => { fn(); passed++; console.log("  ✓", name); };

console.log("Rules");
ok("blocks own word, plurals, parts, and compounds", () => {
  for (const [clue, word] of [["Tiger", "tiger"], ["tigers", "Tiger"], ["TIGER", "Tiger"], ["pancakes", "Pancake"], ["cake", "Pancake"], ["cream", "Ice cream"], ["icecream", "Ice cream"], ["Zooms", "Zoom"], ["café", "Cafe"]])
    assert.ok(R.checkClue(clue, word).error, `${clue} should be blocked for ${word}`);
});
ok("allows fair clues", () => {
  for (const [clue, word] of [["stripes", "Tiger"], ["syrup", "Pancake"], ["cold", "Ice cream"], ["video", "Zoom"], ["latte", "Cafe"]])
    assert.equal(R.checkClue(clue, word).word, clue);
});
ok("one word only, no symbols, no repeats", () => {
  assert.match(R.checkClue("big cat", "Tiger").error, /One word/);
  assert.match(R.checkClue("  ", "Tiger").error, /Type a clue/);
  assert.match(R.checkClue("🐯", "Tiger").error, /Letters only/);
  assert.match(R.checkClue("a".repeat(21), "Tiger").error, /under 20/);
  assert.match(R.checkClue("Stripes", "Tiger", ["stripes"]).error, /already used/);
  assert.equal(R.checkClue("don't", "Tiger").word, "don't");
  assert.equal(R.checkClue("well-known", "Tiger").word, "well-known");
});
ok("anyone can speak first, Mr. White included (5,000 shuffles)", () => {
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const roles = { a: "civ", b: "civ", c: "und", d: "white" }, firsts = new Set();
  for (let i = 0; i < 5000; i++) firsts.add(roles[R.speakingOrder(["a", "b", "c", "d"], roles, shuffle)[0]]);
  assert.deepEqual([...firsts].sort(), ["civ", "und", "white"]);
});
ok("every word pair has a category hint", () => assert.ok(PAIRS.every((p) => typeof p[2] === "string" && p[2].length)));
ok("undercover may speak first when there is no Mr. White", () => {
  const shuffle = (a) => a.slice().reverse();
  assert.equal(R.speakingOrder(["a", "b", "u"], { a: "civ", b: "civ", u: "und" }, shuffle)[0], "u");
});
ok("vote tally: majority, tie → re-vote, second tie → nobody", () => {
  assert.deepEqual(R.tally({ a: "c", b: "c", c: "a" }, ["a", "b", "c"], false).eliminated, "c");
  const t = R.tally({ a: "b", b: "a", c: "d", d: "c" }, ["a", "b", "c", "d"], false);
  assert.equal(t.outcome, "revote"); assert.deepEqual(t.tied, ["a", "b", "c", "d"]);
  assert.equal(R.tally({ a: "b", b: "a" }, ["a", "b"], true).outcome, "none");
  assert.equal(R.tally({}, ["a", "b"], false).outcome, "none");
});
ok("win conditions", () => {
  assert.equal(R.winner(["a", "b"], { a: "civ", b: "civ", u: "und" }), "civ");
  assert.equal(R.winner(["a", "u"], { a: "civ", u: "und" }), "imp");
  assert.equal(R.winner(["a", "b", "u"], { a: "civ", b: "civ", u: "und" }), null);
});
ok("auto Undercover count scales with players and keeps impostors a minority", () => {
  const A = { undercovers: "auto", mrWhite: false }, AW = { undercovers: "auto", mrWhite: true };
  assert.deepEqual([3, 5, 6, 9, 10, 13, 14, 16].map((n) => R.undercoverCount(n, A)), [1, 1, 2, 2, 3, 3, 4, 4]);
  assert.equal(R.undercoverCount(6, AW), 2 - 1 + 0 || 1); // 2 + Mr. White would be 3 of 6: drops to 1
  assert.equal(R.undercoverCount(9, AW), 2);
  assert.equal(R.checkSetup(3, A), null);
  assert.equal(R.minPlayers(AW), 5);
  assert.equal(R.undercoverCount(8, { undercovers: 3, mrWhite: false }), 3);
});
ok("setup minimums", () => {
  assert.equal(R.checkSetup(3, { undercovers: 1, mrWhite: false }), null);
  assert.ok(R.checkSetup(4, { undercovers: 1, mrWhite: true }));
  assert.equal(R.checkSetup(5, { undercovers: 1, mrWhite: true }), null);
  assert.ok(R.checkSetup(4, { undercovers: 2, mrWhite: false }));
});
ok("every pack has enough words, Basic is always on", () => {
  for (const p of WORDS.CATALOG) assert.ok(p.count >= 20, p.id + " has " + p.count);
  assert.ok(WORDS.CATALOG.find((p) => p.id === "basic").always);
});
ok("no word is used in two different pairs", () => {
  const seen = new Map();
  for (const w of WORDS.ALL) for (const x of [w.a, w.b]) {
    const k = R.norm(x);
    assert.ok(!seen.has(k), `${x} is in ${seen.get(k)} and ${w.pack}`);
    seen.set(k, w.pack);
  }
});
ok("word list has no duplicate or self-revealing pairs", () => {
  const seen = new Set();
  for (const [a, b] of PAIRS) {
    const k = [a, b].map(R.norm).sort().join("|");
    assert.ok(!seen.has(k), "duplicate " + k); seen.add(k);
    assert.ok(!R.sameWord(a, b), `${a}/${b} too similar`);
  }
});

console.log("AI players");
const B = require("../bots");
ok("every word has at least 5 usable AI clues", () => {
  for (const w of WORDS.ALL) for (const [x, y] of [[w.a, w.b], [w.b, w.a]]) {
    const usable = B.assocOf(x).filter((c) => !R.checkClue(c, x, []).error && !R.revealsWord(c, y));
    assert.ok(usable.length >= 5, `${x} has only ${usable.length}`);
  }
});
ok("AI clues are always legal and never name either word (2,000 tries)", () => {
  for (let i = 0; i < 2000; i++) {
    const w = WORDS.ALL[i % WORDS.ALL.length], c = B.clueFor(w.a, []);
    assert.ok(c && !R.checkClue(c, w.a, []).error && !R.revealsWord(c, w.b), `${w.a} → ${c}`);
  }
});
ok("AI never votes for itself or outside the allowed targets", () => {
  const g = { roles: { a: "civ", b: "civ", c: "und" }, words: { civ: "Tiger", und: "Lion" }, clues: [{ id: "a", word: "stripes" }, { id: "b", word: "orange" }, { id: "c", word: "mane" }], alive: ["a", "b", "c"] };
  for (let i = 0; i < 500; i++) assert.ok(["b", "c"].includes(B.chooseVote(g, "a", ["b", "c"], ["basic"])));
});
ok("AI civilians usually spot an obvious undercover", () => {
  const g = { roles: { a: "civ", b: "civ", c: "civ", d: "und" }, words: { civ: "Tiger", und: "Lion" }, clues: [{ id: "a", word: "stripes" }, { id: "b", word: "orange" }, { id: "c", word: "jungle" }, { id: "d", word: "mane" }], alive: ["a", "b", "c", "d"] };
  let hit = 0; for (let i = 0; i < 400; i++) if (B.chooseVote(g, "a", ["b", "c", "d"], ["basic"]) === "d") hit++;
  assert.ok(hit > 200, "only " + hit);
});

/* ---------------- integration ---------------- */
async function main() {
  process.env.TIME_SCALE = "0.02"; // 45s clue → 0.9s, 30s vote → 0.6s, etc.
  const { server, rooms } = require("../server");
  await new Promise((r) => server.listen(0, r));
  const url = "http://localhost:" + server.address().port;
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  function phone(name, token = "tok-" + name) {
    const s = Client(url, { transports: ["websocket"], forceNew: true });
    const ph = { name, s, token, state: null, problems: [], frames: [] };
    s.on("state", (st) => { ph.state = st; ph.frames.push(JSON.stringify(st)); });
    s.on("problem", (m) => ph.problems.push(m));
    return ph;
  }
  const until = async (fn, label, tries = 400) => { for (let i = 0; i < tries; i++) { if (fn()) return; await wait(10); } throw new Error("timeout: " + label); };
  const emitAck = (ph, ev, arg) => new Promise((r) => ph.s.emit(ev, arg, r));
  const G = (p = P[0]) => p.state.game;

  console.log("Live game (5 phones, no host)");
  const names = ["Maya", "Jordan", "Priya", "Sam", "Leo"];
  const P = names.map((n) => phone(n));
  const byId = Object.fromEntries(P.map((p) => [p.token, p]));
  await until(() => P.every((p) => p.s.connected), "connect");
  P[0].s.emit("create", { name: "Maya", token: P[0].token });
  await until(() => P[0].state, "create");
  const code = P[0].state.code;
  for (const p of P.slice(1)) p.s.emit("join", { code, name: p.name, token: p.token });
  await until(() => P.every((p) => p.state && p.state.players.length === 5), "join");
  ok("five players in one room; Maya owns the settings", () => assert.equal(P[0].state.ownerId, P[0].token));

  const dupe = phone("Dupe", "tok-x");
  await until(() => dupe.s.connected, "dupe");
  dupe.s.emit("join", { code, token: "tok-x" });
  await until(() => dupe.state, "nameless join");
  ok("you can enter a room before picking a name (placeholder shown)", () => {
    const me = dupe.state.players.find((p) => p.id === "tok-x");
    assert.ok(!me.named && /^Player \d+$/.test(me.name));
  });
  dupe.s.emit("ready", true);
  await until(() => dupe.problems.some((m) => /Pick your name/.test(m)), "ready blocked");
  ok("can't Ready up until you've picked a name", () => assert.ok(!dupe.state.players.find((p) => p.id === "tok-x").ready));
  let rn = await emitAck(dupe, "rename", "maya");
  ok("a name already in the room is refused", () => assert.match(rn.error, /already called/));
  rn = await emitAck(dupe, "rename", "Dee");
  await until(() => P[0].state.players.some((p) => p.name === "Dee" && p.named), "renamed");
  ok("picking a free name works and shows for everyone", () => assert.ok(P[0].state.players.some((p) => p.name === "Dee" && p.named)));
  dupe.s.emit("leave");
  await until(() => P[0].state.players.length === 5, "dee left");
  dupe.s.close();

  P[1].s.emit("settings", { mrWhite: true });
  await wait(40);
  ok("only the room owner can change settings", () => assert.equal(P[0].state.settings.mrWhite, false));
  P[0].s.emit("settings", { packs: ["sports", "nope", "basic", "sports"] });
  await until(() => P[0].state.settings.packs.length === 2, "packs");
  ok("word packs stack on Basic; unknown packs ignored", () => assert.deepEqual(P[0].state.settings.packs, ["basic", "sports"]));
  P[0].s.emit("settings", { packs: [] });
  await until(() => P[0].state.settings.packs.length === 1, "packs reset");
  ok("Basic can't be switched off", () => assert.deepEqual(P[0].state.settings.packs, ["basic"]));
  P[0].s.emit("settings", { packs: ["history"] });
  await until(() => P[0].state.settings.packs.includes("history"), "history");

  for (const p of P.slice(0, 4)) p.s.emit("ready", true);
  await until(() => P[0].state.players.filter((p) => p.ready).length === 4, "4 ready");
  await wait(150);
  ok("no start until everyone is Ready", () => assert.equal(P[0].state.game, null));
  P[0].s.emit("settings", { undercovers: 1 });
  await until(() => P[0].state.players.every((p) => !p.ready), "settings reset ready");
  ok("changing settings resets Ready", () => assert.ok(true));

  for (const p of P) p.s.emit("ready", true);
  await until(() => P[0].state.startAt, "countdown");
  ok("everyone Ready → automatic countdown", () => assert.ok(P[0].state.startAt > P[0].state.now));
  await until(() => P.every((p) => p.state.game), "auto start");
  const g = () => rooms.get(code).game;
  ok("words come from the chosen packs (Basic + History)", () => {
    const w = g().words, hit = WORDS.ALL.find((x) => [x.a, x.b].includes(w.civ) && [x.a, x.b].includes(w.und));
    assert.ok(hit && ["basic", "history"].includes(hit.pack));
  });
  ok("exactly one Undercover, two different words, nobody sees roles", () => {
    assert.equal(Object.values(g().roles).filter((r) => r === "und").length, 1);
    assert.equal(new Set(P.map((p) => G(p).me.word)).size, 2);
    assert.ok(P.every((p) => G(p).reveal === null && !("role" in G(p).me)));
  });

  const order = G().turnOrder;
  const first = byId[order[0]], second = byId[order[1]];
  let r = await emitAck(second, "clue", "hello");
  ok("out-of-turn clue is refused", () => assert.match(r.error, /not your turn/));
  r = await emitAck(first, "clue", G(first).me.word.split(" ")[0]);
  ok("saying your own word is refused", () => assert.match(r.error, /gives away/));
  r = await emitAck(first, "clue", "two words");
  ok("two words are refused", () => assert.match(r.error, /One word/));
  r = await emitAck(first, "clue", "alpha");
  r = await emitAck(second, "clue", "Alpha");
  ok("repeated clue is refused", () => assert.match(r.error, /already used/));
  // second player now stays silent: the timer must skip them automatically
  await until(() => G().turnIdx === 2, "auto skip");
  ok("silent player is skipped automatically when time runs out", () => assert.equal(G().clues[1].word, null));
  // third player goes offline on their turn: skipped after the short offline grace
  const third = byId[order[2]];
  third.s.close();
  await until(() => g().turnIdx === 3, "offline skip");
  ok("offline player's turn is skipped automatically", () => assert.equal(g().clues[2].word, null));
  const third2 = phone(third.name, third.token);
  await until(() => third2.s.connected, "third back");
  third2.s.emit("join", { code, name: third.name, token: third.token });
  await until(() => third2.state?.game, "third rejoin");
  ok("reconnect restores the same seat and word", () => assert.equal(G(third2).me.word, g().words[g().roles[third.token]]));
  P[P.indexOf(third)] = third2; byId[third.token] = third2;
  for (const pid of order.slice(3)) { r = await emitAck(byId[pid], "clue", "w" + pid.slice(-3)); assert.ok(r.ok, JSON.stringify(r)); }
  await until(() => G().phase === "vote", "vote phase");

  const [A, B, C, D, E] = P; // Maya, Jordan, Priya, Sam, Leo
  A.s.emit("vote", A.token);
  await until(() => A.problems.some((m) => /can't vote/.test(m)), "self vote");
  ok("can't vote for yourself", () => assert.ok(true));
  A.s.emit("vote", B.token);
  await until(() => G(D).votedCount === 1, "1 vote");
  ok("others see only a vote count — never who or for whom", () => {
    const seen = D.frames.at(-1);
    assert.equal(G(D).myVote, null);
    assert.ok(!/"votes"/.test(seen) && !/breakdown/.test(seen));
  });
  A.s.emit("vote", C.token);
  await until(() => rooms.get(code).game.votes[A.token] === C.token, "changed");
  ok("a vote can be changed during the countdown", () => assert.equal(G(A).myVote, C.token));
  A.s.emit("unvote");
  await until(() => G(A).myVote === null && G(D).votedCount === 0, "unvote");
  ok("tapping your vote again takes it back", () => assert.equal(rooms.get(code).game.votes[A.token], undefined));
  A.s.emit("vote", C.token);
  await until(() => G(A).myVote === C.token, "revote after unvote");
  // Final: Jordan 2, Priya 2 → tie
  B.s.emit("vote", C.token); C.s.emit("vote", B.token); D.s.emit("vote", B.token); E.s.emit("vote", A.token);
  await until(() => G().revote, "revote");
  ok("tie → automatic re-vote between only the tied players", () => {
    assert.deepEqual([...G().candidates].sort(), [B.token, C.token].sort());
    assert.deepEqual(G(D).targets.sort(), [B.token, C.token].sort());
    assert.deepEqual(G(B).targets, [C.token]);
  });
  for (const p of P) p.s.emit("vote", p === B ? C.token : B.token);
  await until(() => ["result", "over"].includes(G().phase), "result");
  ok("majority eliminates Jordan; only totals are shown", () => {
    assert.equal(G().lastResult.id, B.token);
    assert.equal(G().lastResult.counts[B.token], 4);
    assert.ok(!("breakdown" in G().lastResult));
  });

  async function finishGame() {
    for (let guard = 0; G().phase !== "over" && guard < 12; guard++) {
      await until(() => ["clue", "over"].includes(G().phase), "next round starts by itself");
      if (G().phase === "over") break;
      const rnd = G().round;
      for (const pid of G().turnOrder) { const res = await emitAck(byId[pid], "clue", "r" + rnd + "x" + pid.slice(-3)); assert.ok(res.ok, JSON.stringify(res)); }
      await until(() => G().phase === "vote", "vote");
      const gm = rooms.get(code).game;
      const target = Object.keys(gm.roles).find((k) => gm.roles[k] !== "civ" && gm.alive.includes(k));
      for (const pid of G().alive) byId[pid].s.emit("vote", pid === target ? G().alive.find((x) => x !== pid) : target);
      await until(() => ["result", "over", "whiteguess"].includes(G().phase), "tally");
      if (G().phase === "whiteguess") return;
    }
  }
  await finishGame();
  ok("rounds advance on their own until Civilians win", () => {
    assert.equal(G().phase, "over"); assert.equal(G().winner, "civ");
    assert.ok(G().reveal.words.civ && G().reveal.words.und);
  });
  const firstGame = rooms.get(code).game;
  ok("civilians scored 2 points each", () => {
    for (const p of P[0].state.players) assert.equal(p.score, firstGame.roles[p.id] === "civ" ? 2 : 0);
  });

  const prev = P[0].state.gameNo;
  for (const p of P) p.s.emit("ready", true);
  await until(() => P.every((p) => p.state.gameNo === prev + 1 && G(p).phase === "clue"), "again");
  ok("everyone Ready again → next game in the same room", () => {
    assert.equal(P[0].state.code, code);
    assert.equal(G().alive.length, 5);
  });
  await finishGame();

  const ownerP = byId[P[0].state.ownerId]; // ownership moves if the owner dropped earlier
  ownerP.s.emit("settings", { mrWhite: true });
  await until(() => P[0].state.settings.mrWhite, "settings");
  for (const p of P) p.s.emit("ready", true);
  await until(() => P.every((p) => G(p)?.phase === "clue" && p.state.gameNo === prev + 2), "white game");
  const g3 = rooms.get(code).game;
  const white = Object.keys(g3.roles).find((k) => g3.roles[k] === "white");
  ok("Mr. White sees no word; a category hint only if they speak first", () => {
    const me = G(byId[white]).me, first = G().turnOrder[0] === white;
    assert.equal(me.white, true);
    assert.equal(me.hint, first ? g3.category : null);
    for (const p of P) if (p.token !== white) assert.ok(!("hint" in G(p).me));
  });
  for (const pid of G().turnOrder) await emitAck(byId[pid], "clue", "z" + pid.slice(-3));
  await until(() => G().phase === "vote", "vote3");
  for (const pid of G().alive) byId[pid].s.emit("vote", pid === white ? G().alive.find((x) => x !== pid) : white);
  await until(() => G().phase === "whiteguess", "whiteguess");
  byId[white].s.emit("whiteGuess", g3.words.civ.toLowerCase() + "s");
  await until(() => G().phase === "over", "white over");
  ok("Mr. White guessing the word (plural ok) wins", () => assert.equal(G().winner, "white"));

  P[4].s.emit("leave");
  await until(() => P[0].state.players.length === 4, "leave");
  ok("leaving between games frees the seat", () => assert.ok(true));

  console.log("Solo with AI players");
  const H = phone("Hana");
  await until(() => H.s.connected, "hana");
  H.s.emit("create", { name: "Hana", token: H.token });
  await until(() => H.state, "hana room");
  const soloCode = H.state.code;
  for (let i = 0; i < 4; i++) H.s.emit("addBot");
  await until(() => H.state.players.length === 5, "bots added");
  ok("room owner can add AI players; they're marked and always ready", () => {
    const bots = H.state.players.filter((p) => p.bot);
    assert.equal(bots.length, 4);
    assert.ok(bots.every((b) => b.ready && b.connected));
    assert.equal(new Set(H.state.players.map((p) => p.name.toLowerCase())).size, 5);
  });
  await wait(100);
  ok("AI players never start a game by themselves", () => assert.equal(H.state.game, null));
  H.s.emit("ready", true);
  await until(() => H.state.game, "solo start");
  const solo = () => rooms.get(soloCode).game;
  let sguard = 0;
  while (H.state.game.phase !== "over" && sguard++ < 400) {
    const sg = H.state.game;
    if (sg.phase === "clue" && sg.turnOrder[sg.turnIdx] === H.token) await emitAck(H, "clue", "q" + sguard);
    if (sg.phase === "vote" && sg.alive.includes(H.token) && !sg.myVote) H.s.emit("vote", sg.targets[0]);
    if (sg.phase === "whiteguess" && sg.whiteId === H.token) H.s.emit("whiteGuess", "nope");
    await wait(15);
  }
  ok("one person + 4 AI players play a full game to the end", () => assert.equal(H.state.game.phase, "over"));
  ok("AI players gave real clues", () => {
    const botClues = solo().clues.filter((c) => c.id.startsWith("bot-"));
    assert.ok(botClues.length >= 4 && botClues.filter((c) => c.word).length >= botClues.length - 1);
  });
  const anyBot = H.state.players.find((p) => p.bot).id;
  H.s.emit("kick", anyBot);
  await until(() => H.state.players.length === 4, "kick bot");
  ok("AI players can be removed like anyone else", () => assert.ok(!H.state.players.some((p) => p.id === anyBot)));
  H.s.emit("leave");
  await until(() => !rooms.has(soloCode), "room closes");
  ok("when the last person leaves, a room of only AI players closes", () => assert.ok(true));

  console.log("Public & private rooms");
  const api = async () => (await fetch(url + "/api/rooms")).json();
  const before = await api();
  ok("private rooms are never listed", () => assert.ok(!before.some((r) => r.code === code)));
  const X = phone("Xena"), Y = phone("Yuki"), Z = phone("Zed");
  await until(() => X.s.connected && Y.s.connected && Z.s.connected, "xyz");
  X.s.emit("quickJoin", { name: "Xena", token: X.token });
  await until(() => X.state, "quick create");
  ok("quick join with no open public room creates a public one", () => assert.equal(X.state.settings.visibility, "public"));
  let list = await api();
  ok("public room shows up in the list", () => assert.ok(list.some((r) => r.code === X.state.code && !r.playing)));
  Y.s.emit("quickJoin", { name: "xena", token: Y.token });
  await until(() => Y.state, "quick join");
  ok("quick join drops you into the open public room (and fixes a clashing name)", () => {
    assert.equal(Y.state.code, X.state.code);
    assert.ok(Y.state.players.some((p) => p.name === "xena 2"));
  });
  X.s.emit("settings", { visibility: "private" });
  await wait(60);
  ok("room type can't be changed after creating the room", () => assert.equal(X.state.settings.visibility, "public"));
  const Q = phone("Quinn");
  await until(() => Q.s.connected, "quinn");
  Q.s.emit("create", { token: Q.token, name: "Quinn", visibility: "private" });
  await until(() => Q.state, "private create");
  list = await api();
  ok("a room created as private is never listed", () => assert.ok(Q.state.settings.visibility === "private" && !list.some((r) => r.code === Q.state.code)));
  Q.s.emit("leave"); Q.s.close();
  Z.s.emit("join", { code: X.state.code, name: "Zed", token: Z.token });
  await until(() => Z.state, "z by code");
  ok("any room still works by code", () => assert.equal(Z.state.code, X.state.code));

  console.log("Chat");
  X.s.emit("chat", "hi all"); 
  await until(() => Z.state.chat.some((m) => m.text === "hi all"), "lobby chat");
  ok("lobby chat reaches everyone, nothing blocked before the game", () => assert.ok(true));
  for (const p of [X, Y, Z]) p.s.emit("ready", true);
  await until(() => [X, Y, Z].every((p) => p.state.game), "xyz game");
  await wait(750);
  {
    const g = () => rooms.get(X.state.code).game;
    const civ = [X, Y, Z].find((p) => g().roles[p.token] === "civ"), w = g().words;
    let r1 = await emitAck(civ, "chat", "my word is " + w.civ.toLowerCase());
    ok("chat blocks your own secret word", () => assert.match(r1.error, /too close/));
    const AS = require("../bots").assocOf;
    const rel = AS(w.civ).find((x) => x.length >= 5 && !R.revealsWord(x, w.und) && !AS(w.und).some((y) => R.sameWord(x, y)));
    r1 = await emitAck(civ, "chat", "kinda " + rel + " vibes");
    ok("chat blocks words related to the secret words", () => assert.match(r1.error, /too close/));
    r1 = await emitAck(civ, "chat", "who is the undercover?");
    ok("normal chat goes through to everyone", () => assert.ok(r1.ok, JSON.stringify(r1) + " words=" + JSON.stringify(g().chatBlock)));
    await until(() => [X, Y, Z].every((p) => p.state.chat.some((m) => m.text === "who is the undercover?")), "chat arrives");
    r1 = await emitAck(civ, "chat", "again");
    ok("chat is rate-limited", () => assert.match(r1.error, /Slow down/));
    await wait(750);
    r1 = await emitAck(civ, "chat", "is it " + w.und.toLowerCase() + "?");
    ok("chat blocks the other secret word too, for everyone", () => assert.match(r1.error, /too close/));
    const dec = g().chatBlock.filter((x) => x !== w.civ && x !== w.und);
    ok("decoy words from the same category are blocked as well", () => assert.equal(dec.length, 4));
    await wait(750);
    r1 = await emitAck(civ, "chat", "hmm " + dec[0].toLowerCase());
    ok("…so a blocked word doesn't prove it's the other side's", () => assert.match(r1.error, /too close/));
  }

  for (const p of [...P, X, Y, Z]) p.s.close();
  H.s.close();
  server.close();
  console.log(`\nAll ${passed} checks passed.`);
  process.exit(0);
}
main().catch((e) => { console.error("\nFAILED:", e); process.exit(1); });
