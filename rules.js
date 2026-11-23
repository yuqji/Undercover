// Pure game rules — no networking here, so they are easy to test.

const norm = (s) =>
  String(s || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\u3400-\u9fff]/g, "");
// Chinese (and other CJK) words are checked by characters, not English word forms.
const isCJK = (s) => /[\u3400-\u9fff]/.test(String(s || ""));
// Characters too common to count as "giving away" a Chinese word (子 in 饺子, 大 in 大象…).
const CJK_FILLER = new Set("子儿的了头人大小一不是个们之老阿球".split(""));
const cjkShares = (clue, word) => { const c = norm(clue); return [...norm(word)].some((ch) => /[\u3400-\u9fff]/.test(ch) && !CJK_FILLER.has(ch) && c.includes(ch)); };

// Every plausible base form of a word: tigers→tiger, coffees→coffee, boxes→box,
// cherries→cherry, raised→raise, dancing→dance/danc. Two words match if any forms overlap.
function forms(w) {
  const f = new Set([w]);
  const cut = (n) => w.slice(0, -n);
  if (w.length > 3 && w.endsWith("s")) f.add(cut(1));
  if (w.length > 4 && w.endsWith("es")) f.add(cut(2));
  if (w.length > 4 && w.endsWith("ies")) f.add(cut(3) + "y");
  if (w.length > 4 && w.endsWith("d")) f.add(cut(1));
  if (w.length > 4 && w.endsWith("ed")) f.add(cut(2));
  if (w.length > 5 && w.endsWith("ing")) { f.add(cut(3)); f.add(cut(3) + "e"); }
  return f;
}
const stem = (w) => [...forms(w)].sort((a, b) => a.length - b.length)[0];

function sameWord(a, b) {
  const x = norm(a), y = norm(b);
  if (!x || !y) return false;
  const fy = forms(y);
  for (const v of forms(x)) if (fy.has(v)) return true;
  return false;
}

// Would this clue give away (or literally be) the player's own word?
function revealsWord(clue, word) {
  if (!word) return false;
  const c = norm(clue);
  if (!c) return false;
  // Chinese: the usual house rule — your clue may not use any (meaningful) character of your word.
  if (isCJK(word)) return c.includes(norm(word)) || cjkShares(c, word);
  const whole = norm(word);
  if (sameWord(c, whole)) return true;
  if (whole.length >= 3 && c.includes(whole)) return true;
  const parts = String(word).split(/[\s-]+/).map(norm).filter(Boolean);
  for (const t of parts) {
    if (t.length < 3) continue;
    if (sameWord(c, t)) return true;
    if (c.includes(t)) return true; // e.g. "pancakes" for Pancake, "creamy" for Ice cream
    if (c.length >= 3 && t.includes(c)) return true; // e.g. "cake" for Pancake
  }
  return false;
}

// A clue can be a word or a short phrase, up to CLUE_MAX characters.
const CLUE_MAX = 20;
function checkClue(raw, myWord, usedClues = []) {
  const word = String(raw ?? "").trim().replace(/\s+/g, " ");
  if (!word) return { error: "Type a clue first." };
  if ([...word].length > CLUE_MAX) return { error: `Keep it to ${CLUE_MAX} characters or fewer.` };
  if (!/^[\p{L}\p{N}'’ -]+$/u.test(word)) return { error: "Letters only, please — no symbols or emoji." };
  if (!/[\p{L}\p{N}]/u.test(word)) return { error: "Type a real word." };
  // No word in the clue may give the secret away, and the clue as a whole can't contain it.
  const tokens = word.split(" ");
  const whole = norm(myWord || "");
  if (tokens.some((t) => revealsWord(t, myWord)) || (tokens.length > 1 && whole.length >= 4 && norm(word).includes(whole)))
    return { error: "That gives away your word — try a different clue." };
  if (usedClues.some((u) => norm(u) === norm(word) || (tokens.length === 1 && !/\s/.test(u) && sameWord(u, word))))
    return { error: "Someone already used that clue — pick another." };
  return { word };
}

// Everyday words that are never blocked just for being "related" (they still are if they ARE a secret word).
const CHAT_STOP = new Set("the and you are for not but who what when where why how this that with have has had was were its it's just like think know good bad yes yeah nope big small new old one two three time day fun sus lol omg hmm wait vote clue word words said say got get very really maybe sure same thing guess game round".split(" "));

const GAME_TERMS = new Set("undercover undercovers civilian civilians mrwhite impostor impostors imposter imposters vote voted voting clue clues round".split(" "));

// Does a chat message give away a secret word? Blocks the word itself (any form), its parts,
// and words closely associated with it (the same list the AI uses for clues).
function chatLeaks(text, word, related = []) {
  if (!word) return false;
  if (isCJK(word)) { // Chinese: block the word itself, or a close association, anywhere in the message
    const t = norm(text);
    return t.includes(norm(word)) || related.some((r) => norm(r).length >= 2 && t.includes(norm(r)));
  }
  const whole = norm(word);
  if (whole.length >= 4 && norm(text).includes(whole)) return true;
  const parts = String(word).split(/[\s-]+/).map(norm).filter((x) => x.length >= 3 && !CHAT_STOP.has(x)); // "Lord of the Rings" must not block "the"
  const tokens = String(text).split(/[^\p{L}\p{N}'’-]+/u).map(norm).filter(Boolean);
  for (const t of tokens) {
    if (sameWord(t, whole)) return true;
    if (GAME_TERMS.has(t)) continue; // talking about the game itself is always fine
    for (const p of parts) if (sameWord(t, p) || (p.length >= 4 && t.includes(p))) return true;
    if (t.length >= 3 && !CHAT_STOP.has(t) && related.some((r) => sameWord(r, t))) return true;
  }
  return false;
}

// How many Undercovers for n players. "auto" scales with the table; a fixed number is the owner's choice.
function autoUndercovers(n) {
  return n <= 5 ? 1 : n <= 9 ? 2 : n <= 13 ? 3 : 4;
}
function undercoverCount(n, s) {
  const w = s.mrWhite ? 1 : 0;
  if (s.undercovers !== "auto") return s.undercovers;
  let u = autoUndercovers(n);
  while (u > 1 && (u + w) * 2 + 1 > n) u--; // impostors must stay a minority
  return u;
}
// Fewest players these settings can start with.
function minPlayers(s) {
  const u = s.undercovers === "auto" ? 1 : s.undercovers;
  return Math.max(3, (u + (s.mrWhite ? 1 : 0)) * 2 + 1);
}
function checkSetup(n, s) {
  const need = minPlayers(s);
  if (n < need) {
    const u = s.undercovers === "auto" ? 1 : s.undercovers;
    const what = [u === 1 ? "1 Undercover" : `${u} Undercovers`, s.mrWhite ? "Mr. White" : null].filter(Boolean).join(" + ");
    return `You need at least ${need} players for ${what}. You have ${n}.`;
  }
  return null;
}

// Fully random speaking order. Anyone can go first, Mr. White included —
// if Mr. White opens a round, the server gives them the category as a hint.
function speakingOrder(alive, _roles, shuffle) {
  return shuffle(alive);
}

// One vote per living player. Most votes is out. A tie triggers one re-vote among the tied
// players; a second tie (or no votes at all) means nobody is out this round.
function tally(votes, pool, isRevote) {
  const counts = Object.fromEntries(pool.map((id) => [id, 0]));
  for (const t of Object.values(votes)) if (t in counts) counts[t]++;
  const max = Math.max(0, ...Object.values(counts));
  if (max === 0) return { outcome: "none", counts, tied: [] };
  const leaders = pool.filter((id) => counts[id] === max);
  if (leaders.length === 1) return { outcome: "out", eliminated: leaders[0], counts };
  if (!isRevote) return { outcome: "revote", tied: leaders, counts };
  return { outcome: "none", counts, tied: leaders };
}

function winner(alive, roles) {
  const imps = alive.filter((id) => roles[id] !== "civ").length;
  const civs = alive.length - imps;
  if (imps === 0) return "civ";
  if (civs <= imps) return "imp";
  return null;
}

function points(win, roles, alive) {
  const out = {};
  for (const [id, r] of Object.entries(roles)) {
    if (win === "civ" && r === "civ") out[id] = 2;
    if (win === "imp" && r === "und") out[id] = 5;
    if (win === "imp" && r === "white" && alive.includes(id)) out[id] = 4;
    if (win === "white" && r === "white") out[id] = 6;
  }
  return out;
}

module.exports = { CLUE_MAX, isCJK, norm, stem, sameWord, revealsWord, chatLeaks, checkClue, checkSetup, autoUndercovers, undercoverCount, minPlayers, speakingOrder, tally, winner, points };
