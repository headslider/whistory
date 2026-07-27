const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const root = path.resolve(__dirname, "..");
const port = Number(process.env.IMAGE_WORKBENCH_PORT || 4184);
const host = "127.0.0.1";
const dataDir = path.join(root, "data");
const backupsRoot = path.join(root, "backups");

const jsAssignments = {
  "history-content": "window.historyContentData",
  "people-data": "window.WORLD_HISTORY_PEOPLE_DATA",
  "action-cards": "window.WORLD_HISTORY_ACTION_CARDS_DATA",
  "modal-data": "window.WORLD_HISTORY_MODAL_DATA"
};

const datasetFiles = [
  "history-content.json",
  "history-content.js",
  "people-data.json",
  "people-data.js",
  "action-cards.json",
  "action-cards.js",
  "modal-data.json",
  "modal-data.js"
];

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload, null, 2);
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  res.end(body);
}

function sendText(res, status, body, contentType = "text/plain; charset=utf-8") {
  res.writeHead(status, { "Content-Type": contentType, "Cache-Control": "no-store" });
  res.end(body);
}

function safePath(urlPath) {
  const clean = decodeURIComponent((urlPath || "/").split("?")[0]).replace(/^\/+/, "") || "image-workbench.html";
  const filePath = path.resolve(root, clean);
  if (!filePath.startsWith(root)) return null;
  return filePath;
}

function contentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".html") return "text/html; charset=utf-8";
  if (ext === ".css") return "text/css; charset=utf-8";
  if (ext === ".js") return "application/javascript; charset=utf-8";
  if (ext === ".json") return "application/json; charset=utf-8";
  if ([".png", ".jpg", ".jpeg", ".webp", ".gif"].includes(ext)) return `image/${ext.replace(".", "").replace("jpg", "jpeg")}`;
  return "application/octet-stream";
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (chunk) => {
      chunks.push(chunk);
      size += chunk.length;
      if (size > 80 * 1024 * 1024) {
        req.destroy();
        reject(new Error("payload too large"));
      }
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function stamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

function normalizePathSeparators(value) {
  return String(value || "").replace(/\\/g, "/");
}

function historyContentCompletenessMetrics(history) {
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

function assertHistoryContentNotRolledBack(history) {
  const metrics = historyContentCompletenessMetrics(history);
  if (metrics.subcategories !== 53) throw new Error(`historyContent.subcategories must be 53, got ${metrics.subcategories}`);
  if (metrics.textLen < 15000 || metrics.minText < 250) {
    throw new Error(`historyContent appears to be rolled back to short subcategory text. textLen=${metrics.textLen} minText=${metrics.minText}`);
  }
  if (!metrics.firstText.includes("肥沃な三日月地帯") || !metrics.firstText.includes("チャタル・ヒュユク")) {
    throw new Error("historyContent first subcategory does not match the latest complete text. Save rejected to prevent rollback.");
  }
}

function validatePayload(payload) {
  const history = payload.historyContent;
  const people = payload.peopleData;
  const action = payload.actionData;
  const modal = payload.modalData;
  if (!history || !Array.isArray(history.groups)) throw new Error("historyContent.groups がありません");
  if (!people || !Array.isArray(people.people)) throw new Error("peopleData.people がありません");
  if (!people.peopleByName || typeof people.peopleByName !== "object") throw new Error("peopleData.peopleByName がありません");
  if (!action || !action.actionCards || typeof action.actionCards !== "object") throw new Error("actionData.actionCards がありません");
  if (!modal || !Array.isArray(modal.kingdomCards)) throw new Error("modalData.kingdomCards がありません");
  if (!modal.kingdomPeople || typeof modal.kingdomPeople !== "object") throw new Error("modalData.kingdomPeople がありません");
  if (!history.groups.length) throw new Error("historyContent.groups が空です");
  assertHistoryContentNotRolledBack(history);
  return { history, people, action, modal };
}

function assertNoReplacementCharacters(name, data) {
  const text = JSON.stringify(data);
  if (text.includes("\uFFFD")) {
    throw new Error(name + " に文字化けの置換文字 U+FFFD が含まれています。保存を中止しました。");
  }
}

function assetFilePrefix(folder) {
  if (folder === "people") return "person";
  if (folder === "actions") return "action";
  if (folder === "subcategories") return "subcategory";
  if (folder === "periods") return "period";
  if (folder === "modal") return "modal";
  return "image";
}

function imageExtension(mime) {
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/png") return "png";
  if (mime === "image/gif") return "gif";
  return "webp";
}

function materializeDataUrlImage(value, folder, id, stats) {
  const text = String(value || "");
  const match = text.match(/^data:(image\/(?:webp|png|jpeg|jpg|gif));base64,(.+)$/i);
  if (!match) return value;
  const mime = match[1].toLowerCase().replace("image/jpg", "image/jpeg");
  const buffer = Buffer.from(match[2], "base64");
  const hash = crypto.createHash("sha1").update(buffer).digest("hex").slice(0, 10);
  const ext = imageExtension(mime);
  const dir = path.join(root, "assets", folder);
  fs.mkdirSync(dir, { recursive: true });
  const fileName = `${assetFilePrefix(folder)}-${hash}.${ext}`;
  fs.writeFileSync(path.join(dir, fileName), buffer);
  stats.count += 1;
  stats.bytes += buffer.length;
  return `assets/${folder}/${fileName}`;
}

function visualMeta(target, index) {
  if (!target || typeof target !== "object") return null;
  if (!Array.isArray(target)) return target;
  const meta = target[index];
  return meta && typeof meta === "object" && !Array.isArray(meta) ? meta : null;
}

function personId(person) {
  return Array.isArray(person) ? person[0] : person?.name;
}

function applyOfficialPersonVisualsToLookups(people) {
  const officialVisuals = new Map();
  for (const person of people.people || []) {
    const id = personId(person);
    const meta = visualMeta(person, 7) || {};
    if (id) officialVisuals.set(id, {
      image: meta.image || "",
      imageFocus: meta.imageFocus || "",
      imageAlt: meta.imageAlt || ""
    });
  }
  for (const person of Object.values(people.peopleByName || {})) {
    const id = personId(person);
    const fields = officialVisuals.get(id);
    if (!fields) continue;
    const meta = visualMeta(person, 7);
    if (!meta) continue;
    if (fields.image) meta.image = fields.image; else delete meta.image;
    if (fields.imageFocus) meta.imageFocus = fields.imageFocus; else delete meta.imageFocus;
    if (fields.imageAlt) meta.imageAlt = fields.imageAlt; else delete meta.imageAlt;
  }
}

function materializeEmbeddedImages(history, people, action) {
  const stats = { count: 0, bytes: 0 };
  for (const person of people.people || []) {
    const meta = visualMeta(person, 7);
    if (meta) meta.image = materializeDataUrlImage(meta.image, "people", personId(person), stats);
  }
  applyOfficialPersonVisualsToLookups(people);
  for (const [name, card] of Object.entries(action.actionCards || {})) {
    const meta = visualMeta(card, 3);
    if (meta) meta.image = materializeDataUrlImage(meta.image, "actions", name, stats);
  }
  for (const group of history.groups || []) {
    for (const era of group.eras || []) {
      for (const item of era.subcategories || []) {
        item.image = materializeDataUrlImage(item.image, "subcategories", item.id || item.title, stats);
      }
    }
  }
  return stats;
}

function writeDataSet(name, data) {
  const jsonText = JSON.stringify(data, null, 2) + "\n";
  fs.writeFileSync(path.join(dataDir, `${name}.json`), jsonText, "utf8");
  fs.writeFileSync(path.join(dataDir, `${name}.js`), `${jsAssignments[name]} = ${jsonText}`, "utf8");
}

function readDataSet(name) {
  return JSON.parse(fs.readFileSync(path.join(dataDir, `${name}.json`), "utf8"));
}

function loadCurrentDataSets() {
  const history = readDataSet("history-content");
  const people = readDataSet("people-data");
  const action = readDataSet("action-cards");
  const modal = readDataSet("modal-data");
  validatePayload({ historyContent: history, peopleData: people, actionData: action, modalData: modal });
  return { history, people, action, modal };
}

function findSubcategory(history, id) {
  for (const group of history.groups || []) {
    for (const era of group.eras || []) {
      const found = (era.subcategories || []).find((item) => item.id === id);
      if (found) return found;
    }
  }
  return null;
}

function targetForImageOperation(datasets, operation) {
  if (operation.type === "person") {
    return (datasets.people.people || []).find((person) => personId(person) === operation.id) || null;
  }
  if (operation.type === "action") return datasets.action.actionCards?.[operation.id];
  if (operation.type === "subcategory") return findSubcategory(datasets.history, operation.id);
  return null;
}

function imageMatchesAfterMaterialize(actualImage, expectedImage) {
  const actual = String(actualImage || "");
  const expected = String(expectedImage || "");
  if (!expected) return !actual;
  if (/^data:image\//i.test(expected)) return /^assets\//.test(actual) && !/^data:image\//i.test(actual);
  return actual === expected;
}

function imageFieldsForTarget(target, type) {
  if (type === "person") return visualMeta(target, 7) || {};
  if (type === "action") return visualMeta(target, 3) || {};
  return target || {};
}

function assertAppliedImageOperations(datasets, operations) {
  for (const operation of operations || []) {
    const target = targetForImageOperation(datasets, operation);
    if (!target) throw new Error(`保存後の画像更新対象が見つかりません: ${operation.type}/${operation.id}`);
    const fields = imageFieldsForTarget(target, operation.type);
    const after = operation.after || {};
    const expectedImage = after.image || "";
    if (!imageMatchesAfterMaterialize(fields.image || "", expectedImage)) {
      throw new Error(`画像保存の照合に失敗しました: ${operation.type}/${operation.id}`);
    }
    const expectedFocus = operation.type === "subcategory" && expectedImage ? (after.imageFocus || "center") : "";
    const actualFocus = operation.type === "subcategory" && fields.image ? (fields.imageFocus || "center") : "";
    if (actualFocus !== expectedFocus) {
      throw new Error(`画像位置の保存照合に失敗しました: ${operation.type}/${operation.id} expected=${expectedFocus} actual=${actualFocus}`);
    }
    const expectedAlt = after.imageAlt || "";
    const actualAlt = fields.imageAlt || "";
    if (actualAlt !== expectedAlt) {
      throw new Error(`画像代替テキストの保存照合に失敗しました: ${operation.type}/${operation.id}`);
    }
  }
}

function ensureBackupsRoot() {
  fs.mkdirSync(backupsRoot, { recursive: true });
}

function backupCurrent(kind = "apply", meta = {}) {
  ensureBackupsRoot();
  const dirName = `image-workbench-${kind}-${stamp()}`;
  const dir = path.join(backupsRoot, dirName);
  fs.mkdirSync(dir, { recursive: true });
  for (const file of datasetFiles) {
    fs.copyFileSync(path.join(dataDir, file), path.join(dir, file));
  }
  const manifest = {
    createdAt: new Date().toISOString(),
    kind,
    dir: normalizePathSeparators(path.relative(root, dir)),
    files: datasetFiles,
    meta
  };
  fs.writeFileSync(path.join(dir, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n", "utf8");
  return manifest.dir;
}

function readBackupManifest(dir) {
  const manifestPath = path.join(dir, "manifest.json");
  if (fs.existsSync(manifestPath)) {
    try {
      return JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    } catch {
      return null;
    }
  }
  return null;
}

function listBackups() {
  ensureBackupsRoot();
  return fs.readdirSync(backupsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.startsWith("image-workbench-"))
    .map((entry) => {
      const dir = path.join(backupsRoot, entry.name);
      const manifest = readBackupManifest(dir);
      const stat = fs.statSync(dir);
      return {
        dir: normalizePathSeparators(path.relative(root, dir)),
        name: entry.name,
        createdAt: manifest?.createdAt || stat.mtime.toISOString(),
        kind: manifest?.kind || "unknown",
        meta: manifest?.meta || {}
      };
    })
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}

function resolveBackupDir(relativeDir) {
  const normalized = normalizePathSeparators(relativeDir).replace(/^\/+/, "");
  if (!normalized.startsWith("backups/")) throw new Error("バックアップ指定が不正です。");
  const full = path.resolve(root, normalized);
  if (!full.startsWith(backupsRoot)) throw new Error("バックアップ指定が不正です。");
  if (!fs.existsSync(full) || !fs.statSync(full).isDirectory()) throw new Error("指定したバックアップが見つかりません。");
  return full;
}

function validateBackupBeforeRestore(sourceDir) {
  const historyPath = path.join(sourceDir, "history-content.json");
  if (!fs.existsSync(historyPath)) throw new Error("バックアップに history-content.json がありません。");
  const history = JSON.parse(fs.readFileSync(historyPath, "utf8"));
  assertHistoryContentNotRolledBack(history);
}

function restoreBackup(relativeDir) {
  const sourceDir = resolveBackupDir(relativeDir);
  validateBackupBeforeRestore(sourceDir);
  for (const file of datasetFiles) {
    const source = path.join(sourceDir, file);
    if (!fs.existsSync(source)) throw new Error(`バックアップに ${file} がありません。`);
    fs.copyFileSync(source, path.join(dataDir, file));
  }
}

function responseDatasets(persisted) {
  return {
    historyContent: persisted.history,
    peopleData: persisted.people,
    actionData: persisted.action,
    modalData: persisted.modal
  };
}

async function handleApply(req, res) {
  try {
    const body = await readBody(req);
    const payload = JSON.parse(body);
    const { history, people, action, modal } = validatePayload(payload);
    const operations = Array.isArray(payload.patch?.operations) ? payload.patch.operations : [];

    assertNoReplacementCharacters("historyContent", history);
    assertNoReplacementCharacters("peopleData", people);
    assertNoReplacementCharacters("actionData", action);
    assertNoReplacementCharacters("modalData", modal);
    const assetStats = materializeEmbeddedImages(history, people, action);
    if (operations.length) assertAppliedImageOperations({ history, people, action, modal }, operations);

    const backupDir = backupCurrent("apply", { operations: operations.length, mode: "direct-dataset-save" });
    writeDataSet("history-content", history);
    writeDataSet("people-data", people);
    writeDataSet("action-cards", action);
    writeDataSet("modal-data", modal);
    const persisted = loadCurrentDataSets();
    if (operations.length) assertAppliedImageOperations(persisted, operations);
    sendJson(res, 200, {
      ok: true,
      backupDir,
      operations: operations.length,
      embeddedImageSize: payload.patch?.embeddedImageSize || "0B",
      materializedImages: assetStats.count,
      materializedBytes: assetStats.bytes,
      datasets: responseDatasets(persisted),
      backups: listBackups()
    });
  } catch (error) {
    sendJson(res, 400, { ok: false, error: error.message });
  }
}

async function handleRollback(req, res) {
  try {
    const body = await readBody(req);
    const payload = JSON.parse(body || "{}");
    const backupDir = String(payload.backupDir || "").trim();
    if (!backupDir) throw new Error("ロールバック対象のバックアップを選択してください。");
    const rollbackBackupDir = backupCurrent("rollback-before-restore", { restoreFrom: backupDir });
    restoreBackup(backupDir);
    const persisted = loadCurrentDataSets();
    sendJson(res, 200, {
      ok: true,
      restoredFrom: backupDir,
      rollbackBackupDir,
      datasets: responseDatasets(persisted),
      backups: listBackups()
    });
  } catch (error) {
    sendJson(res, 400, { ok: false, error: error.message });
  }
}

function handleBackups(res) {
  try {
    sendJson(res, 200, { ok: true, backups: listBackups() });
  } catch (error) {
    sendJson(res, 500, { ok: false, error: error.message });
  }
}

const server = http.createServer((req, res) => {
  if (req.method === "POST" && req.url === "/api/apply-image-data") {
    handleApply(req, res);
    return;
  }
  if (req.method === "POST" && req.url === "/api/rollback-image-data") {
    handleRollback(req, res);
    return;
  }
  if (req.method === "GET" && req.url === "/api/backups") {
    handleBackups(res);
    return;
  }
  if (req.method !== "GET") {
    sendText(res, 405, "Method Not Allowed");
    return;
  }
  const filePath = safePath(req.url || "/");
  if (!filePath || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    sendText(res, 404, "File not found");
    return;
  }
  res.writeHead(200, { "Content-Type": contentType(filePath), "Cache-Control": "no-store" });
  fs.createReadStream(filePath).pipe(res);
});

server.listen(port, host, () => {
  console.log(`World history image workbench server: http://${host}:${port}/image-workbench.html`);
});

