let eras = [];
let eraImages = {};
let eraGroups = [];
let powers = [];
let eraDetails = {};
let worldHistoryActionSubcategories = [];
let subcategoryImages = {};
let subcategoryImageFocusByName = new Map();
let subcategoryPersonNotes = {};
let kingdomCards = [];
let threePromise = null;

const eraTimelineBounds = {
  farming: [-10000, -3500],
  civilization: [-3500, -800],
  "ancient-empires": [-800, 1],
  "faith-cultures": [1, 600],
  "trade-kingdoms": [600, 1400],
  voyages: [1400, 1700],
  revolutions: [1700, 1850],
  "connected-world": [1850, 1914],
  "world-wars": [1914, 1945],
  "global-future": [1945, 2026]
};

function hasKnownTimelineRange(card) {
  return Array.isArray(card.timelineRange) && card.timelineRange.length === 2 && card.timelineRange.every((year) => Number.isFinite(year));
}

function getTimelineKind(card) {
  if (card.kind) return card.kind;
  if (card.opensActionCard) return "service";
  if (card.category && card.category.includes("対立")) return "rivalry";
  return "kingdom";
}

let kingdomGlobeState = null;

function loadThree() {
  if (window.THREE) return Promise.resolve(window.THREE);
  if (!threePromise) threePromise = import("./assets/vendor/three.module.js").then((module) => {
    window.THREE = module;
    return module;
  });
  return threePromise;
}

function lonLatToVector(lon, lat, radius) {
  const phi = lat * Math.PI / 180;
  const theta = lon * Math.PI / 180;
  const cosPhi = Math.cos(phi);
  return {
    x: radius * cosPhi * Math.cos(theta),
    y: radius * Math.sin(phi),
    z: -radius * cosPhi * Math.sin(theta)
  };
}

function northVectorAt(lon, lat, radius) {
  const phi = lat * Math.PI / 180;
  const theta = lon * Math.PI / 180;
  return {
    x: -radius * Math.sin(phi) * Math.cos(theta),
    y: radius * Math.cos(phi),
    z: radius * Math.sin(phi) * Math.sin(theta)
  };
}

function orientGlobeToPoint(THREE, globeGroup, lon, lat) {
  const localFront = new THREE.Vector3(...Object.values(lonLatToVector(lon, lat, 1))).normalize();
  const localUp = new THREE.Vector3(...Object.values(northVectorAt(lon, lat, 1))).normalize();
  const localRight = new THREE.Vector3().crossVectors(localUp, localFront).normalize();
  localUp.crossVectors(localFront, localRight).normalize();

  const localBasis = new THREE.Matrix4().makeBasis(localRight, localUp, localFront);
  if (typeof localBasis.invert === "function") localBasis.invert();
  else localBasis.getInverse(localBasis);
  globeGroup.quaternion.setFromRotationMatrix(localBasis);
}

function makeLandTexture(THREE) {
  const canvas = document.createElement("canvas");
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#21445b";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#52bfbd";
  ctx.strokeStyle = "rgba(255, 255, 255, .2)";
  ctx.lineWidth = 1.2;

  const project = ([lon, lat]) => [
    ((lon + 180) / 360) * canvas.width,
    ((90 - lat) / 180) * canvas.height
  ];
  const drawRing = (points) => {
    ctx.beginPath();
    points.forEach((point, index) => {
      const [x, y] = project(point);
      index ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    });
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  };

  forEachLandRing(drawRing);

  ctx.strokeStyle = "rgba(255, 255, 255, .09)";
  ctx.lineWidth = 1;
  for (let lon = -180; lon <= 180; lon += 30) {
    ctx.beginPath();
    for (let lat = -80; lat <= 80; lat += 5) {
      const [x, y] = project([lon, lat]);
      lat === -80 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  for (let lat = -60; lat <= 60; lat += 30) {
    ctx.beginPath();
    for (let lon = -180; lon <= 180; lon += 5) {
      const [x, y] = project([lon, lat]);
      lon === -180 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  if (THREE.SRGBColorSpace) texture.colorSpace = THREE.SRGBColorSpace;
  else texture.encoding = THREE.sRGBEncoding;
  texture.anisotropy = 4;
  return texture;
}

function forEachLandRing(callback) {
  const features = window.NE_LAND_110M?.features || [];
  features.forEach((feature) => {
    const coordinates = feature.geometry?.coordinates || [];
    if (feature.geometry?.type === "Polygon") {
      coordinates.forEach(callback);
    } else if (feature.geometry?.type === "MultiPolygon") {
      coordinates.forEach((polygon) => polygon.forEach(callback));
    }
  });
}

function normalizeLonDelta(lon, centerLon) {
  let delta = lon - centerLon;
  while (delta > 180) delta -= 360;
  while (delta < -180) delta += 360;
  return delta;
}

function drawFallbackGlobe(canvas, card) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return false;
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(320, Math.round(rect.width || canvas.width || 960));
  const height = Math.max(260, Math.round(rect.height || canvas.height || 620));
  const scale = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);

  const cx = width / 2;
  const cy = height / 2;
  const r = Math.min(width, height) * 0.38;
  const centerLon = card.lon;
  const centerLat = card.lat;

  ctx.fillStyle = "#21445b";
  ctx.fillRect(0, 0, width, height);

  const ocean = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.4, r * 0.15, cx, cy, r);
  ocean.addColorStop(0, "#2f6078");
  ocean.addColorStop(1, "#21445b");
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = ocean;
  ctx.fill();

  ctx.strokeStyle = "rgba(255,255,255,.16)";
  ctx.lineWidth = 1;
  for (let lon = -180; lon <= 180; lon += 30) drawOrthographicLine(ctx, [[lon, -80], [lon, 80]], centerLon, centerLat, cx, cy, r, 4);
  for (let lat = -60; lat <= 60; lat += 30) drawOrthographicLine(ctx, [[-180, lat], [180, lat]], centerLon, centerLat, cx, cy, r, 4);

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();

  ctx.fillStyle = "#52bfbd";
  ctx.strokeStyle = "rgba(255,255,255,.16)";
  ctx.lineWidth = 1;
  forEachLandRing((ring) => drawOrthographicRing(ctx, ring, centerLon, centerLat, cx, cy, r));

  ctx.restore();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(255,255,255,.32)";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx, cy, 9, 0, Math.PI * 2);
  ctx.fillStyle = "#d64545";
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = "#fff7cf";
  ctx.stroke();
  return true;
}

function orthographicPoint([lon, lat], centerLon, centerLat, cx, cy, r) {
  const lambda = normalizeLonDelta(lon, centerLon) * Math.PI / 180;
  const phi = lat * Math.PI / 180;
  const phi0 = centerLat * Math.PI / 180;
  const cosc = Math.sin(phi0) * Math.sin(phi) + Math.cos(phi0) * Math.cos(phi) * Math.cos(lambda);
  return {
    x: cx + r * Math.cos(phi) * Math.sin(lambda),
    y: cy - r * (Math.cos(phi0) * Math.sin(phi) - Math.sin(phi0) * Math.cos(phi) * Math.cos(lambda)),
    visible: cosc >= 0
  };
}

function drawOrthographicRing(ctx, ring, centerLon, centerLat, cx, cy, r) {
  let hasVisiblePoint = false;
  let drawing = false;
  ctx.beginPath();
  ring.forEach((coordinate) => {
    const point = orthographicPoint(coordinate, centerLon, centerLat, cx, cy, r);
    if (!point.visible) {
      drawing = false;
      return;
    }
    hasVisiblePoint = true;
    drawing ? ctx.lineTo(point.x, point.y) : ctx.moveTo(point.x, point.y);
    drawing = true;
  });
  if (hasVisiblePoint) {
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
}

function drawOrthographicLine(ctx, endpoints, centerLon, centerLat, cx, cy, r, step) {
  const [start, end] = endpoints;
  const points = [];
  if (start[0] === end[0]) {
    for (let lat = start[1]; lat <= end[1]; lat += step) points.push([start[0], lat]);
  } else {
    for (let lon = start[0]; lon <= end[0]; lon += step) points.push([lon, start[1]]);
  }
  let drawing = false;
  ctx.beginPath();
  points.forEach((coordinate) => {
    const point = orthographicPoint(coordinate, centerLon, centerLat, cx, cy, r);
    if (!point.visible) {
      drawing = false;
      return;
    }
    drawing ? ctx.lineTo(point.x, point.y) : ctx.moveTo(point.x, point.y);
    drawing = true;
  });
  ctx.stroke();
}

function cleanupKingdomGlobe() {
  if (!kingdomGlobeState) return;
  cancelAnimationFrame(kingdomGlobeState.frame);
  window.removeEventListener("resize", kingdomGlobeState.resize);
  kingdomGlobeState.scene.traverse((object) => {
    if (object.geometry) object.geometry.dispose();
    if (object.material) {
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach((material) => {
        if (material.map) material.map.dispose();
        material.dispose();
      });
    }
  });
  kingdomGlobeState.renderer.dispose();
  kingdomGlobeState = null;
}

async function renderKingdomGlobe(card) {
  cleanupKingdomGlobe();
  const canvas = document.getElementById("kingdomGlobe");
  const fallback = document.querySelector(".globe-fallback");
  if (!canvas) return;

  try {
    const THREE = await loadThree();
    if (!document.body.contains(canvas)) return;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#21445b");
    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 20);
    camera.position.set(0, 0, 3.4);

    const globeGroup = new THREE.Group();
    scene.add(globeGroup);

    const earth = new THREE.Mesh(
      new THREE.SphereGeometry(1, 96, 64),
      new THREE.MeshBasicMaterial({ map: makeLandTexture(THREE) })
    );
    globeGroup.add(earth);

    const outline = new THREE.Mesh(
      new THREE.SphereGeometry(1.006, 96, 64),
      new THREE.MeshBasicMaterial({
        color: "#ffffff",
        transparent: true,
        opacity: 0.08,
        side: THREE.BackSide
      })
    );
    globeGroup.add(outline);

    const markerPos = lonLatToVector(card.lon, card.lat, 1.08);
    const marker = new THREE.Mesh(
      new THREE.SphereGeometry(0.052, 24, 16),
      new THREE.MeshStandardMaterial({
        color: "#fff7cf",
        emissive: "#d64545",
        emissiveIntensity: 1,
        roughness: 0.28
      })
    );
    marker.position.set(markerPos.x, markerPos.y, markerPos.z);
    globeGroup.add(marker);

    const stemStart = lonLatToVector(card.lon, card.lat, 1.01);
    const stemEnd = lonLatToVector(card.lon, card.lat, 1.2);
    const stemGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(stemStart.x, stemStart.y, stemStart.z),
      new THREE.Vector3(stemEnd.x, stemEnd.y, stemEnd.z)
    ]);
    const stem = new THREE.Line(stemGeometry, new THREE.LineBasicMaterial({ color: "#fff7cf", linewidth: 2 }));
    globeGroup.add(stem);

    orientGlobeToPoint(THREE, globeGroup, card.lon, card.lat);

    scene.add(new THREE.AmbientLight("#ffffff", 1.1));
    const keyLight = new THREE.DirectionalLight("#ffffff", 2.2);
    keyLight.position.set(2.4, 2.2, 3.8);
    scene.add(keyLight);

    const resize = () => {
      const width = Math.max(320, canvas.clientWidth);
      const height = Math.max(260, canvas.clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    resize();

    const animate = () => {
      renderer.render(scene, camera);
      kingdomGlobeState.frame = requestAnimationFrame(animate);
    };

    kingdomGlobeState = { renderer, scene, resize, frame: 0 };
    window.addEventListener("resize", resize);
    animate();
    if (fallback) fallback.hidden = true;
  } catch (error) {
    const fallbackDrawn = drawFallbackGlobe(canvas, card);
    if (fallback) fallback.hidden = fallbackDrawn;
    console.error(error);
  }
}

let people = [];
let personByName = new Map();
let kingdomPeople = {};

function getKingdomPeople(card) {
  return (kingdomPeople[card.name] || []).filter((name) => personByName.has(name));
}

let actionCards = {};

function subcategoryBodyText(subcategory) {
  const [, region, , summary, text] = subcategory;
  const note = subcategoryPersonNotes[subcategory[2]];
  return `${region}では、${summary}。${text}${note ? ` ${note}` : ""}`;
}
const quizzes = [
  { q: "メソポタミアやエジプトなど、最初の文明が育ちやすかった場所は？", a: "大きな川の近く", options: ["大きな川の近く", "氷だけの地域", "月の上"] },
  { q: "シルクロードで動いたものとして正しいのは？", a: "絹や宗教や技術", options: ["絹や宗教や技術", "スマートフォンだけ", "恐竜"] },
  { q: "産業革命で大きく広がったものは？", a: "機械と工場", options: ["機械と工場", "ピラミッドづくり", "狩りだけの生活"] },
  { q: "第二次世界大戦後に作られた国際協力の場は？", a: "国際連合", options: ["国際連合", "ローマ帝国", "マリ帝国"] }
];

let termTooltipGlossary = {};
let manualStudyRuby = {};
let manualKingdomRuby = {};
let manualPersonRuby = {};

function normalizeLearningTermsData(data) {
  termTooltipGlossary = {};
  manualStudyRuby = {};
  manualKingdomRuby = {};
  manualPersonRuby = {};

  const terms = data?.terms || {};
  Object.entries(terms).forEach(([term, value]) => {
    if (!value || typeof value !== "object") return;
    const reading = value.reading || value.ruby?.reading;
    const scopes = Array.isArray(value.scopes) ? value.scopes : [];
    if (reading && reading !== term) {
      if (scopes.includes("study")) manualStudyRuby[term] = reading;
      if (scopes.includes("kingdom")) manualKingdomRuby[term] = reading;
      if (scopes.includes("person")) manualPersonRuby[term] = reading;
    }
    if (value.tooltip && typeof value.tooltip === "object") {
      termTooltipGlossary[term] = value.tooltip;
    }
  });
}

async function loadLearningTermsData() {
  const fallback = window.WORLD_HISTORY_LEARNING_TERMS_DATA;
  if (fallback) {
    normalizeLearningTermsData(fallback);
    document.documentElement.dataset.learningTermsSource = "js";
    return;
  }
  const data = await loadJsonData("data/learning-terms.json");
  normalizeLearningTermsData(data);
  document.documentElement.dataset.learningTermsSource = "json";
}
let personGenreGroups = [];
let personInlineAliases = {};
const favorites = new Set(JSON.parse(localStorage.getItem("historyFavorites") || "[]"));
const peopleTools = document.querySelector(".people-tools");
let activeFilter = "all";
let activeQuiz = 0;
let activeEraDetail = null;
let timelineRegionRules = { nameOverrides: {}, modernRegionExact: {}, modernRegionIncludes: [] };
let eraRegionPriority = {};
let regionMergeByEra = {};
let subcategoryTimelineRegions = {};
let subcategoryTimelineRegionOverrides = {};
let subcategoryTimelineKeywords = {};
let subcategoriesWithoutTimeline = new Set();

function normalizeTimelineRegionData(data) {
  timelineRegionRules = {
    nameOverrides: data?.timelineRegionRules?.nameOverrides || {},
    modernRegionExact: data?.timelineRegionRules?.modernRegionExact || {},
    modernRegionIncludes: Array.isArray(data?.timelineRegionRules?.modernRegionIncludes) ? data.timelineRegionRules.modernRegionIncludes : []
  };
  eraRegionPriority = data?.eraRegionPriority || {};
  regionMergeByEra = data?.regionMergeByEra || {};
  subcategoryTimelineRegions = data?.subcategoryTimelineRegions || {};
  subcategoryTimelineRegionOverrides = data?.subcategoryTimelineRegionOverrides || {};
  subcategoryTimelineKeywords = data?.subcategoryTimelineKeywords || {};
  subcategoriesWithoutTimeline = new Set(Array.isArray(data?.subcategoriesWithoutTimeline) ? data.subcategoriesWithoutTimeline : []);
}

async function loadTimelineRegionData() {
  const fallback = window.WORLD_HISTORY_TIMELINE_REGION_DATA;
  if (fallback) {
    normalizeTimelineRegionData(fallback);
    document.documentElement.dataset.timelineRegionDataSource = "js";
    return;
  }
  const data = await loadJsonData("data/timeline-region-data.json");
  normalizeTimelineRegionData(data);
  document.documentElement.dataset.timelineRegionDataSource = "json";
}

function visualMetaFromObject(item) {
  if (!item || typeof item !== "object" || Array.isArray(item)) return null;
  const meta = {};
  for (const key of ["image", "imageFocus", "imageAlt"]) if (item[key]) meta[key] = item[key];
  const genres = Array.isArray(item.genre) ? item.genre : (item.genre ? [item.genre] : []);
  if (genres.length) meta.genres = genres;
  return Object.keys(meta).length ? meta : null;
}

function legacyPerson(person) {
  if (Array.isArray(person)) return person;
  const modal = person.modal || {};
  const parts = [person.name, person.kana, person.era, person.field || "", person.title, modal.profile || person.profile || "", person.icon || "👤"];
  const meta = visualMetaFromObject(person);
  if (meta) parts.push(meta);
  return parts;
}

function legacyAction(action) {
  if (Array.isArray(action)) return action;
  const modal = action.modal || {};
  const parts = [action.summary || "", modal.whatHappened || action.text || "", Array.isArray(action.tags) ? action.tags : []];
  const meta = visualMetaFromObject(action);
  if (meta) parts.push(meta);
  return parts;
}

function normalizePeopleData(data) {
  personGenreGroups = Array.isArray(data.genreGroups) && data.genreGroups.length ? data.genreGroups : [{ id: "other", label: "そのほか" }];
  personInlineAliases = data.inlineAliases && typeof data.inlineAliases === "object" ? data.inlineAliases : {};
  people = (data.people || []).map(legacyPerson);
  const sourceByName = data.peopleByName || {};
  personByName = new Map(Object.entries(sourceByName).map(([name, person]) => [name, legacyPerson(person)]));
  for (const person of people) if (person[0] && !personByName.has(person[0])) personByName.set(person[0], person);
}

function normalizeActionData(data) {
  actionCards = Object.fromEntries(Object.entries(data.actionCards || {}).map(([name, action]) => [name, legacyAction(action)]));
}

function normalizeModalData(data) {
  if (data.people || data.peopleByName) normalizePeopleData(data);
  if (data.actionCards) normalizeActionData(data);
  kingdomCards = data.kingdomCards || [];
  kingdomPeople = data.kingdomPeople || {};
}

async function loadJsonData(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url} could not be loaded: ${response.status}`);
  return response.json();
}

async function loadModalData() {
  const peopleData = window.WORLD_HISTORY_PEOPLE_DATA || (window.WORLD_HISTORY_MODAL_DATA?.people ? window.WORLD_HISTORY_MODAL_DATA : await loadJsonData("data/people-data.json"));
  normalizePeopleData(peopleData);
  const actionData = window.WORLD_HISTORY_ACTION_CARDS_DATA || (window.WORLD_HISTORY_MODAL_DATA?.actionCards ? window.WORLD_HISTORY_MODAL_DATA : await loadJsonData("data/action-cards.json"));
  normalizeActionData(actionData);
  const modalData = window.WORLD_HISTORY_MODAL_DATA || await loadJsonData("data/modal-data.json");
  normalizeModalData(modalData);
  document.documentElement.dataset.peopleDataSource = window.WORLD_HISTORY_PEOPLE_DATA ? "js" : "json";
  document.documentElement.dataset.actionDataSource = window.WORLD_HISTORY_ACTION_CARDS_DATA ? "js" : "json";
  document.documentElement.dataset.modalDataSource = window.WORLD_HISTORY_MODAL_DATA ? "js" : "json";
}

function normalizeHistoryContent(data) {
  const groups = data.groups || [];
  eraImages = data.eraImages || {};
  eras = groups.flatMap((group) => (group.eras || []).map((era) => ({
    id: era.id,
    name: era.name,
    years: era.years,
    westernYear: era.westernYear,
    icon: era.icon,
    colors: era.colors || group.colors,
    question: era.question,
    life: era.cards?.life?.summary || "",
    event: era.cards?.event?.summary || "",
    power: era.cards?.power?.summary || ""
  })));
  eraGroups = groups.map((group) => ({
    id: group.id,
    title: group.title,
    eras: (group.eras || []).map((era) => era.id),
    heading: group.heading,
    focus: group.focus,
    icon: group.icon,
    colors: group.colors || eras.find((era) => era.id === group.id)?.colors || ["#315f9d", "#3f7a5c"]
  }));
  powers = groups.flatMap((group) => (group.eras || []).flatMap((era) => (era.powers || []).map((power) => [
    power.name,
    power.eraName || era.name,
    power.where,
    power.people,
    power.reason,
    power.life
  ])));
  eraDetails = Object.fromEntries(groups.flatMap((group) => (group.eras || []).map((era) => [era.id, {
    life: era.cards?.life?.detail || "",
    event: era.cards?.event?.detail || "",
    power: era.cards?.power?.detail || ""
  }])));
  worldHistoryActionSubcategories = groups.flatMap((group) => (group.eras || []).flatMap((era) => (era.subcategories || []).map((subcategory) => [
    era.id,
    subcategory.region,
    subcategory.title,
    subcategory.summary,
    subcategory.text,
    subcategory.tags || []
  ])));
  subcategoryImages = {};
  subcategoryPersonNotes = {};
  const focusByName = new Map();
  groups.forEach((group) => {
    (group.eras || []).forEach((era) => {
      (era.subcategories || []).forEach((subcategory) => {
        if (subcategory.image) subcategoryImages[subcategory.title] = subcategory.image;
        if (subcategory.peopleNote) subcategoryPersonNotes[subcategory.title] = subcategory.peopleNote;
        if (["up", "down"].includes(subcategory.imageFocus)) focusByName.set(subcategory.title, subcategory.imageFocus);
      });
    });
  });
  subcategoryImageFocusByName = focusByName;
}

async function loadHistoryContent() {
  const fallback = window.WORLD_HISTORY_CONTENT_DATA || window.historyContentData;
  if (fallback) {
    normalizeHistoryContent(fallback);
    document.documentElement.dataset.historyContentSource = "js";
    return;
  }
  const response = await fetch("data/history-content.json");
  if (!response.ok) throw new Error(`history-content.json could not be loaded: ${response.status}`);
  normalizeHistoryContent(await response.json());
  document.documentElement.dataset.historyContentSource = "json";
}


function eraFor(name) {
  return eras.find((era) => String(name || "").includes(era.name)) || eras.find((era) => String(name || "").includes(era.name.replace("の時代", ""))) || eras[0];
}

function primaryEraIdForPerson(person) {
  return eraFor(person[2])?.id;
}

function personBelongsToEra(person, era) {
  return primaryEraIdForPerson(person) === era.id;
}

function getEraDetail(era, type) {
  const titles = { life: "くらしをもっと知る", event: "できごとをもっと知る", power: "大きな力をもっと知る" };
  return { title: titles[type], text: eraDetails[era.id]?.[type] || "" };
}
function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}

function escapeRegExp(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function hasRubyBlockingKatakana(text) {
  return /[\u30a0-\u30ff]/.test(text);
}

function shouldApplyRuby(text, reading) {
  return /[\u3400-\u9fff]/.test(text) && !hasRubyBlockingKatakana(text) && text !== reading;
}

function ruby(text, reading) {
  if (!shouldApplyRuby(text, reading)) return escapeHtml(text);
  return `<ruby>${escapeHtml(text)}<rt>${escapeHtml(reading)}</rt></ruby>`;
}

function hasModalLinkTarget(word) {
  if (personByName.has(word) || Boolean(actionCards[word])) return true;
  return kingdomCards.some((card) => kingdomInlineNames(card).includes(word));
}

function termTooltipHtml(word, innerHtml, options = {}) {
  if (options.disableTooltips) return innerHtml;
  const tooltip = termTooltipGlossary[word];
  if (!tooltip) return innerHtml;
  const title = tooltip.title || word;
  const body = tooltip.body || tooltip.summary || "";
  if (!body) return innerHtml;
  const tooltipUsage = options.tooltipUsage;
  if (tooltipUsage?.has(word)) return innerHtml;
  tooltipUsage?.add(word);
  return `<span class="term-tooltip" tabindex="0" data-term="${escapeHtml(word)}" data-title="${escapeHtml(title)}" data-body="${escapeHtml(body)}">${innerHtml}</span>`;
}

let termTooltipLayer = null;
let activeTermTooltip = null;

function termTooltipHost(trigger) {
  return trigger?.closest?.("dialog[open]") || document.body;
}

function ensureTermTooltipLayer(host = document.body) {
  if (!termTooltipLayer) {
    termTooltipLayer = document.createElement("div");
    termTooltipLayer.className = "term-tooltip-layer";
    termTooltipLayer.setAttribute("role", "tooltip");
  }
  if (termTooltipLayer.parentElement !== host) host.appendChild(termTooltipLayer);
  return termTooltipLayer;
}

function closestTermTooltip(target) {
  return target?.closest?.(".term-tooltip") || null;
}

function positionTermTooltip(trigger) {
  const layer = ensureTermTooltipLayer(termTooltipHost(trigger));
  const rect = trigger.getBoundingClientRect();
  const gap = 10;
  layer.classList.remove("above");
  layer.style.left = "0px";
  layer.style.top = "0px";
  const width = Math.min(320, Math.max(220, window.innerWidth - 32));
  layer.style.width = `${width}px`;
  const preview = layer.getBoundingClientRect();
  let left = rect.left + rect.width / 2 - width / 2;
  left = Math.max(16, Math.min(left, window.innerWidth - width - 16));
  let top = rect.bottom + gap;
  if (top + preview.height > window.innerHeight - 12) {
    top = rect.top - preview.height - gap;
    layer.classList.add("above");
  }
  layer.style.left = `${left}px`;
  layer.style.top = `${Math.max(12, top)}px`;
}

function showTermTooltip(trigger) {
  const title = trigger.dataset.title;
  const body = trigger.dataset.body;
  if (!title || !body) return;
  const layer = ensureTermTooltipLayer(termTooltipHost(trigger));
  layer.innerHTML = `<strong>${escapeHtml(title)}</strong><span>${escapeHtml(body)}</span>`;
  activeTermTooltip = trigger;
  positionTermTooltip(trigger);
  layer.classList.add("visible");
}

function hideTermTooltip() {
  if (!termTooltipLayer) return;
  termTooltipLayer.classList.remove("visible");
  activeTermTooltip = null;
}

function setupTermTooltips() {
  document.addEventListener("mouseover", (event) => {
    const trigger = closestTermTooltip(event.target);
    if (trigger) showTermTooltip(trigger);
  });
  document.addEventListener("mouseout", (event) => {
    const trigger = closestTermTooltip(event.target);
    if (trigger && !trigger.contains(event.relatedTarget)) hideTermTooltip();
  });
  document.addEventListener("focusin", (event) => {
    const trigger = closestTermTooltip(event.target);
    if (trigger) showTermTooltip(trigger);
  });
  document.addEventListener("focusout", (event) => {
    if (closestTermTooltip(event.target)) hideTermTooltip();
  });
  window.addEventListener("scroll", () => {
    if (activeTermTooltip) positionTermTooltip(activeTermTooltip);
  }, { passive: true });
  window.addEventListener("resize", () => {
    if (activeTermTooltip) positionTermTooltip(activeTermTooltip);
  });
}
function isKanjiCharacter(char) {
  return /[\u3400-\u9fff]/.test(char || "");
}

function isRubyWordBoundary(source, word, index) {
  if (word.length > 1) return true;
  const before = source[index - 1] || "";
  const after = source[index + word.length] || "";
  if (isKanjiCharacter(before) || isKanjiCharacter(after)) return false;
  if (source.slice(index, index + 3) === "調べ") return false;
  return true;
}

function applyRubyReadings(text, readingEntries, options = {}) {
  const source = String(text || "");
  const readings = new Map(readingEntries);
  const tooltipUsage = options.tooltipUsage || new Set();
  const tooltipOptions = { ...options, tooltipUsage };
  const tooltipWords = options.disableTooltips ? [] : Object.keys(termTooltipGlossary);
  const words = [...new Set([...readings.keys(), ...tooltipWords])]
    .filter((word) => source.includes(word))
    .filter((word) => readings.has(word) ? readings.get(word) !== word && shouldApplyRuby(word, readings.get(word)) : true)
    .sort((a, b) => b.length - a.length);
  if (!words.length) return escapeHtml(source);
  const pattern = new RegExp(words.map(escapeRegExp).join("|"), "g");
  let html = "";
  let cursor = 0;
  source.replace(pattern, (word, index) => {
    if (!isRubyWordBoundary(source, word, index)) return word;
    html += escapeHtml(source.slice(cursor, index));
    const innerHtml = readings.has(word) && shouldApplyRuby(word, readings.get(word)) ? ruby(word, readings.get(word)) : escapeHtml(word);
    html += termTooltipHtml(word, innerHtml, tooltipOptions);
    cursor = index + word.length;
    return word;
  });
  html += escapeHtml(source.slice(cursor));
  return html;
}

function studyRubyReadings() {
  return [...Object.entries(manualStudyRuby), ...Object.entries(manualPersonRuby)];
}

function applyStudyRuby(text, options = {}) {
  return applyRubyReadings(text, studyRubyReadings(), options);
}

function applyKingdomRuby(text) {
  return applyRubyReadings(text, [...Object.entries(manualStudyRuby), ...Object.entries(manualKingdomRuby)], { disableTooltips: true });
}

function personNameHtml(person) {
  const name = person?.[0] || "";
  const reading = manualPersonRuby[name] || person?.[1];
  if (reading && shouldApplyRuby(name, reading)) return ruby(name, reading);
  return applyStudyRuby(name, { disableTooltips: true });
}
function linkLabelHtml(name, item) {
  if (item?.type === "person" && item.target === name) {
    const person = personByName.get(name);
    if (person) return personNameHtml(person);
  }
  if (item?.type === "kingdom") return applyKingdomRuby(name);
  return applyStudyRuby(name);
}

function isKatakanaText(text) {
  return /^[\u30a0-\u30ffー・]+$/.test(text);
}

function isKatakanaChar(char) {
  return /[\u30a0-\u30ffー・]/.test(char || "");
}

function isCjkChar(char) {
  return /[\u3400-\u9fff]/.test(char || "");
}

const singleCharInlineFollowers = new Set(["の", "が", "は", "を", "に", "へ", "で", "と", "も", "や", "か", "ら", "等", "な", "、", "。", "，", "．", ",", ".", ")", "）", "」", "』", " "]);
const jinDynastyContextPattern = /金(?:王朝|軍|国|の王|に攻め|と戦|と争|を攻め|へ攻め)|(?:女真|南宋|北宋|宋|遼|岳飛|中国東北|華北|北方の)(?:と|の)?金/;

function isJinDynastyKingdomContext(source, index) {
  const start = Math.max(0, index - 12);
  const end = Math.min(source.length, index + 14);
  return jinDynastyContextPattern.test(source.slice(start, end));
}

function shouldSkipInlineLink(source, name, index, item) {
  const before = source[index - 1] || "";
  const after = source[index + name.length] || "";
  if (item?.type === "kingdom" && name === "金") return !isJinDynastyKingdomContext(source, index);
  if (item?.type === "action" && /^[\u4e00-\u9fff々]+$/.test(name)) {
    if (isCjkChar(before) || isCjkChar(after)) return true;
  }
  if (name.length === 1 && ["action", "kingdom"].includes(item?.type)) {
    if (isKatakanaChar(before) || /[A-Za-z0-9]/.test(before)) return true;
    if (after && !singleCharInlineFollowers.has(after)) return true;
  }
  if (!isKatakanaText(name)) return false;
  return isKatakanaChar(before) || isKatakanaChar(after);
}

function kingdomInlineNames(card) {
  const names = [card.name, card.displayName];
  const shortDisplayName = String(card.displayName || "").replace(/（[^）]+）|\([^)]*\)/g, "");
  if (shortDisplayName) names.push(shortDisplayName);
  return [...new Set(names.filter(Boolean))];
}

function enrichDetailLinks(text) {
  const source = String(text);
  const tooltipUsage = new Set();
  const peopleItems = [...personByName.keys()].filter((name) => source.includes(name)).map((name) => ({ name, target: name, type: "person" }));
  const aliasItems = Object.entries(personInlineAliases)
    .filter(([alias, target]) => source.includes(alias) && personByName.has(target))
    .map(([name, target]) => ({ name, target, type: "person" }));
  const actionItems = Object.keys(actionCards).filter((name) => source.includes(name)).map((name) => ({ name, target: name, type: "action" }));
  const kingdomItems = kingdomCards
    .flatMap((card) => kingdomInlineNames(card).map((name) => ({ name, target: card.id, type: "kingdom" })))
    .filter((item) => source.includes(item.name));
  const tooltipItems = Object.keys(termTooltipGlossary)
    .filter((name) => source.includes(name))
    .map((name) => ({ name, target: name, type: "term" }));
  const itemMap = new Map();
  [...peopleItems, ...kingdomItems, ...actionItems, ...aliasItems, ...tooltipItems].forEach((item) => {
    if (!itemMap.has(item.name)) itemMap.set(item.name, item);
  });
  const linkItems = [...itemMap.values()].sort((a, b) => b.name.length - a.name.length);
  if (!linkItems.length) return applyStudyRuby(source);
  const pattern = new RegExp(linkItems.map((item) => escapeRegExp(item.name)).join("|"), "g");
  const used = new Set();
  let cursor = 0;
  let html = "";
  for (const match of source.matchAll(pattern)) {
    const name = match[0];
    const item = itemMap.get(name);
    const target = item?.target || name;
    html += applyStudyRuby(source.slice(cursor, match.index), { tooltipUsage });
    if (item?.type === "term") {
      html += applyStudyRuby(name, { tooltipUsage });
    } else if (shouldSkipInlineLink(source, name, match.index, item)) {
      html += escapeHtml(name);
    } else if (used.has(target)) {
      html += linkLabelHtml(name, item);
    } else {
      used.add(target);
      const attrName = escapeHtml(target);
      const label = linkLabelHtml(name, item);
      if (item?.type === "kingdom") {
        html += `<button class="action-inline kingdom-inline" type="button" data-kingdom-id="${attrName}"><strong>${label}</strong></button>`;
      } else if (item?.type === "action") {
        html += `<button class="action-inline" type="button" data-action-name="${attrName}"><strong>${label}</strong></button>`;
      } else {
        html += `<button class="person-inline" type="button" data-person-name="${attrName}"><strong>${label}</strong></button>`;
      }
    }
    cursor = match.index + name.length;
  }
  html += applyStudyRuby(source.slice(cursor), { tooltipUsage });
  return html;
}

function renderEraLinks() {
  const contentLinks = [
    { href: "#top", label: "トップ", meta: "はじめに" },
    { href: "#intro", label: "学び方", meta: "くらし・国・人物" },
    { href: "#timeline", label: "年表", meta: "10の大きな区切り" },
    ...eraGroups.map((group) => ({ href: `#group-${group.id}`, label: group.title, meta: group.heading, level: "timeline" })),
    { href: "#people", label: "人物図鑑", meta: "時代を動かした人たち" },
    { href: "#quiz", label: "ミニクイズ", meta: "学びの確認" },
    { href: "#guide", label: "使い方のヒント", meta: "保護者・先生へ" }
  ];
  eraLinks.innerHTML = contentLinks.map((link) => {
    const groupId = link.level === "timeline" ? link.href.replace("#group-", "") : "";
    return `<a class="${link.level === "timeline" ? "is-timeline-child" : ""}" href="${link.href}" ${groupId ? `data-group-id="${escapeHtml(groupId)}"` : ""}><span>${link.label}</span><small>${link.meta}</small></a>`;
  }).join("");
}

function formatTimelineYear(year) {
  if (year < 0) return `紀元前${Math.abs(year)}年`;
  return `西暦${year}年`;
}

function clampNumber(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getTimelineTicks(bounds) {
  const [start, end] = bounds;
  const mid = Math.round((start + end) / 2);
  return [start, mid, end];
}

function getTimelineRegion(card) {
  const region = String(card.modernRegion || "");
  const nameOverride = timelineRegionRules.nameOverrides?.[card.name];
  if (nameOverride) return nameOverride;
  const exactRegion = timelineRegionRules.modernRegionExact?.[region];
  if (exactRegion) return exactRegion;
  for (const rule of timelineRegionRules.modernRegionIncludes || []) {
    const keywords = Array.isArray(rule.keywords) ? rule.keywords : [];
    if (keywords.some((keyword) => region.includes(keyword))) return rule.region;
  }
  return region;
}
function layoutTimelineCards(cards, eraStart, eraEnd) {
  const eraLength = eraEnd - eraStart;
  const laneEnds = [];
  const placeLanes = new Map();
  const items = cards
    .map((card) => {
      if (!hasKnownTimelineRange(card)) return null;
      const [rawStart, rawEnd] = card.timelineRange;
      const start = clampNumber(rawStart, eraStart, eraEnd);
      const end = clampNumber(rawEnd, eraStart, eraEnd);
      if (end <= eraStart || start >= eraEnd || end <= start) return null;
      const left = ((start - eraStart) / eraLength) * 100;
      const width = Math.max(((end - start) / eraLength) * 100, 3);
      return { card, rawStart, rawEnd, start, end, left, width };
    })
    .filter(Boolean)
    .sort((a, b) => a.start - b.start || b.end - a.end)
    .map((item) => {
      const placeKey = getTimelineRegion(item.card);
      const preferredLane = placeLanes.get(placeKey);
      if (preferredLane !== undefined && item.start >= laneEnds[preferredLane]) {
        laneEnds[preferredLane] = Math.max(laneEnds[preferredLane] ?? -Infinity, item.end);
        return { ...item, lane: preferredLane };
      }
      const lane = laneEnds.findIndex((end) => item.start >= end);
      const safeLane = lane === -1 ? laneEnds.length : lane;
      laneEnds[safeLane] = Math.max(laneEnds[safeLane] ?? -Infinity, item.end);
      if (preferredLane === undefined) placeLanes.set(placeKey, safeLane);
      return { ...item, lane: safeLane };
    });
  items.laneCount = Math.max(1, laneEnds.length);
  return items;
}

function renderRegionalPowerTimeline(era, eraKingdoms, options = {}) {
  const bounds = eraTimelineBounds[era.id];
  if (!bounds) return "";
  const timedKingdoms = eraKingdoms.filter(hasKnownTimelineRange);
  if (!timedKingdoms.length) return "";
  const priorityRegions = options.priorityRegions || eraRegionPriority[era.id] || [];
  const maxRegions = options.maxRegions || 5;
  const heading = options.heading || "地域タイムライン";
  const [eraStart, eraEnd] = bounds;
  const eraLength = eraEnd - eraStart;
  const mergeMap = regionMergeByEra[era.id] || {};
  const groups = [...timedKingdoms.reduce((map, card) => {
    const baseRegion = getTimelineRegion(card);
    const timelineRegion = mergeMap[baseRegion] || baseRegion;
    if (!map.has(timelineRegion)) map.set(timelineRegion, []);
    map.get(timelineRegion).push(card);
    return map;
  }, new Map()).entries()]
    .map(([region, cards]) => [region, layoutTimelineCards(cards, eraStart, eraEnd)])
    .filter(([, items]) => items.length)
    .sort((a, b) => {
      const rankOf = (region) => { const i = priorityRegions.indexOf(region); return i === -1 ? Infinity : i; };
      const ra = rankOf(a[0]);
      const rb = rankOf(b[0]);
      if (ra !== rb) return ra - rb;
      return b[1].length - a[1].length || a[0].localeCompare(b[0], "ja");
    })
    .slice(0, maxRegions);
  if (!groups.length) return "";
  const ticks = getTimelineTicks(bounds);
  return `
    <section class="regional-timeline" aria-label="${era.name}の注目する王国と勢力の地域タイムライン">
      <div class="regional-timeline-head">
        <h3>${heading}</h3>
        <span>${groups.length}地域</span>
      </div>
      <div class="regional-timeline-scale" aria-hidden="true">
        ${ticks.map((year) => `<span>${formatTimelineYear(year)}</span>`).join("")}
      </div>
      <div class="regional-timeline-rows">
        ${groups.map(([region, items]) => `
          <div class="regional-row">
            <div class="regional-label">${applyStudyRuby(region)}</div>
            <div class="regional-bars" style="--lanes:${items.laneCount || 1}">
              ${items.map(({ card, rawStart, rawEnd, left, width, lane }) => {
                const endLabel = card.ongoing ? "現在" : formatTimelineYear(rawEnd);
                const label = `${card.displayName} ${formatTimelineYear(rawStart)}-${endLabel}`;
                const opensActionCard = card.opensActionCard && actionCards[card.name];
                const clickHandler = opensActionCard ? `openAction('${card.name.replace(/'/g, "\\'")}')` : `openKingdom('${card.id}')`;
                const ariaTarget = opensActionCard ? "アクションカード" : "王国カード";
                return `<button class="regional-bar regional-bar-${getTimelineKind(card)}" type="button" onclick="${clickHandler}" data-lane="${lane}" data-kind="${getTimelineKind(card)}" style="left:${left.toFixed(2)}%;width:${Math.min(width, 100 - left).toFixed(2)}%;--lane:${lane}" title="${escapeHtml(label)}" aria-label="${escapeHtml(label)}の${ariaTarget}を開く"><span>${applyKingdomRuby(card.displayName)}</span></button>`;
              }).join("")}
            </div>
          </div>
        `).join("")}
      </div>
    </section>
  `;
}

function timelineRegionsForSubcategory(subcategory) {
  const region = Array.isArray(subcategory) ? subcategory[1] : subcategory;
  const name = Array.isArray(subcategory) ? subcategory[2] : "";
  return subcategoryTimelineRegionOverrides[name] || subcategoryTimelineRegions[region] || [region];
}

function subcategoryMatchesRegion(subcategoryRegion, timelineRegion) {
  return timelineRegionsForSubcategory(subcategoryRegion).some((region) => timelineRegion === region || timelineRegion.includes(region));
}

function relatedKingdomsForSubcategory(subcategory, era) {
  const [, , name] = subcategory;
  const targetRegions = new Set(timelineRegionsForSubcategory(subcategory));
  const keywords = subcategoryTimelineKeywords[name] || [];
  return kingdomCards.filter((card) => {
    if (!kingdomActiveInEra(card, era) && card.era !== era.name) return false;
    const timelineRegion = getTimelineRegion(card);
    if (!targetRegions.has(timelineRegion)) return false;
    if (!keywords.length) return true;
    const cardText = [card.name, card.displayName, card.region, card.modernRegion, card.type].join(" ");
    return keywords.some((keyword) => cardText.includes(keyword));
  });
}

function renderActionSubcategories(group, groupEras) {
  const era = groupEras[0];
  if (!era) return "";
  const subcategories = worldHistoryActionSubcategories.filter(([eraId]) => eraId === era.id);
  if (!subcategories.length) return "";
  const shownTimelineKeys = new Set();
  return `
    <section class="action-subcategory-section" aria-label="${group.title}の地域別子カテゴリー">
      <div class="subcategory-head">
        <p class="eyebrow">地域別のできごと</p>
        <h3>${applyStudyRuby(group.heading, { disableTooltips: true })}</h3>
        <p>${applyStudyRuby(`${group.title}で押さえたい地域ごとの変化です。各子カテゴリーの勢力タイムラインは、関係が深い地域だけを表示し、同じ地域構成のタイムラインは大カテゴリー内で1回だけ表示します。`, { disableTooltips: true })}</p>
      </div>
      <div class="subcategory-list">
        ${subcategories.map((subcategory) => {
          const [, region, name, summary, , tags] = subcategory;
          const bodyText = subcategoryBodyText(subcategory);
          const imagePath = subcategoryImages[name];
          const imageFocus = subcategoryImageFocusByName.get(name) || "center";
          const imageClass = `subcategory-image${imageFocus !== "center" ? ` subcategory-image-${imageFocus}` : ""}`;
          const imageHtml = imagePath
            ? `<img class="${imageClass}" src="${escapeHtml(imagePath)}" alt="${escapeHtml(name)}のイメージ画像" loading="lazy">`
            : "";
          const timelineRegions = timelineRegionsForSubcategory(subcategory);
          const timelineKey = timelineRegions.join("|");
          const relatedKingdoms = relatedKingdomsForSubcategory(subcategory, era);
          const timelineHtml = !subcategoriesWithoutTimeline.has(name) && !shownTimelineKeys.has(timelineKey) && relatedKingdoms.length
            ? renderRegionalPowerTimeline(era, relatedKingdoms, { priorityRegions: timelineRegions, maxRegions: timelineRegions.length })
            : "";
          if (timelineHtml) shownTimelineKeys.add(timelineKey);
          return `
            <article class="action-subcategory-card">
              <div class="subcategory-card-body">
                <header>
                  <span class="subcategory-region">${applyStudyRuby(region, { disableTooltips: true })}</span>
                  <h4><button class="action-inline" type="button" data-action-name="${escapeHtml(name)}"><strong>${applyStudyRuby(name, { disableTooltips: true })}</strong></button></h4>
                  <p>${applyStudyRuby(summary, { disableTooltips: true })}</p>
                </header>
                ${imageHtml}
                <p class="subcategory-body subcategory-description">${enrichDetailLinks(bodyText)}</p>
                <div class="tag-row">${tags.map((tag) => `<span class="tag">${applyStudyRuby(tag)}</span>`).join("")}</div>
              </div>
              ${timelineHtml}
            </article>
          `;
        }).join("")}
      </div>
    </section>
  `;
}

function kingdomActiveInEra(card, era) {
  const bounds = eraTimelineBounds[era.id];
  if (!bounds || !hasKnownTimelineRange(card)) return card.era === era.name;
  const [eraStart, eraEnd] = bounds;
  const [start, end] = card.timelineRange;
  return start < eraEnd && end > eraStart;
}

function renderEraCard(era) {
  const eraPowers = powers.filter((p) => p[1] === era.name || era.name.includes(p[1].replace("の時代", "")));
  const eraPeople = people.filter((p) => personBelongsToEra(p, era));
  const eraKingdoms = kingdomCards.filter((card) => card.era === era.name);
  const eraTimelineKingdoms = kingdomCards.filter((card) => kingdomActiveInEra(card, era));
  const eraImage = eraImages[era.id];
  const eraGroup = eraGroups.find((group) => group.eras.includes(era.id));
  return `
    <article class="era" id="era-${era.id}" data-era="${era.name}" data-icon="${era.icon}" data-western-year="${era.westernYear}" style="--era-a:${era.colors[0]};--era-b:${era.colors[1]};color:${era.colors[0]}">
      <div class="era-card">
        <header class="era-head"><p class="eyebrow">${era.years}</p><h2>${era.name}</h2><p>${applyStudyRuby(era.question)}</p></header>
        ${eraImage ? `<figure class="era-visual"><img src="${eraImage}" alt="${era.name}のくらしや社会を表すイラスト" loading="lazy"></figure>` : ""}
        <div class="era-body">
          <div class="fact-grid" data-era-id="${era.id}">
            ${["life", "event", "power"].map((type) => `<section class="fact-card fact-item" data-detail-type="${type}" data-era-id="${era.id}"><button class="detail-toggle disclosure-icon" type="button" data-detail-type="${type}" data-era-id="${era.id}" aria-expanded="false" aria-label="${type === "life" ? "くらし" : type === "event" ? "できごと" : "大きな力"}の詳細を開く"></button><h3>${type === "life" ? "くらし" : type === "event" ? "できごと" : "大きな力"}</h3><p>${enrichDetailLinks(era[type])}</p></section>`).join("")}
          </div>
          ${eraPowers.map((p) => `<div class="fact-card power-card"><h3>${applyStudyRuby(p[0])}</h3><p><strong>どこ:</strong> ${enrichDetailLinks(p[2])}　<strong>集まった人:</strong> ${enrichDetailLinks(p[3])}</p><p><strong>なぜ:</strong> ${enrichDetailLinks(p[4])}　<strong>くらし:</strong> ${enrichDetailLinks(p[5])}</p></div>`).join("")}
          ${renderRegionalPowerTimeline(era, eraTimelineKingdoms, { heading: "各地域勢力タイムラインまとめ" })}
          ${eraGroup ? renderActionSubcategories(eraGroup, [era]) : ""}
          <section class="era-kingdoms" aria-label="${era.name}の王国・勢力・その他">
            <div class="era-kingdoms-head">
              <h3>できた王国・勢力・その他</h3>
              <span>${eraKingdoms.length}件</span>
            </div>
            <div class="kingdom-list">
              ${eraKingdoms.map((card) => `<button class="kingdom-chip" type="button" onclick="openKingdom('${card.id}')" aria-label="${card.displayName}の王国カードを開く"><span aria-hidden="true">◆</span>${applyKingdomRuby(card.displayName)}</button>`).join("") || "<p>この時代の王国・勢力・その他カードを準備中です。</p>"}
            </div>
          </section>
          <details class="era-people"><summary><span>時代を動かした人たち</span><span>${eraPeople.length}人</span></summary><div class="mini-people">${eraPeople.map((p) => `<button class="mini-person-button" type="button" onclick="openPerson('${p[0]}')" aria-label="${p[0]}の人物カードを開く"><span class="mini-person-icon">${p[6]}</span><span>${ruby(p[0], p[1])}</span></button>`).join("") || "<p>人物図鑑で関連人物を見られます。</p>"}</div></details>
        </div>
      </div>
    </article>`;
}

function renderTimeline() {
  timeline.innerHTML = eraGroups.map((group) => {
    const groupEras = group.eras.map((id) => eras.find((era) => era.id === id)).filter(Boolean);
    const groupYear = groupEras[0]?.westernYear || "";
    return `<details class="era-group" id="group-${group.id}" data-era="${group.title}" data-western-year="${groupYear}" style="--group-a:${group.colors[0]};--group-b:${group.colors[1]}"><summary><span class="group-icon">${group.icon}</span><span class="group-copy"><span class="eyebrow">${applyStudyRuby(group.title)}</span><strong>${applyStudyRuby(group.heading)}</strong><span>${applyStudyRuby(group.focus)}</span></span><span class="group-action disclosure-icon" aria-hidden="true"></span></summary><div class="group-eras">${groupEras.map(renderEraCard).join("")}</div></details>`;
  }).join("");
  document.querySelectorAll(".era-group").forEach((group) => group.addEventListener("toggle", () => group.querySelector(".group-action")?.setAttribute("aria-hidden", "true")));
}

function closeEraDetail() {
  if (!activeEraDetail) return;
  const { item, panel } = activeEraDetail;
  const button = item.querySelector(".detail-toggle");
  item.classList.remove("open");
  panel.remove();
  button.setAttribute("aria-expanded", "false");
  button.setAttribute("aria-label", `${item.querySelector("h3")?.textContent || "詳細"}の詳細を開く`);
  activeEraDetail = null;
}

function motionShouldReduce() {
  return document.body.classList.contains("reduce-motion") || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function navigateToEraGroup(groupId) {
  const target = document.getElementById(`group-${groupId}`);
  if (!target) return;
  closeEraDetail();
  document.querySelectorAll(".era-group").forEach((group) => {
    group.open = false;
  });
  target.scrollIntoView({ behavior: motionShouldReduce() ? "auto" : "smooth", block: "start" });
  const openDelay = motionShouldReduce() ? 0 : 260;
  window.setTimeout(() => {
    target.open = true;
  }, openDelay);
}

function openEraDetail(button) {
  const era = eras.find((item) => item.id === button.dataset.eraId);
  const detail = era && getEraDetail(era, button.dataset.detailType);
  if (!era || !detail) return;
  const item = button.closest(".fact-item");
  if (activeEraDetail?.item === item) {
    closeEraDetail();
    return;
  }
  closeEraDetail();
  const panel = document.createElement("div");
  panel.className = "inline-detail";
  panel.setAttribute("aria-live", "polite");
  panel.innerHTML = `<div class="detail-panel-head"><div><p class="eyebrow">${era.name}</p><h3>${detail.title}</h3></div></div><p>${enrichDetailLinks(detail.text)}</p>`;
  item.parentElement.appendChild(panel);
  item.classList.add("open");
  button.setAttribute("aria-expanded", "true");
  button.setAttribute("aria-label", `${item.querySelector("h3")?.textContent || "詳細"}の詳細を閉じる`);
  activeEraDetail = { item, panel, startY: window.scrollY };
}

function getPersonGenres(person) {
  const meta = cardVisualMeta(person, 7) || {};
  const genreIds = Array.isArray(meta.genres) ? meta.genres : (meta.genres ? [meta.genres] : []);
  const matched = personGenreGroups.filter((group) => genreIds.includes(group.id));
  return matched.length ? matched : [personGenreGroups.find((group) => group.id === "other") || { id: "other", label: "そのほか" }];
}

function getPersonGenre(person) {
  return getPersonGenres(person)[0];
}

function personGenreLabels(person) {
  return getPersonGenres(person).map((genre) => genre.label).join("・");
}

function personMatches(person, query) {
  return `${person.join(" ")} ${personGenreLabels(person)}`.toLowerCase().includes(query.toLowerCase());
}

function renderPeopleFilters() {
  const filters = [{ id: "all", label: "すべて" }, { id: "favorite", label: "お気に入り" }, { id: "modern", label: "近現代" }, ...personGenreGroups.map((group) => ({ id: `genre:${group.id}`, label: group.label }))];
  peopleTools.innerHTML = filters.map((filter) => `<button class="chip ${activeFilter === filter.id ? "active" : ""}" data-filter="${filter.id}">${filter.label}</button>`).join("");
}

function renderPersonCard(person) {
  const era = eraFor(person[2]);
  const saved = favorites.has(person[0]);
  return `<article class="person-card" style="--person-color:${era.colors[0]}"><button class="favorite" type="button" aria-label="${person[0]}をお気に入り" onclick="toggleFavorite('${person[0]}', event)">${saved ? "★" : "☆"}</button><button type="button" onclick="openPerson('${person[0]}')"><div class="person-top"><div class="avatar">${person[6]}</div><div><h3>${personNameHtml(person)}</h3><small>${person[2]} / ${personGenreLabels(person)}</small></div></div><p><strong>${applyStudyRuby(person[4])}</strong></p><p>${applyStudyRuby(person[5])}</p></button></article>`;
}

function personSortKey(person) {
  return (person[1] || person[0]).replace(/[・＝\s]/g, "");
}

function escapedJsString(value) {
  return String(value).replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

function renderPersonNameButton(person) {
  const era = eraFor(person[2]);
  const saved = favorites.has(person[0]);
  const name = escapedJsString(person[0]);
  return `
    <div class="person-name-item" style="--person-color:${era.colors[0]}">
      <button class="person-name-main" type="button" onclick="openPerson('${name}')" aria-label="${person[0]}の人物カードを開く">
        <span class="person-name-icon">${person[6]}</span>
        <span class="person-name-text"><strong>${personNameHtml(person)}</strong><small>${person[2]} / ${personGenreLabels(person)}</small></span>
      </button>
      <button class="person-name-favorite" type="button" aria-label="${person[0]}をお気に入り" onclick="toggleFavorite('${name}', event)">${saved ? "★" : "☆"}</button>
    </div>
  `;
}

function renderPeople() {
  const query = peopleSearch.value.trim();
  const filtered = people.filter((person) => {
    if (query && !personMatches(person, query)) return false;
    if (activeFilter === "favorite") return favorites.has(person[0]);
    if (activeFilter === "modern") return /世界が深く結びついた時代|二つの世界大戦の時代|今につながる時代/.test(person[2]);
    if (activeFilter.startsWith("genre:")) return getPersonGenres(person).some((genre) => genre.id === activeFilter.replace("genre:", ""));
    return true;
  }).sort((a, b) => personSortKey(a).localeCompare(personSortKey(b), "ja") || a[0].localeCompare(b[0], "ja"));
  if (!filtered.length) {
    peopleGrid.innerHTML = `<p>見つかりませんでした。</p>`;
    return;
  }
  peopleGrid.innerHTML = `<div class="person-name-list" aria-label="人物名一覧">${filtered.map(renderPersonNameButton).join("")}</div>`;
}

function showPersonDialog() {
  if (personDialog.open) return;
  personDialog.showModal();
}

function compactJoin(parts) {
  return parts.filter(Boolean).map((part) => String(part).trim()).filter(Boolean).join(" ");
}

function modalLinkedText(text) {
  return enrichDetailLinks(String(text || ""));
}

function cardVisualMeta(card, index) {
  if (!Array.isArray(card)) return visualMetaFromObject(card);
  const meta = card[index];
  return meta && typeof meta === "object" && !Array.isArray(meta) ? meta : null;
}

function directCardVisual(card, index, title) {
  const meta = cardVisualMeta(card, index);
  if (!meta?.image) return null;
  return {
    image: meta.image,
    focus: meta.imageFocus || "center",
    alt: meta.imageAlt || `${title}のイメージ画像`
  };
}
function findVisualForPerson(person) {
  const [name, , eraName] = person;
  const direct = directCardVisual(person, 7, name);
  if (direct) return direct;
  const related = worldHistoryActionSubcategories.find((subcategory) => {
    const [, , title] = subcategory;
    const image = subcategoryImages[title];
    return image && subcategoryBodyText(subcategory).includes(name);
  });
  if (related) {
    const [, , title] = related;
    return { image: subcategoryImages[title], focus: "center", alt: `${name}に関係する${title}のイメージ画像` };
  }
  const era = eraFor(eraName);
  const image = eraImages[era?.id];
  return image ? { image, focus: "center", alt: `${eraName}のイメージ画像` } : null;
}

function findVisualForAction(name, tags = []) {
  const direct = directCardVisual(actionCards[name], 3, name);
  if (direct) return direct;
  if (subcategoryImages[name]) return { image: subcategoryImages[name], focus: "center", alt: `${name}のイメージ画像` };
  const related = worldHistoryActionSubcategories.find((subcategory) => {
    const [, , title, summary, text, subcategoryTags] = subcategory;
    const image = subcategoryImages[title];
    return image && (title === name || summary.includes(name) || text.includes(name) || tags.some((tag) => (subcategoryTags || []).includes(tag)));
  });
  if (related) {
    const [, , title] = related;
    return { image: subcategoryImages[title], focus: "center", alt: `${title}のイメージ画像` };
  }
  const eraTag = tags.find((tag) => /時代$/.test(tag));
  const era = eraTag ? eraFor(eraTag) : null;
  const image = era && eraImages[era.id];
  return image ? { image, focus: "center", alt: `${eraTag}のイメージ画像` } : null;
}

function modalVisualHtml(visual, icon, title) {
  if (visual?.image) {
    return `<figure class="modal-visual modal-visual-image focus-${escapeHtml(visual.focus || "center")}"><img src="${escapeHtml(visual.image)}" alt="${escapeHtml(visual.alt || title)}" loading="lazy"></figure>`;
  }
  return `<div class="modal-visual modal-visual-fallback" aria-hidden="true"><span>${escapeHtml(icon || "💡")}</span></div>`;
}

function modalSectionIconHtml(icon) {
  const paths = {
    "人": `<path d="M12 12.2a3.7 3.7 0 1 0 0-7.4 3.7 3.7 0 0 0 0 7.4Z"/><path d="M5.2 20a6.8 6.8 0 0 1 13.6 0Z"/>`,
    "知": `<path d="M12 3.4a7 7 0 0 0-4 12.8V20h8v-3.8a7 7 0 0 0-4-12.8Z"/><path d="M9 22h6"/>`,
    "動": `<path d="M6 4v17"/><path d="M7 5h10l-2 4 2 4H7Z"/>`,
    "光": `<path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1L12 16.9 6.6 19.8l1-6.1-4.4-4.3 6.1-.9Z"/>`
  };
  const path = paths[icon] || `<path d="M12 4v16"/><path d="M4 12h16"/>`;
  return `<span class="modal-section-icon" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false">${path}</svg></span>`;
}

function modalSectionHtml(icon, title, text) {
  return `
    <section class="modal-info-section">
      <h3>${modalSectionIconHtml(icon)}<span>${escapeHtml(title)}</span></h3>
      <p>${modalLinkedText(text)}</p>
    </section>
  `;
}

function renderLearningModal({ type, icon, eyebrow, titleHtml, subtitle, visual, sections, tags, sideActions = "" }) {
  personDialog.classList.remove("kingdom-dialog");
  personDetail.className = "learning-modal-detail";
  personDetail.innerHTML = `
    <article class="learning-modal-card modal-type-${escapeHtml(type)}">
      <header class="modal-hero-row">
        <div class="modal-title-block">
          <div class="modal-icon-stack">
            <div class="modal-icon-tile" aria-hidden="true">${escapeHtml(icon || "💡")}</div>
            ${sideActions}
          </div>
          <p class="modal-eyebrow">${eyebrow}</p>
          <h2>${titleHtml}</h2>
          <p class="modal-subtitle">${subtitle}</p>
          <div class="tag-row modal-tag-row">
            ${tags.map((tag) => `<span class="tag">${applyStudyRuby(tag)}</span>`).join("")}
          </div>
        </div>
        ${modalVisualHtml(visual, icon, subtitle)}
      </header>
      <div class="modal-section-grid">
        ${sections.filter((section) => compactJoin([section.text])).map((section) => modalSectionHtml(section.icon, section.title, section.text)).join("")}
      </div>
    </article>
  `;
}

function personModalSections(person) {
  const [, , , , title, bodyText] = person;
  return [
    {
      icon: "人",
      title: "どんな人物？",
      text: bodyText
    },
    {
      icon: "動",
      title: "何をした？",
      text: title
    },
    {
      icon: "光",
      title: "なぜ重要？",
      text: ""
    }
  ];
}

function actionModalSections(name, action) {
  const [summary, text] = action;
  return [
    {
      icon: "知",
      title: "どんな内容？",
      text: summary
    },
    {
      icon: "動",
      title: "何が起きた？",
      text
    },
    {
      icon: "光",
      title: "なぜ重要？",
      text: ""
    }
  ];
}

function openKingdom(id) {
  const card = kingdomCards.find((item) => item.id === id);
  if (!card) return;
  cleanupKingdomGlobe();
  const isRivalry = getTimelineKind(card) === "rivalry";
  personDialog.classList.add("kingdom-dialog");
  personDetail.className = "kingdom-detail";
  personDetail.innerHTML = `
    <div class="detail-avatar">${isRivalry ? "⚔" : "◆"}</div>
    <p class="eyebrow">${isRivalry ? "アクションカード" : "王国カード"}</p>
    <h2>${applyKingdomRuby(card.displayName)}</h2>
    <p><strong>${applyStudyRuby(card.summary)}</strong></p>
    <p>${applyStudyRuby(card.text)}</p>
    <figure class="kingdom-map" aria-label="${card.displayName}のおよその位置">
      <canvas id="kingdomGlobe" width="960" height="620" aria-label="${card.displayName}の位置を正面にした3D世界地図"></canvas>
      <figcaption class="globe-caption">${isRivalry ? "中心地域" : "首都・王がいた場所"}: 緯度 ${card.lat.toFixed(1)} / 経度 ${card.lon.toFixed(1)}</figcaption>
      <p class="globe-fallback" hidden>3D地図を表示できませんでした。</p>
    </figure>
    ${(() => {
      const members = getKingdomPeople(card);
      if (!members.length) return "";
      return `<section class="kingdom-people" aria-label="${card.name}に関わった人物">
      <h3>この勢力に関わった人物</h3>
      <div class="mini-people">
        ${members.map((name) => {
          const person = personByName.get(name);
          return `<button class="mini-person-button" type="button" onclick="openPerson('${name.replace(/'/g, "\\'")}')" aria-label="${name}の人物カードを開く"><span class="mini-person-icon">${person[6]}</span><span>${personNameHtml(person)}</span></button>`;
        }).join("")}
      </div>
    </section>`;
    })()}
    <div class="tag-row">
      ${card.tags.map((tag) => `<span class="tag">${applyStudyRuby(tag)}</span>`).join("")}
    </div>
  `;
  showPersonDialog();
  requestAnimationFrame(() => renderKingdomGlobe(card));
}

function openPerson(name) {
  const person = personByName.get(name) || people.find((p) => p[0] === name);
  if (!person) return;
  cleanupKingdomGlobe();
  const saved = favorites.has(person[0]);
  const escapedName = escapeHtml(person[0]);
  renderLearningModal({
    type: "person",
    icon: person[6],
    eyebrow: applyStudyRuby(person[2]),
    titleHtml: personNameHtml(person),
    subtitle: applyStudyRuby(person[4]),
    visual: findVisualForPerson(person),
    sections: personModalSections(person),
    tags: [person[3], person[2], ...getPersonGenres(person).map((genre) => genre.label)],
    sideActions: `<button class="modal-favorite-button ${saved ? "is-saved" : ""}" type="button" data-modal-favorite data-person-name="${escapedName}" aria-label="${saved ? "お気に入りから外す" : "お気に入りに追加"}" aria-pressed="${saved ? "true" : "false"}"><span aria-hidden="true">${saved ? "★" : "☆"}</span></button>`
  });
  showPersonDialog();
}

function openAction(name) {
  const action = actionCards[name];
  if (!action) return;
  cleanupKingdomGlobe();
  const [summary, , tags] = action;
  renderLearningModal({
    type: "action",
    icon: "💡",
    eyebrow: "アクションカード",
    titleHtml: name === "元" ? ruby("元", "げん") : applyStudyRuby(name),
    subtitle: applyStudyRuby(summary),
    visual: findVisualForAction(name, tags),
    sections: actionModalSections(name, action),
    tags: [...tags, "もっと知る"]
  });
  showPersonDialog();
}

function toggleFavorite(name, event) {
  event?.stopPropagation();
  favorites.has(name) ? favorites.delete(name) : favorites.add(name);
  localStorage.setItem("historyFavorites", JSON.stringify([...favorites]));
  renderPeople();
  updateModalFavoriteButton(name);
}

function updateModalFavoriteButton(name) {
  const button = [...personDialog.querySelectorAll("[data-modal-favorite]")].find((item) => item.dataset.personName === name);
  if (!button) return;
  const saved = favorites.has(name);
  button.classList.toggle("is-saved", saved);
  button.setAttribute("aria-pressed", saved ? "true" : "false");
  button.setAttribute("aria-label", saved ? "お気に入りから外す" : "お気に入りに追加");
  const icon = button.querySelector("span[aria-hidden='true']");
  if (icon) icon.textContent = saved ? "★" : "☆";
}

function renderQuiz() {
  const quiz = quizzes[activeQuiz];
  quizCard.innerHTML = `<h3>${quiz.q}</h3><div class="quiz-options">${quiz.options.map((option) => `<button type="button" onclick="answerQuiz('${option}')">${option}</button>`).join("")}</div><div class="result" id="quizResult" aria-live="polite"></div>`;
}

function answerQuiz(option) {
  const quiz = quizzes[activeQuiz];
  quizResult.textContent = option === quiz.a ? "正解です。流れが見えてきました。" : "だいじょうぶ。もう一度、その時代を見てみよう。";
  setTimeout(() => {
    activeQuiz = (activeQuiz + 1) % quizzes.length;
    renderQuiz();
  }, 1300);
}

function observeEra() {
  const eraObserver = new IntersectionObserver((entries) => {
    const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (visible) currentEra.textContent = visible.target.dataset.era;
  }, { threshold: [0.25, 0.45, 0.65] });
  document.querySelectorAll(".era-group, .era").forEach((era) => eraObserver.observe(era));
}

menuButton.addEventListener("click", () => eraDrawer.classList.add("open"));
closeDrawer.addEventListener("click", () => eraDrawer.classList.remove("open"));
eraLinks.addEventListener("click", (event) => {
  const link = event.target.closest("a");
  if (!link) return;
  if (link.dataset.groupId) {
    event.preventDefault();
    navigateToEraGroup(link.dataset.groupId);
  }
  eraDrawer.classList.remove("open");
});
closePerson.addEventListener("click", () => {
  cleanupKingdomGlobe();
  personDialog.close();
});
personDialog.addEventListener("close", cleanupKingdomGlobe);
document.querySelector(".people-accordion")?.addEventListener("toggle", (event) => event.currentTarget.querySelector(".group-action")?.setAttribute("aria-hidden", "true"));
function handleInlineCardLink(event) {
  const personButton = event.target.closest(".person-inline");
  if (personButton) {
    event.preventDefault();
    event.stopPropagation();
    openPerson(personButton.dataset.personName);
    return true;
  }
  const kingdomButton = event.target.closest(".kingdom-inline");
  if (kingdomButton) {
    event.preventDefault();
    event.stopPropagation();
    openKingdom(kingdomButton.dataset.kingdomId);
    return true;
  }
  const actionButton = event.target.closest(".action-inline");
  if (actionButton) {
    event.preventDefault();
    event.stopPropagation();
    openAction(actionButton.dataset.actionName);
    return true;
  }
  return false;
}
timeline.addEventListener("click", (event) => {
  if (handleInlineCardLink(event)) return;
  const button = event.target.closest(".detail-toggle");
  if (button) openEraDetail(button);
});
personDialog.addEventListener("click", (event) => {
  const favoriteButton = event.target.closest("[data-modal-favorite]");
  if (favoriteButton) {
    toggleFavorite(favoriteButton.dataset.personName, event);
    return;
  }
  handleInlineCardLink(event);
});
window.addEventListener("scroll", () => {
  if (activeEraDetail && Math.abs(window.scrollY - activeEraDetail.startY) >= 500) closeEraDetail();
}, { passive: true });
rubyToggle.addEventListener("click", () => {
  document.body.classList.toggle("no-ruby");
  rubyToggle.classList.toggle("active");
});
motionToggle.addEventListener("click", () => {
  document.body.classList.toggle("reduce-motion");
  motionToggle.classList.toggle("active");
});
soundToggle.addEventListener("click", () => {
  const pressed = soundToggle.getAttribute("aria-pressed") === "true";
  soundToggle.setAttribute("aria-pressed", String(!pressed));
});
peopleSearch.addEventListener("input", renderPeople);
peopleTools.addEventListener("click", (event) => {
  const button = event.target.closest("[data-filter]");
  if (!button) return;
  activeFilter = button.dataset.filter;
  renderPeopleFilters();
  renderPeople();
});

async function initApp() {
  try {
    await loadHistoryContent();
    await loadModalData();
    await loadLearningTermsData();
    await loadTimelineRegionData();
  } catch (error) {
    console.error(error);
    timeline.innerHTML = '<p class="section-band">データを読み込めませんでした。ローカルサーバーから開き直してください。</p>';
    return;
  }
  renderEraLinks();
  renderTimeline();
  setupTermTooltips();
  renderPeopleFilters();
  renderPeople();
  renderQuiz();
  observeEra();
}

initApp();


