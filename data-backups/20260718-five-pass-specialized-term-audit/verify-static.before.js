const fs = require("fs");
const vm = require("vm");
const path = require("path");

const root = path.resolve(__dirname, "..");
const failures = [];

function fail(message) {
  failures.push(message);
}

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function loadJson(relativePath) {
  return JSON.parse(read(relativePath));
}

function loadWindowData(relativePath, globalNames) {
  const names = Array.isArray(globalNames) ? globalNames : [globalNames];
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(read(relativePath), sandbox, { filename: relativePath });
  for (const name of names) {
    if (sandbox.window[name]) return sandbox.window[name];
  }
  return undefined;
}

function canonical(value) {
  return JSON.stringify(value);
}

const pairs = [
  ["data/history-content.json", "data/history-content.js", ["WORLD_HISTORY_CONTENT_DATA", "historyContentData"]],
  ["data/people-data.json", "data/people-data.js", "WORLD_HISTORY_PEOPLE_DATA"],
  ["data/action-cards.json", "data/action-cards.js", "WORLD_HISTORY_ACTION_CARDS_DATA"],
  ["data/modal-data.json", "data/modal-data.js", "WORLD_HISTORY_MODAL_DATA"],
  ["data/learning-terms.json", "data/learning-terms.js", "WORLD_HISTORY_LEARNING_TERMS_DATA"],
  ["data/timeline-region-data.json", "data/timeline-region-data.js", "WORLD_HISTORY_TIMELINE_REGION_DATA"]
];

for (const [jsonPath, jsPath, globalName] of pairs) {
  try {
    const jsonData = loadJson(jsonPath);
    const jsData = loadWindowData(jsPath, globalName);
    if (canonical(jsonData) !== canonical(jsData)) fail(`${jsonPath} and ${jsPath} are not synchronized`);
  } catch (error) {
    fail(`${jsonPath}/${jsPath}: ${error.message}`);
  }
}

if (!Array.isArray(loadJson("data/people-data.json").genreGroups) || !loadJson("data/people-data.json").genreGroups.length) fail("people-data.json must define genreGroups");
if (!loadJson("data/people-data.json").inlineAliases || typeof loadJson("data/people-data.json").inlineAliases !== "object") fail("people-data.json must define inlineAliases");
const timelineRegionData = loadJson("data/timeline-region-data.json");
if (!timelineRegionData.timelineRegionRules?.nameOverrides) fail("timeline-region-data.json must define timelineRegionRules.nameOverrides");
if (!Array.isArray(timelineRegionData.timelineRegionRules?.modernRegionIncludes)) fail("timeline-region-data.json must define timelineRegionRules.modernRegionIncludes");
for (const key of ["eraRegionPriority", "subcategoryTimelineRegions", "subcategoryTimelineRegionOverrides", "subcategoryTimelineKeywords"]) {
  if (!timelineRegionData[key] || typeof timelineRegionData[key] !== "object") fail(`timeline-region-data.json must define ${key}`);
}
const actionData = loadJson("data/action-cards.json");
const learningTerms = loadJson("data/learning-terms.json");
if (!learningTerms.schemaVersion || !learningTerms.terms) fail("learning-terms.json has an invalid shape");
for (const [term, value] of Object.entries(learningTerms.terms || {})) {
  const reading = value?.reading || value?.ruby?.reading;
  const tooltipBody = value?.tooltip?.body;
  if (!reading && !tooltipBody) fail(`${term} has neither reading nor tooltip body`);
  if (reading && /[\u30a0-\u30ff]/.test(term)) fail(`${term} contains katakana and should not be ruby-managed as a whole term`);
}
const actionCardsWithoutRequiredTooltip = new Set(["農業", "文明", "文字", "仏教"]);
for (const name of Object.keys(actionData.actionCards || {})) {
  if (actionCardsWithoutRequiredTooltip.has(name)) continue;
  if (!learningTerms.terms[name]?.tooltip?.body) fail(`${name} action card has no tooltip body`);
}
for (const term of actionCardsWithoutRequiredTooltip) {
  if (learningTerms.terms[term]?.tooltip?.body) fail(`${term} should not have a standalone tooltip body`);
  if (learningTerms.terms[term]?.reading || learningTerms.terms[term]?.ruby) fail(`${term} should not have standalone ruby because it can split longer compounds`);
}


const commonStandaloneRubyTerms = [
  "王国",
  "王子",
  "王朝",
  "外交",
  "革命",
  "学問",
  "感染症",
  "環境",
  "記録",
  "技術",
  "議会",
  "共同体",
  "協力",
  "近代",
  "近代化",
  "経済",
  "決済",
  "憲法",
  "検索",
  "権利",
  "現代",
  "交易",
  "交通",
  "交流",
  "工業",
  "工場",
  "広告",
  "皇帝",
  "航海",
  "差別",
  "再編",
  "市民",
  "思想",
  "支配",
  "写真",
  "宗教",
  "商業",
  "商人",
  "情報",
  "植民地",
  "人権",
  "世界",
  "征服",
  "政治",
  "戦後",
  "速報",
  "太平洋",
  "大西洋",
  "大名",
  "知識",
  "地中海",
  "中国",
  "中南米",
  "通信",
  "通話",
  "帝国",
  "帝政",
  "抵抗",
  "都市",
  "統一",
  "動画",
  "独裁",
  "独立",
  "日本",
  "迫害",
  "発信",
  "普及",
  "分裂",
  "文化",
  "文化圏",
  "平等",
  "平和",
  "並立",
  "法律",
  "未来",
  "労働",
  "王国",
  "王朝",
  "古王国",
  "新王国",
  "中王国",
  "南朝",
  "南北朝",
  "大王",
  "大帝"
];
for (const term of commonStandaloneRubyTerms) {
  if (learningTerms.terms[term]?.reading || learningTerms.terms[term]?.ruby) {
    fail(`${term} should not have standalone ruby because it is a common short word`);
  }
  if (learningTerms.terms[term] && !learningTerms.terms[term]?.tooltip?.body) {
    fail(`${term} should not remain as a reading-only learning term`);
  }
}

const forbiddenStandaloneRubyTerms = ["農業", "文明", "文字", "仏教", "鉄道", "戦争"];
for (const term of forbiddenStandaloneRubyTerms) {
  if (learningTerms.terms[term]?.reading || learningTerms.terms[term]?.ruby || learningTerms.terms[term]?.tooltip?.body) {
    fail(`${term} should not be standalone ruby/tooltip-managed`);
  }
}

for (const term of ["灌漑農業", "都市文明", "甲骨文字", "仏教思想", "仏教文化", "日本仏教", "大乗仏教", "チベット仏教", "冷戦期", "冷戦終結", "冷戦下", "冷戦時代", "連合国軍", "連合国側", "連合国第二次大戦", "アメリカ合衆国冷戦期", "ソビエト連邦冷戦期", "冷戦勢力"]) {
  if (!learningTerms.terms[term]?.tooltip?.body) fail(`${term} must have a tooltip body`);
}

const requiredSpecializedTooltipTerms = [
  "蒸気機関",
  "ジェニー紡績機",
  "水力紡績機",
  "ミュール紡績機",
  "力織機",
  "紡績機械",
  "綿工業",
  "工場制",
  "鉱山排水",
  "工場労働",
  "宗教改革",
  "カトリック教会",
  "プロテスタント",
  "イギリス国教会",
  "活版印刷",
  "三部会",
  "封建的特権",
  "国民議会",
  "人権宣言",
  "立憲君主政",
  "絶対王政",
  "コモン・センス",
  "独立宣言",
  "奴隷解放宣言",
  "不買運動",
  "南北戦争",
  "不平等条約",
  "ベルリン会議",
  "アフリカ分割",
  "民族運動",
  "独立運動",
  "国民国家",
  "女性参政権運動",
  "公民権運動",
  "人種隔離制度",
  "アパルトヘイト",
  "非暴力",
  "塩の行進",
  "ワルシャワ条約機構",
  "マーシャル・プラン",
  "NATO",
  "北大西洋条約機構",
  "キューバ危機",
  "大陸間ミサイル",
  "核兵器",
  "全面核戦争",
  "社会主義政権",
  "代理戦争",
  "国際連盟",
  "国際連合",
  "世界大戦",
  "第一次世界大戦",
  "第二次世界大戦",
  "ファシズム",
  "ナチス",
  "ハンムラビ法典",
  "ナポレオン法典",
  "楔形文字",
  "インダス文字",
  "太陽暦",
  "三圃制",
  "荘園制",
  "封建制",
  "重商主義",
  "啓蒙思想",
  "社会契約説",
  "東インド会社",
  "イギリス東インド会社",
  "選挙権",
  "参政権"
];
for (const term of requiredSpecializedTooltipTerms) {
  if (!learningTerms.terms[term]?.tooltip?.body) fail(`${term} must have a specialized tooltip body`);
}

for (const [term, value] of Object.entries(learningTerms.terms || {})) {
  const tooltip = value?.tooltip;
  if (!tooltip?.body) continue;
  if (!tooltip.title) fail(`${term} tooltip has no title`);
  if (tooltip.body.length < 20) fail(`${term} tooltip body is too short`);
  if (/読み|よみ|ふりがな|ルビ/.test(tooltip.body)) fail(`${term} tooltip looks like a reading hint instead of a meaning explanation`);
}


function escapeRegExpForVerification(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, (match) => `\\${match}`);
}

const peopleData = loadJson("data/people-data.json");
const modalData = loadJson("data/modal-data.json");
const historyData = loadJson("data/history-content.json");
const tooltipTerms = Object.entries(learningTerms.terms || {})
  .filter(([, value]) => value?.tooltip?.body)
  .map(([term]) => term);
const modalLinkWords = [...new Set([
  ...Object.keys(peopleData.peopleByName || {}),
  ...Object.keys(actionData.actionCards || {}),
  ...(modalData.kingdomCards || []).flatMap((card) => [card.name, card.displayName].filter(Boolean))
])];
const longTooltipTermsWithLinkWords = tooltipTerms.filter((term) =>
  modalLinkWords.some((word) => word && term !== word && term.includes(word))
);
const verificationTexts = [];
function addVerificationText(pathLabel, value) {
  if (typeof value === "string") verificationTexts.push({ pathLabel, value });
}
for (const person of peopleData.people || []) {
  addVerificationText(`people:${person.name}:title`, person.title);
  addVerificationText(`people:${person.name}:profile`, person.modal?.profile);
  addVerificationText(`people:${person.name}:whatDid`, person.modal?.whatDid);
  addVerificationText(`people:${person.name}:whyImportant`, person.modal?.whyImportant);
}
for (const [name, card] of Object.entries(actionData.actionCards || {})) {
  addVerificationText(`action:${name}:summary`, card.summary);
  addVerificationText(`action:${name}:whatHappened`, card.modal?.whatHappened);
  addVerificationText(`action:${name}:whyImportant`, card.modal?.whyImportant);
}
for (const card of modalData.kingdomCards || []) {
  addVerificationText(`kingdom:${card.displayName}:summary`, card.summary);
  addVerificationText(`kingdom:${card.displayName}:text`, card.text);
}
for (const group of historyData.groups || []) {
  addVerificationText(`group:${group.title}:heading`, group.heading);
  addVerificationText(`group:${group.title}:focus`, group.focus);
  for (const era of group.eras || []) {
    addVerificationText(`era:${era.name}:question`, era.question);
    addVerificationText(`era:${era.name}:life`, era.life);
    addVerificationText(`era:${era.name}:event`, era.event);
    addVerificationText(`era:${era.name}:power`, era.power);
    for (const subcategory of era.subcategories || []) {
      addVerificationText(`subcategory:${subcategory[2]}:summary`, subcategory[3]);
      addVerificationText(`subcategory:${subcategory[2]}:body`, subcategory[4]);
    }
  }
}
const shortKanjiTooltipTerms = tooltipTerms.filter((term) => /^[\u4e00-\u9fff々]+$/.test(term) && term.length <= 3);
function isKanjiForTooltipAudit(char) {
  return /[\u4e00-\u9fff々]/.test(char || "");
}
for (const item of verificationTexts) {
  for (const term of shortKanjiTooltipTerms) {
    let index = item.value.indexOf(term);
    while (index !== -1) {
      const before = item.value[index - 1] || "";
      const after = item.value[index + term.length] || "";
      if (isKanjiForTooltipAudit(before) || isKanjiForTooltipAudit(after)) {
        const coveringTerm = tooltipTerms.find((longTerm) =>
          longTerm !== term &&
          longTerm.includes(term) &&
          item.value.slice(index - longTerm.indexOf(term), index - longTerm.indexOf(term) + longTerm.length) === longTerm
        );
        if (!coveringTerm) {
          fail(`${item.pathLabel}: short tooltip term "${term}" may split a longer kanji compound`);
        }
      }
      index = item.value.indexOf(term, index + term.length);
    }
  }
}
const inlineCandidateWords = [...new Set([...modalLinkWords, ...tooltipTerms])].sort((a, b) => b.length - a.length);
if (inlineCandidateWords.length) {
  const inlinePattern = new RegExp(inlineCandidateWords.map(escapeRegExpForVerification).join("|"), "g");
  for (const item of verificationTexts) {
    for (const term of longTooltipTermsWithLinkWords) {
      let index = item.value.indexOf(term);
      while (index !== -1) {
        let matched = null;
        inlinePattern.lastIndex = 0;
        for (const match of item.value.matchAll(inlinePattern)) {
          const start = match.index;
          const end = start + match[0].length;
          if (start > index) break;
          if (start <= index && end >= index + term.length) {
            matched = match[0];
            break;
          }
        }
        if (!(matched && matched.includes(term))) {
          fail(`${item.pathLabel}: tooltip term "${term}" may be split by a shorter inline link`);
        }
        index = item.value.indexOf(term, index + term.length);
      }
    }
  }
}


for (const [compound, shortTerm] of [["文明化", "文明"], ["元奴隷", "元"], ["元政府", "元"]]) {
  const hasShortRuby = learningTerms.terms[shortTerm]?.reading || learningTerms.terms[shortTerm]?.ruby;
  if (compound !== "元奴隷" && shortTerm !== "元" && hasShortRuby) fail(`${shortTerm} may incorrectly ruby-split ${compound}`);
}


for (const [term, value] of Object.entries(learningTerms.terms || {})) {
  if (term.endsWith("戦争") && (value?.reading || value?.ruby)) fail(`${term} should be tooltip-only, not ruby-managed`);
}

const indexHtml = read("index.html");
if (!indexHtml.includes("data/learning-terms.js")) fail("index.html does not load data/learning-terms.js");
if (!/data\/learning-terms\.js[\s\S]*script\.js\?v=/.test(indexHtml)) fail("index.html must load data/learning-terms.js before script.js");
if (!indexHtml.includes("data/timeline-region-data.js")) fail("index.html does not load data/timeline-region-data.js");
if (!/data\/timeline-region-data\.js[\s\S]*script\.js\?v=/.test(indexHtml)) fail("index.html must load data/timeline-region-data.js before script.js");

const script = read("script.js");
if (script.includes("const rubyGlossary = {") || script.includes("let rubyGlossary")) fail("script.js still contains an inline ruby glossary");
if (script.includes("const personGenreGroups = [") || script.includes("const personInlineAliases = {")) fail("script.js still contains inline person metadata");
for (const token of ["const eraRegionPriority = {", "const subcategoryTimelineRegions = {", "const subcategoryTimelineRegionOverrides = {", "const subcategoryTimelineKeywords = {"]) {
  if (script.includes(token)) fail("script.js still contains inline timeline region data");
}
for (const token of ["normalizeLearningTermsData", "loadLearningTermsData", "applyStudyRuby", "applyKingdomRuby", "escapeHtml", "escapeRegExp", "eraFor", "primaryEraIdForPerson", "personBelongsToEra", "getEraDetail"]) {
  if (!script.includes(token)) fail(`script.js is missing ${token}`);
}
if (script.includes("�")) fail("script.js contains replacement characters");

if (failures.length) {
  console.error(failures.map((item) => `- ${item}`).join("\n"));
  process.exit(1);
}

console.log(`Static verification passed: ${Object.keys(learningTerms.terms).length} learning terms`);