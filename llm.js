// Real AI for the AI players, through the Claude API.
// Turned on by setting ANTHROPIC_API_KEY on the server. Without it (or if a call fails, is slow,
// or the daily cap is reached) every function here returns null and the built-in word-list AI
// in bots.js takes over, so a game never waits on the API.
const KEY = process.env.ANTHROPIC_API_KEY || "";
const MODEL = process.env.AI_MODEL || "claude-haiku-5-5";
const DAILY_LIMIT = Number(process.env.AI_DAILY_LIMIT || 20000); // calls per day, a safety cap
const TIMEOUT_MS = 7000;

let day = "", used = 0;
const enabled = () => !!KEY;

async function ask(system, user, maxTokens = 40) {
  if (!KEY) return null;
  const today = new Date().toISOString().slice(0, 10);
  if (today !== day) { day = today; used = 0; }
  if (used >= DAILY_LIMIT) return null;
  used++;
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model: MODEL, max_tokens: maxTokens, temperature: 1, system, messages: [{ role: "user", content: user }] }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!r.ok) { console.warn("[ai] HTTP", r.status, (await r.text()).slice(0, 200)); return null; }
    const j = await r.json();
    return (j.content || []).map((c) => c.text || "").join("").trim() || null;
  } catch (e) {
    console.warn("[ai]", e.name === "TimeoutError" ? "timeout" : e.message);
    return null;
  }
}

const clean = (t) => String(t || "").split("\n")[0].replace(/^["'“”「」『』\s]+|["'“”「」『』。.!！\s]+$/g, "").trim();

// Everything the model sees about players' clues so far, oldest first. Names are replaced by
// "Player N" so player names can't steer the model.
function clueLog(g, me, lang) {
  const nums = new Map(g.turnOrder.map((id, i) => [id, i + 1]));
  const lines = g.clues.map((c) => `${lang === "zh" ? "玩家" : "Player "}${nums.get(c.id) || "?"}${c.id === me ? (lang === "zh" ? "（你）" : " (you)") : ""}, ${lang === "zh" ? "第" + c.round + "轮" : "round " + c.round}: ${c.word ? JSON.stringify(c.word) : lang === "zh" ? "（跳过）" : "(skipped)"}`);
  return lines.length ? lines.join("\n") : lang === "zh" ? "（还没有人出线索）" : "(no clues yet)";
}

const RULES = {
  en: `You are playing the party word game Undercover. Everyone has a secret word; the Civilians share one word, the Undercover has a similar but different word, and nobody is told which they are. Mr. White has no word. Each round every player gives one short clue about their word, then everyone votes out whoever seems different.`,
  zh: `你在玩派对游戏“谁是卧底”。平民拿到同一个词，卧底拿到一个相近但不同的词，没有人被告知自己的身份。白板没有词。每轮每人用一个简短的线索描述自己的词，然后大家投票淘汰看起来不一样的人。`,
};

async function clue(g, me, lang = "en") {
  const role = g.roles[me];
  const word = role === "white" ? null : g.words[role];
  const zh = lang === "zh";
  const sys = RULES[zh ? "zh" : "en"] + (zh
    ? `\n只回复你的线索本身：一个词或很短的短语，最多 8 个字。不能包含你的词里的任何字，不能和已有线索重复。线索要像真人：不要太明显（会暴露给卧底），也不要太偏。如果别人的线索好像跟你的词对不上，你可能是卧底，就说一个大家都能接上的模糊线索。`
    : `\nReply with your clue only: one word or a very short phrase, at most 3 words, no punctuation. Never say your word or any part of it, and don't repeat a clue already given. Sound like a real player: not so obvious it hands the word to the Undercover, not so obscure you look suspicious. If the other clues don't seem to fit your word, you may be the Undercover — give a vague clue that blends in with theirs.`);
  const user = role === "white"
    ? (zh ? `你是白板，没有词。${g.whiteHint && g.category ? `提示：这一局的词属于“${g.category}”。` : ""}根据别人的线索猜大家的词，给一个能混进去的线索。\n\n目前的线索：\n${clueLog(g, me, "zh")}`
          : `You are Mr. White and have no word.${g.whiteHint && g.category ? ` Hint: the words are about "${g.category}".` : ""} Work out the others' word from their clues and give a clue that blends in.\n\nClues so far:\n${clueLog(g, me, "en")}`)
    : (zh ? `你的词：${word}\n\n目前的线索：\n${clueLog(g, me, "zh")}\n\n你的线索：` : `Your word: ${word}\n\nClues so far:\n${clueLog(g, me, "en")}\n\nYour clue:`);
  return clean(await ask(sys, user, 30));
}

async function vote(g, me, targets, lang = "en") {
  if (!targets.length) return null;
  const role = g.roles[me];
  const word = role === "white" ? null : g.words[role];
  const zh = lang === "zh";
  const nums = new Map(g.turnOrder.map((id, i) => [id, i + 1]));
  const options = targets.map((id) => nums.get(id)).filter(Boolean);
  const sys = RULES[zh ? "zh" : "en"] + (zh ? `\n只回复一个玩家编号（数字），不要别的。` : `\nReply with one player number only, nothing else.`);
  const user = zh
    ? `${word ? `你的词：${word}` : "你是白板，没有词。"}\n\n所有线索：\n${clueLog(g, me, "zh")}\n\n可以投的玩家：${options.join("、")}。谁的线索最不像大家的词？`
    : `${word ? `Your word: ${word}` : "You are Mr. White and have no word."}\n\nAll clues:\n${clueLog(g, me, "en")}\n\nYou can vote for players: ${options.join(", ")}. Whose clues fit the shared word least?`;
  const n = parseInt(String(await ask(sys, user, 8)).match(/\d+/)?.[0], 10);
  return targets.find((id) => nums.get(id) === n) || null;
}

async function whiteGuess(g, me, lang = "en") {
  const zh = lang === "zh";
  const sys = RULES[zh ? "zh" : "en"] + (zh ? `\n你是白板，被抓到了。只回复你猜的平民的词，不要别的。` : `\nYou are Mr. White and were caught. Reply with your guess of the Civilians' word only, nothing else.`);
  const user = zh ? `所有线索：\n${clueLog(g, me, "zh")}\n\n平民的词是：` : `All clues:\n${clueLog(g, me, "en")}\n\nThe Civilians' word is:`;
  return clean(await ask(sys, user, 15));
}

module.exports = { enabled, clue, vote, whiteGuess };
