// Chinese word packs. The data lives in words_zh.txt, one pair per line:
//   平民词|卧底词|平民词的联想词…|卧底词的联想词…
// A line starting with # opens a pack:  #pack_id|包名|一句话介绍
// The 联想词 (space separated) are what the AI players use for clues and for judging others' clues.
const fs = require("fs");
const path = require("path");

const PACKS = {}, ASSOC = {};
let cur = null;
for (const raw of fs.readFileSync(path.join(__dirname, "words_zh.txt"), "utf8").split("\n")) {
  const line = raw.trim();
  if (!line) continue;
  if (line.startsWith("#")) {
    const [id, name, blurb] = line.slice(1).split("|");
    cur = PACKS[id] = { name, blurb, lang: "zh", pairs: [] };
    continue;
  }
  const [a, b, ra = "", rb = ""] = line.split("|");
  if (!cur || !a || !b) continue;
  cur.pairs.push([a.trim(), b.trim()]);
  for (const [w, r] of [[a, ra], [b, rb]]) {
    const list = r.split(/\s+/).filter(Boolean);
    if (list.length && !ASSOC[w.trim()]) ASSOC[w.trim()] = list;
  }
}
module.exports = { PACKS, ASSOC };
