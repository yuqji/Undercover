// Built-in AI players. No external API: they reason from the word-association list.
const R = require("./rules");
const WORDS = require("./words");
const ASSOC = require("./associations");

const BOT_NAMES = ["Nova", "Pixel", "Echo", "Juno", "Orbit", "Ziggy", "Mochi", "Atlas", "Luna", "Biscuit", "Rook", "Sunny", "Comet", "Pepper", "Kiwi", "Scout"];

const WHITE_SHARP = 0.25; // how often an AI Mr. White goes with its best guess
const rand = (a) => a[Math.floor(Math.random() * a.length)];
const shuffle = (a) => {
  a = a.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
const assocOf = (word) => ASSOC[String(word).toLowerCase()] || [];
const pairOf = (word) => WORDS.ALL.find((w) => w.a === word || w.b === word);
const partnerOf = (word) => {
  const p = pairOf(word);
  return p ? (p.a === word ? p.b : p.a) : null;
};

// How well does a clue fit a word? 1 = a listed association (or a piece of the word), 0 = no evidence.
function fits(clue, word) {
  if (!clue || !word) return 0;
  if (assocOf(word).some((a) => R.sameWord(a, clue))) return 1;
  if (R.revealsWord(clue, word)) return 1;
  return 0;
}

function botName(taken) {
  const lower = new Set(taken.map((n) => n.toLowerCase()));
  const free = BOT_NAMES.filter((n) => !lower.has(n.toLowerCase()));
  if (free.length) return rand(free);
  for (let i = 2; ; i++) { const n = "Bot " + i; if (!lower.has(n.toLowerCase())) return n; }
}

// A clue for my word: a valid association that doesn't give away my word (or the other word of the pair).
function clueFor(word, used) {
  const partner = partnerOf(word);
  for (const c of shuffle(assocOf(word))) {
    if (R.checkClue(c, word, used).error) continue;
    if (partner && R.revealsWord(c, partner)) continue;
    return c;
  }
  // Fallback: borrow a clue from another word in the same category.
  const p = pairOf(word);
  const kin = WORDS.ALL.filter((w) => p && w.hint === p.hint && w !== p);
  for (const w of shuffle(kin)) {
    for (const c of shuffle(assocOf(w.a))) if (!R.checkClue(c, word, used).error && !R.revealsWord(c, w.a)) return c;
  }
  return null;
}

// A bot that notices earlier clues lean toward the *other* word suspects it's the odd one out,
// and tries to blend in with a clue that fits both words (or the other word) without naming either.
function smartClue(g, pid) {
  const myWord = g.words[g.roles[pid]];
  const used = g.clues.map((c) => c.word).filter(Boolean);
  const partner = partnerOf(myWord);
  const others = g.clues.filter((c) => c.word && c.id !== pid).map((c) => c.word);
  const mine = others.reduce((n, c) => n + fits(c, myWord), 0);
  const theirs = others.reduce((n, c) => n + fits(c, partner), 0);
  if (partner && others.length >= 2 && theirs > mine) {
    const ok = (c) => !R.checkClue(c, myWord, used).error && !R.revealsWord(c, partner);
    const both = assocOf(myWord).filter((c) => ok(c) && fits(c, partner));
    const blend = both.length ? both : assocOf(partner).filter(ok);
    if (blend.length && Math.random() < 0.9) return rand(blend);
  }
  return clueFor(myWord, used);
}

// Mr. White: rank every candidate word by how many of the clues so far point at it.
function bestGuess(clueWords, packs, hint) {
  let pool = WORDS.ALL.filter((w) => packs.includes(w.pack));
  if (hint) pool = pool.filter((w) => w.hint === hint);
  const cands = pool.flatMap((w) => [w.a, w.b]);
  let best = [], top = -1;
  for (const c of shuffle(cands)) {
    const s = clueWords.reduce((n, cl) => n + fits(cl, c), 0);
    if (s > top) { top = s; best = [c]; } else if (s === top) best.push(c);
  }
  return { word: rand(best), score: top };
}

function whiteClue(g, packs, used) {
  const said = g.clues.map((c) => c.word).filter(Boolean);
  const hint = g.whiteHint ? g.category : null;
  const guess = said.length || hint ? bestGuess(said, packs, hint).word : rand(WORDS.ALL.filter((w) => packs.includes(w.pack))).a;
  // Mr. White must not say the word he is guessing (that would hand Civilians a free tell); pick an association.
  for (const c of shuffle(assocOf(guess))) if (!R.checkClue(c, guess, used).error) return c;
  return null;
}

// Vote: work out which of the pair is the majority word from everyone's clues,
// then suspect whoever's clues lean toward the minority word. Some noise keeps bots beatable.
function chooseVote(g, botId, targets, packs) {
  if (!targets.length) return null;
  if (Math.random() < 0.35) return rand(targets);
  const byPlayer = {};
  for (const c of g.clues) if (c.word) (byPlayer[c.id] = byPlayer[c.id] || []).push(c.word);
  const role = g.roles[botId];
  let a, b;
  if (role === "white") {
    a = bestGuess(Object.values(byPlayer).flat(), packs, g.whiteHint ? g.category : null).word;
    b = partnerOf(a);
  } else {
    a = g.words[role];
    b = partnerOf(a);
  }
  const score = (id, w) => (byPlayer[id] || []).reduce((n, cl) => n + fits(cl, w), 0);
  let fa = 0, fb = 0;
  for (const id of Object.keys(byPlayer)) if (id !== botId) { fa += score(id, a); fb += score(id, b); }
  const minority = fb > fa ? a : b, majority = minority === a ? b : a;
  const passes = (id) => g.clues.filter((c) => c.id === id && !c.word).length;
  let best = [], top = -Infinity;
  for (const id of shuffle(targets)) {
    const s = score(id, minority) - score(id, majority) + passes(id) * 0.6 + Math.random() * 1.4;
    if (s > top) { top = s; best = [id]; } else if (Math.abs(s - top) < 1e-9) best.push(id);
  }
  return rand(best);
}

// Mr. White's final guess. A bot knows the whole word list, which a person doesn't, so it is held
// back on purpose: it often mixes up the two words of the pair or lands on a near miss.
// Tuned so an AI Mr. White guesses right roughly 1 time in 4.
function whiteGuess(g, packs) {
  const said = g.clues.map((c) => c.word).filter(Boolean);
  const hint = g.whiteHint ? g.category : null;
  let pool = WORDS.ALL.filter((w) => packs.includes(w.pack));
  if (hint) pool = pool.filter((w) => w.hint === hint);
  const ranked = pool.flatMap((w) => [w.a, w.b])
    .map((c) => ({ c, s: said.reduce((n, cl) => n + fits(cl, c), 0) + Math.random() * 1.6 }))
    .sort((x, y) => y.s - x.s);
  const top = ranked[0].c, r = Math.random();
  if (r < WHITE_SHARP) return top;
  if (r < WHITE_SHARP + 0.3) return partnerOf(top) || rand(ranked.slice(1, 6)).c; // confuses the two words
  return rand(ranked.slice(1, 8)).c;
}

module.exports = { botName, clueFor, smartClue, whiteClue, chooseVote, whiteGuess, fits, assocOf, partnerOf };
