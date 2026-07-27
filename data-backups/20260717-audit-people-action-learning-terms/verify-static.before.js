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
const learningTerms = loadJson("data/learning-terms.json");
if (!learningTerms.schemaVersion || !learningTerms.terms) fail("learning-terms.json has an invalid shape");
for (const [term, value] of Object.entries(learningTerms.terms || {})) {
  const reading = value?.reading || value?.ruby?.reading;
  if (!reading) fail(`${term} has no reading`);
  if (/[\u30a0-\u30ff]/.test(term)) fail(`${term} contains katakana and should not be ruby-managed as a whole term`);
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