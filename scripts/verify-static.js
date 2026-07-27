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

function historyContentCompletenessMetricsForVerification(history) {
  const subcategories = [];
  for (const group of history?.groups || []) {
    for (const era of group.eras || []) {
      for (const item of era.subcategories || []) subcategories.push(item);
    }
  }
  const textLengths = subcategories.map((item) => String(item.text || '').length);
  return {
    subcategories: subcategories.length,
    textLen: textLengths.reduce((total, length) => total + length, 0),
    minText: textLengths.length ? Math.min(...textLengths) : 0,
    firstText: String(subcategories[0]?.text || '')
  };
}

const historyCompleteness = historyContentCompletenessMetricsForVerification(loadJson("data/history-content.json"));
if (historyCompleteness.subcategories !== 53) fail(`history-content.json must contain 53 subcategories, got ${historyCompleteness.subcategories}`);
if (historyCompleteness.textLen < 15000 || historyCompleteness.minText < 250) fail(`history-content.json appears rolled back to short subcategory text: textLen=${historyCompleteness.textLen} minText=${historyCompleteness.minText}`);
if (!historyCompleteness.firstText.includes("肥沃な三日月地帯") || !historyCompleteness.firstText.includes("チャタル・ヒュユク")) fail("history-content.json first subcategory does not match the latest complete text canary");

const imageReferenceDataFiles = [
  "data/history-content.json",
  "data/action-cards.json",
  "data/people-data.json",
  "data/modal-data.json",
  "data/learning-terms.json",
  "data/timeline-region-data.json"
];
function collectImageReferencesForVerification(value, file, pathParts = [], refs = []) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectImageReferencesForVerification(item, file, pathParts.concat(index), refs));
    return refs;
  }
  if (value && typeof value === "object") {
    Object.entries(value).forEach(([key, item]) => collectImageReferencesForVerification(item, file, pathParts.concat(key), refs));
    return refs;
  }
  if (typeof value === "string" && /\.(webp|png|jpg|jpeg|gif)$/i.test(value)) {
    refs.push({ file, pathLabel: pathParts.join("."), value });
  }
  return refs;
}
for (const file of imageReferenceDataFiles) {
  const refs = collectImageReferencesForVerification(loadJson(file), file);
  for (const ref of refs) {
    if (/[^\x00-\x7F]/.test(ref.value)) fail(`${ref.file}:${ref.pathLabel} image reference must be ASCII: ${ref.value}`);
    if (!fs.existsSync(path.join(root, ref.value))) fail(`${ref.file}:${ref.pathLabel} image reference is missing: ${ref.value}`);
  }
}
const peopleImageReferences = new Map();
for (const person of loadJson("data/people-data.json").people || []) {
  if (!person?.image) continue;
  const users = peopleImageReferences.get(person.image) || [];
  users.push(person.name || "(name missing)");
  peopleImageReferences.set(person.image, users);
}
for (const [image, users] of peopleImageReferences.entries()) {
  if (users.length > 1) fail(`people-data.json must not share one image across people: ${image} -> ${users.join(", ")}`);
}
const actionData = loadJson("data/action-cards.json");
const learningTerms = loadJson("data/learning-terms.json");
if (!learningTerms.schemaVersion || !learningTerms.terms) fail("learning-terms.json has an invalid shape");
for (const [term, value] of Object.entries(learningTerms.terms || {})) {
  const reading = value?.reading || value?.ruby?.reading;
  const tooltipBody = value?.tooltip?.body;
  if (!reading && !tooltipBody) fail(`${term} has neither reading nor tooltip body`);
  if (reading && /[\u30a0-\u30ff]/.test(term.replace(/[・ー]/g, ""))) fail(`${term} contains katakana and should not be ruby-managed as a whole term`);
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

const requiredDifficultConceptRubyTerms = {
  "春秋・戦国時代": "しゅんじゅう・せんごくじだい",
  "瑜伽行派・唯識思想": "ゆがぎょうは・ゆいしきしそう",
  "科挙": "かきょ",
  "科挙官僚": "かきょかんりょう",
  "科挙文体": "かきょぶんたい",
  "法華経": "ほけきょう",
  "阿弥陀経": "あみだきょう",
  "中論": "ちゅうろん",
  "廬山": "ろざん",
  "唯識思想": "ゆいしきしそう"
};
for (const [term, reading] of Object.entries(requiredDifficultConceptRubyTerms)) {
  const actual = learningTerms.terms[term]?.reading || learningTerms.terms[term]?.ruby?.reading;
  if (actual !== reading) fail(`${term} must keep difficult concept ruby ${reading}`);
  if (!learningTerms.terms[term]?.tooltip?.body) fail(`${term} must keep a tooltip body`);
}

const requiredDifficultCultureRubyTerms = {
  "仰韶文化": "ぎょうしょうぶんか",
  "河姆渡文化": "かぼとぶんか",
  "龍山文化": "りゅうざんぶんか",
  "良渚文化": "りょうしょぶんか",
  "紅山文化": "こうさんぶんか",
  "三星堆文化": "さんせいたいぶんか",
  "馬家窯文化": "ばかようぶんか",
  "大汶口文化": "だいぶんこうぶんか",
  "二里頭文化": "にりとうぶんか",
  "裴李崗文化": "はいりこうぶんか",
  "老官台文化": "ろうかんだいぶんか",
  "興隆窪文化": "こうりゅうわぶんか",
  "石家河文化": "せっかかぶんか"
};
for (const [term, reading] of Object.entries(requiredDifficultCultureRubyTerms)) {
  const actual = learningTerms.terms[term]?.reading || learningTerms.terms[term]?.ruby?.reading;
  if (actual !== reading) fail(`${term} must keep difficult culture-name ruby ${reading}`);
  if (!learningTerms.terms[term]?.tooltip?.body) fail(`${term} must keep a tooltip body`);
}

const forbiddenStandaloneRubyTerms = ["農業", "文明", "文字", "仏教", "鉄道", "戦争", "王", "村", "道", "核", "港", "海", "銀", "進出期", "文化交流", "国際協力", "地球規模", "制度改革"];
for (const term of forbiddenStandaloneRubyTerms) {
  if (learningTerms.terms[term]?.reading || learningTerms.terms[term]?.ruby || learningTerms.terms[term]?.tooltip?.body) {
    fail(`${term} should not be standalone ruby/tooltip-managed`);
  }
}

const elementaryKanjiTooltipOnlyTerms = ["列強", "先住民", "戦間期", "港市", "民族移動", "市民政治", "不平等条約", "北大西洋条約機構", "雑穀", "牧畜", "諸侯", "抵抗勢力", "律令", "拮抗", "均衡", "航路開拓", "香辛料", "十六大国"];
for (const term of elementaryKanjiTooltipOnlyTerms) {
  if (!learningTerms.terms[term]?.tooltip?.body) fail(`${term} should remain tooltip-managed`);
  if (learningTerms.terms[term]?.reading || learningTerms.terms[term]?.ruby) fail(`${term} should be tooltip-only, not ruby-managed`);
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


const fivePassRequiredTooltipTerms = [
  "エックス線",
  "X線",
  "放射線",
  "放射能",
  "放射性元素",
  "電子",
  "原子核",
  "量子力学",
  "相対性理論",
  "核分裂",
  "核融合",
  "DNA",
  "二重らせん",
  "遺伝子",
  "遺伝情報",
  "結晶構造",
  "抗生物質",
  "ペニシリン",
  "予防接種",
  "種痘",
  "微生物",
  "細菌",
  "周期表",
  "化学元素",
  "爆薬技術",
  "ダイナマイト",
  "飛行機",
  "宇宙開発",
  "人工衛星",
  "情報技術",
  "検索エンジン",
  "オンライン百科事典",
  "オープンソース開発",
  "人工知能",
  "ゲーム理論",
  "温室効果ガス",
  "気候変動",
  "共和政",
  "民主政",
  "民主主義",
  "立憲政治",
  "中央集権",
  "官僚制",
  "官僚制度",
  "律令制度",
  "科挙",
  "郡県制",
  "身分制",
  "恐怖政治",
  "三民主義",
  "辛亥革命",
  "ロシア革命",
  "文化大革命",
  "ハイチ革命",
  "第一回三頭政治",
  "非常事態宣言",
  "世界人権宣言",
  "人民公社",
  "大躍進政策",
  "改革開放",
  "独裁体制",
  "全体主義",
  "国粋主義",
  "総力戦",
  "核戦争",
  "非同盟",
  "国際機関",
  "国際秩序",
  "ヴェルサイユ体制",
  "ポエニ戦争",
  "十字軍",
  "ニカイア公会議",
  "日中戦争",
  "枢軸国",
  "中央同盟国",
  "連合国",
  "サンフランシスコ会議",
  "国際連合憲章",
  "平和条約",
  "トルデシリャス条約",
  "七年戦争",
  "オーストリア継承戦争",
  "新兵器",
  "軍拡",
  "ヒンドゥー教",
  "ゾロアスター教",
  "ジャイナ教",
  "一神教",
  "東方正教会",
  "聖職者",
  "教皇",
  "巡礼",
  "経典",
  "聖書",
  "クルアーン",
  "ルネサンス",
  "人文主義",
  "ヘレニズム文化",
  "ルネサンス文化",
  "ギリシャ文化",
  "イスラム文化",
  "ヒンドゥー文化",
  "文字文化",
  "漢字文化",
  "大衆文化",
  "植民地化",
  "政治的・経済的支配",
  "海外支配",
  "強制労働",
  "長時間労働",
  "児童労働",
  "労働運動",
  "平和運動",
  "市民運動",
  "社会運動",
  "反植民地運動",
  "女性運動",
  "反アパルトヘイト運動",
  "不服従運動",
  "資本主義",
  "社会主義",
  "共産主義",
  "自由貿易",
  "三角貿易",
  "大西洋交易",
  "都市化",
  "工業化",
  "世界恐慌",
  "金融危機",
  "多国籍企業",
  "グローバル化",
  "気候変動対策運動",
  "文化運動"
];
for (const term of fivePassRequiredTooltipTerms) {
  if (!learningTerms.terms[term]?.tooltip?.body) fail(`${term} must have a five-pass specialized tooltip body`);
}
const fivePassTooltipOnlyTerms = fivePassRequiredTooltipTerms.filter((term) => !["封建的特権", "水力紡績機", ...Object.keys(requiredDifficultConceptRubyTerms)].includes(term));
for (const term of fivePassTooltipOnlyTerms) {
  if (learningTerms.terms[term]?.reading || learningTerms.terms[term]?.ruby) fail(`${term} should be tooltip-only, not ruby-managed`);
}


const fivePassPostcheckTooltipTerms = [
  "電信",
  "汽船",
  "原子",
  "憲法改正",
  "儒教",
  "大学",
  "写本",
  "奴隷制",
  "国際社会主義運動"
];
for (const term of fivePassPostcheckTooltipTerms) {
  if (!learningTerms.terms[term]?.tooltip?.body) fail(`${term} must have a five-pass postcheck tooltip body`);
  if (learningTerms.terms[term]?.reading || learningTerms.terms[term]?.ruby) fail(`${term} should be tooltip-only after five-pass postcheck`);
}


const shortTooltipCompoundCoverTerms = [
  "宥和政策",
  "安全保障理事会",
  "非同盟外交",
  "非同盟運動",
  "初代教皇",
  "共和政末期",
  "第五共和政",
  "フランス第一共和政",
  "フランス第三共和政",
  "スペイン第二共和政",
  "巡礼者",
  "原子爆弾",
  "原子炉",
  "原子模型",
  "身分制度"
];
for (const term of shortTooltipCompoundCoverTerms) {
  if (!learningTerms.terms[term]?.tooltip?.body) fail(`${term} must have a compound-cover tooltip body`);
  if (learningTerms.terms[term]?.reading || learningTerms.terms[term]?.ruby) fail(`${term} should be tooltip-only as a compound cover term`);
}


const broadAuditRequiredTooltipTerms = [
  "大西洋革命",
  "政治思想",
  "航海技術",
  "イギリス支配",
  "スペイン支配",
  "河姆渡文化",
  "仰韶文化",
  "龍山文化",
  "良渚文化",
  "紅山文化",
  "三星堆文化",
  "バクトリア・マルギアナ文化",
  "アンドロノヴォ文化",
  "バルディビア文化",
  "ナトゥーフ文化",
  "ハッスーナ文化",
  "オクサス文化",
  "チャビン文化",
  "オルメカ文化",
  "カラル文明",
  "イギリス東インド会社支配",
  "イギリス労働運動",
  "ポウハタン連合",
  "マラーター同盟",
  "インド国民会議",
  "アフリカ連合",
  "ASEAN",
  "WHO",
  "多民族支配",
  "地中海支配",
  "国際文化",
  "科学技術",
  "政治運動",
  "抵抗運動",
  "差別政策",
  "農場労働",
  "海上支配",
  "瑜伽行派・唯識思想",
  "メキシコ独立運動",
  "人種隔離政策",
  "量子電磁力学",
  "社会契約論",
  "共産党宣言",
  "大衆運動",
  "世界貿易",
  "宗教思想",
  "解析機関",
  "一党支配",
  "政治体制",
  "貴族文化",
  "法華経",
  "旧制度",
  "法制度",
  "女性と女性市民の権利宣言",
  "セネカフォールズ会議",
  "サンスクリット文化",
  "グリーンベルト運動",
  "スペイン植民地支配",
  "フィリピン独立運動",
  "フランス植民地支配",
  "イギリス植民地支配",
  "ニューディール政策"
];
const broadAuditRubyAllowedTerms = new Set([...Object.keys(requiredDifficultCultureRubyTerms), ...Object.keys(requiredDifficultConceptRubyTerms)]);
for (const term of broadAuditRequiredTooltipTerms) {
  if (!learningTerms.terms[term]?.tooltip?.body) fail(`${term} must have a broad-audit tooltip body`);
  if (!broadAuditRubyAllowedTerms.has(term) && (learningTerms.terms[term]?.reading || learningTerms.terms[term]?.ruby)) fail(`${term} should be tooltip-only after broad audit`);
}


const finalBroadAuditRequiredTooltipTerms = [
  "ハラフ文化",
  "スルタナの夢",
  "廃止運動",
  "対外戦争",
  "ハックルベリー・フィンの冒険",
  "トム・ソーヤーの冒険",
  "アシュターディヤーイー",
  "ルースカヤ・プラウダ",
  "カラマーゾフの兄弟",
  "アンナ・カレーニナ",
  "メソポタミア文明",
  "フランス人権宣言",
  "アフリカ民族会議",
  "女性の権利の擁護",
  "近代イスラム思想",
  "アメリカ独立宣言",
  "カンタベリー物語",
  "ギーターンジャリ",
  "イタリア統一運動",
  "女性社会政治同盟",
  "キューバ独立運動",
  "アンデス諸文明",
  "マハーバーラタ",
  "ラーマーヤナ",
  "ローマ帝国支配",
  "ユーラシア交易",
  "人種差別的支配",
  "経済社会理事会",
  "ヨーロッパ文化",
  "キリスト教思想",
  "シャクンタラー",
  "シューマン宣言",
  "ガーナ独立運動",
  "ケニア独立運動",
  "スターリン体制",
  "アステカ支配",
  "東アジア交易",
  "ローマ法大全",
  "イスラム思想",
  "チリ独立運動",
  "女性権利運動",
  "社会保険制度"
];
for (const term of finalBroadAuditRequiredTooltipTerms) {
  if (!learningTerms.terms[term]?.tooltip?.body) fail(`${term} must have a final broad-audit tooltip body`);
  if (learningTerms.terms[term]?.reading || learningTerms.terms[term]?.ruby) fail(`${term} should be tooltip-only after final broad audit`);
}


const jinDynastyContextPatternForVerification = /金(?:王朝|軍|国|の王|に攻め|と戦|と争|を攻め|へ攻め)|(?:女真|南宋|北宋|宋|遼|岳飛|中国東北|華北|北方の)(?:と|の)?金/;
function isJinDynastyKingdomContextForVerification(source, index) {
  const start = Math.max(0, index - 12);
  const end = Math.min(source.length, index + 14);
  return jinDynastyContextPatternForVerification.test(source.slice(start, end));
}
for (const sample of ["絹、香辛料、金、陶磁器、書物が動きました。", "香辛料、金、陶磁器、茶が同じ交易圏で動くようになり", "金・象牙・奴隷の交易拠点"]) {
  const index = sample.indexOf("金");
  if (isJinDynastyKingdomContextForVerification(sample, index)) fail("commodity gold should not match Jin dynasty context: " + sample);
}
for (const sample of ["南宋の将軍です。北方の金に抵抗しました。", "女真が建てた金王朝は華北へ進出しました。", "宋と金が争いました。"]) {
  const index = sample.indexOf("金");
  if (!isJinDynastyKingdomContextForVerification(sample, index)) fail("Jin dynasty context should be detected: " + sample);
}
for (const sample of ["各国は文明化を掲げました。", "都市文明が発達しました。", "仏教文化が広がりました。"]) {
  const actionName = sample.includes("文明") ? "文明" : "文化";
  const index = sample.indexOf(actionName);
  const before = sample[index - 1] || "";
  const after = sample[index + actionName.length] || "";
  if (!(/[\u4e00-\u9fff々]/.test(before) || /[\u4e00-\u9fff々]/.test(after))) fail("compound action-link guard sample is malformed: " + sample);
}

const indexHtml = read("index.html");
if (!indexHtml.includes("data/learning-terms.js")) fail("index.html does not load data/learning-terms.js");
if (!/data\/learning-terms\.js[\s\S]*script\.js\?v=/.test(indexHtml)) fail("index.html must load data/learning-terms.js before script.js");
if (!indexHtml.includes("data/timeline-region-data.js")) fail("index.html does not load data/timeline-region-data.js");
if (!/data\/timeline-region-data\.js[\s\S]*script\.js\?v=/.test(indexHtml)) fail("index.html must load data/timeline-region-data.js before script.js");

const script = read("script.js");
if (!script.includes('item?.type === "action" && /^[\\u4e00-\\u9fff々]+$/.test(name)')) fail("script.js must block action-card links inside kanji compounds such as 文明化");
if (!script.includes("isJinDynastyKingdomContext")) fail("script.js must contain Jin dynasty vs commodity gold context guard");
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





