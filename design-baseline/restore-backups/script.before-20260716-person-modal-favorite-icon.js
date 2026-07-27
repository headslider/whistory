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

const rubyGlossary = {
  "仰韶文化": "ぎょうしょうぶんか", "龍山文化": "りゅうざんぶんか", "河姆渡文化": "かぼとぶんか", "良渚文化": "りょうしょぶんか", "紅山文化": "こうさんぶんか", "三星堆文化": "さんせいたいぶんか", "黄河流域": "こうがりゅういき", "長江流域": "ちょうこうりゅういき",
  "夏王朝": "かおうちょう", "殷王朝": "いんおうちょう", "周王朝": "しゅうおうちょう", "春秋時代": "しゅんじゅうじだい", "戦国時代": "せんごくじだい", "秦と漢の中国統一": "しんとかんのちゅうごくとういつ", "前漢": "ぜんかん", "後漢": "ごかん", "三国時代": "さんごくじだい", "晋": "しん", "東晋": "とうしん", "中国南北朝時代": "ちゅうごくなんぼくちょうじだい", "五胡十六国": "ごこじゅうろっこく", "五胡十六国時代": "ごこじゅうろっこくじだい", "五代十国時代": "ごだいじっこくじだい", "北魏": "ほくぎ", "南朝": "なんちょう", "隋": "ずい", "唐": "とう", "宋": "そう", "元": "げん", "明": "みん", "清": "しん", "金": "きん", "遼": "りょう", "渤海": "ぼっかい", "扶南": "ふなん", "新羅": "しらぎ", "高句麗": "こうくり", "百済": "くだら", "朝鮮三国時代": "ちょうせんさんごくじだい", "大韓帝国": "だいかんていこく", "中華民国初期": "ちゅうかみんこくしょき", "中華人民共和国": "ちゅうかじんみんきょうわこく", "中国国民政府": "ちゅうごくこくみんせいふ", "満州国": "まんしゅうこく", "阮朝": "げんちょう", "夏": "か", "殷": "いん", "周": "しゅう", "秦": "しん", "漢": "かん", "楚": "そ", "魏": "ぎ",
  "農業": "のうぎょう", "牧畜": "ぼくちく", "農耕": "のうこう", "雑穀": "ざっこく", "文明": "ぶんめい", "文化": "ぶんか", "都市": "とし", "文字": "もじ", "法律": "ほうりつ", "憲法": "けんぽう", "議会": "ぎかい", "王朝": "おうちょう", "王国": "おうこく", "帝国": "ていこく", "共和国": "きょうわこく", "合衆国": "がっしゅうこく", "連邦": "れんぽう", "連合": "れんごう", "同盟": "どうめい", "諸王国": "しょおうこく", "諸都市": "しょとし", "諸侯": "しょこう", "民族": "みんぞく", "多民族": "たみんぞく", "勢力": "せいりょく", "抵抗勢力": "ていこうせいりょく", "列強": "れっきょう", "統合": "とうごう", "条約": "じょうやく", "機構": "きこう", "会議": "かいぎ", "政府": "せいふ", "幕府": "ばくふ", "江戸幕府": "えどばくふ", "国家": "こっか", "公国": "こうこく", "帝政": "ていせい", "共和政": "きょうわせい", "第一共和政": "だいいちきょうわせい", "第二共和政": "だいにきょうわせい", "第三共和政": "だいさんきょうわせい", "初期": "しょき", "後期": "こうき", "近代": "きんだい", "近代化": "きんだいか", "末期": "まっき", "冷戦期": "れいせんき", "拡張期": "かくちょうき", "戦時期": "せんじき", "普及": "ふきゅう", "成立": "せいりつ", "誕生": "たんじょう", "広がり": "ひろがり", "拡大": "かくだい", "廃止": "はいし",
  "交易": "こうえき", "宗教": "しゅうきょう", "儒教": "じゅきょう", "仏教": "ぶっきょう", "キリスト教": "きりすときょう", "イスラム教": "いすらむきょう", "公認": "こうにん", "国教化": "こっきょうか", "商業": "しょうぎょう", "学問": "がくもん", "長安": "ちょうあん", "法": "ほう", "律令": "りつりょう", "制度": "せいど", "計画都市": "けいかくとし",
  "植民地": "しょくみんち", "植民地支配": "しょくみんちしはい", "先住民": "せんじゅうみん", "奴隷貿易": "どれいぼうえき", "奴隷制": "どれいせい", "奴隷制廃止運動": "どれいせいはいしうんどう", "大西洋奴隷貿易": "たいせいようどれいぼうえき", "迫害": "はくがい", "独裁": "どくさい", "戦争": "せんそう", "大戦": "たいせん", "第一次世界大戦": "だいいちじせかいたいせん", "第二次世界大戦": "だいにじせかいたいせん", "枢軸国": "すうじくこく", "連合国": "れんごうこく", "中央同盟国": "ちゅうおうどうめいこく", "戦間期": "せんかんき", "被害": "ひがい", "競合": "きょうごう", "対立": "たいりつ", "拮抗": "きっこう", "均衡": "きんこう",
  "革命": "かくめい", "市民革命": "しみんかくめい", "産業革命": "さんぎょうかくめい", "工業化": "こうぎょうか", "帝国主義": "ていこくしゅぎ", "大航海時代": "だいこうかいじだい", "世界一周": "せかいいっしゅう", "航路開拓": "こうろかいたく", "征服": "せいふく", "香辛料": "こうしんりょう", "銀": "ぎん", "鉄道": "てつどう", "汽船": "きせん", "電信": "でんしん", "国際連合": "こくさいれんごう", "国際連盟": "こくさいれんめい", "国際社会主義運動": "こくさいしゃかいしゅぎうんどう", "非同盟運動": "ひどうめいうんどう", "人権": "じんけん", "公民権運動": "こうみんけんうんどう", "参政権": "さんせいけん", "女性参政権運動": "じょせいさんせいけんうんどう", "労働運動": "ろうどううんどう", "反植民地運動": "はんしょくみんちうんどう", "反アパルトヘイト運動": "はんあぱるとへいとうんどう", "平和運動": "へいわうんどう", "環境運動": "かんきょううんどう", "気候変動対策運動": "きこうへんどうたいさくうんどう", "環境": "かんきょう", "技術": "ぎじゅつ", "感染症": "かんせんしょう", "世界恐慌": "せかいきょうこう", "地球規模": "ちきゅうきぼ", "課題": "かだい",
  "古王国": "こおうこく", "中王国": "ちゅうおうこく", "新王国": "しんおうこく", "新バビロニア王国": "しんばびろにあおうこく", "正統カリフ時代": "せいとうかりふじだい", "後ウマイヤ朝": "こううまいやちょう", "東ローマ帝国": "ひがしろーまていこく", "西ゴート王国": "にしごーとおうこく", "大英帝国": "だいえいていこく", "大日本帝国戦時期": "だいにほんていこくせんじき", "明治日本": "めいじにほん", "奈良時代": "ならじだい", "自由フランス": "じゆうふらんす", "大コロンビア": "だいころんびあ", "十六大国": "じゅうろくだいこく", "大陸": "たいりく", "北米": "ほくべい", "南北": "なんぼく", "朝鮮": "ちょうせん", "太平洋": "たいへいよう", "東アジア": "ひがしあじあ", "西アジア": "にしあじあ", "南アジア": "みなみあじあ", "中央アジア": "ちゅうおうあじあ", "東南アジア": "とうなんあじあ", "地中海": "ちちゅうかい", "東": "ひがし", "西": "にし", "南": "みなみ", "北": "きた", "朝": "ちょう", "国": "こく", "村": "むら", "時代": "じだい", "集落": "しゅうらく", "文化圏": "ぶんかけん", "圏": "けん", "最初": "さいしょ", "古代": "こだい", "大国": "たいこく", "世界": "せかい", "高原": "こうげん", "川": "かわ", "海上": "かいじょう", "海洋": "かいよう", "港市": "こうし", "工場": "こうじょう", "再編": "さいへん", "改革": "かいかく", "抵抗": "ていこう", "労働": "ろうどう", "市民": "しみん", "市民政治": "しみんせいじ", "社会": "しゃかい", "運動": "うんどう", "二つ": "ふたつ", "国際協力": "こくさいきょうりょく", "協力": "きょうりょく", "独立": "どくりつ", "国際機関": "こくさいきかん", "機関": "きかん", "現代": "げんだい", "共同体": "きょうどうたい", "中国": "ちゅうごく", "思想": "しそう", "統一": "とういつ", "制度改革": "せいどかいかく", "蜀": "しょく", "呉": "ご", "地域": "ちいき", "並立": "へいりつ", "文化交流": "ぶんかこうりゅう", "交流": "こうりゅう", "半島": "はんとう", "民族移動": "みんぞくいどう", "移動": "いどう", "分裂": "ぶんれつ", "日本": "にほん", "大名": "だいみょう", "三十年戦争": "さんじゅうねんせんそう", "三十年": "さんじゅうねん", "宗教改革": "しゅうきょうかいかく", "外交": "がいこう", "分割": "ぶんかつ", "進出期": "しんしゅつき", "民主主義": "みんしゅしゅぎ", "検索": "けんさく", "情報": "じょうほう", "広告": "こうこく", "知識": "ちしき", "正統": "せいとう", "反": "はん", "陣営": "じんえい", "中央": "ちゅうおう", "系": "けい", "第": "だい", "大西洋": "たいせいよう", "西洋": "せいよう", "出会い": "であい", "会社": "かいしゃ", "政権": "せいけん", "国民": "こくみん", "民": "みん", "自由": "じゆう", "今": "いま", "新": "しん", "三": "さん", "動画": "どうが", "発信": "はっしん", "速報": "そくほう", "通話": "つうわ", "写真": "しゃしん", "決済": "けっさい", "王": "おう", "政治": "せいじ", "記録": "きろく", "教": "きょう", "道": "みち", "航海": "こうかい", "支配": "しはい", "工業": "こうぎょう", "権利": "けんり", "世紀": "せいき", "国際": "こくさい", "関係": "かんけい", "平和": "へいわ", "差別": "さべつ", "戦後": "せんご", "核": "かく", "平等": "びょうどう", "未来": "みらい", "米": "こめ", "保護": "ほご", "伝来": "でんらい", "船隊": "せんたい", "商人": "しょうにん", "成長": "せいちょう", "港": "みなと", "海": "うみ", "中南米": "ちゅうなんべい", "交通": "こうつう", "通信": "つうしん", "経済": "けいざい", "求める": "もとめる", "動き": "うごき", "分かれ道": "わかれみち", "東北部": "とうほくぶ", "北部": "ほくぶ", "南部": "なんぶ", "東部": "とうぶ", "西部": "せいぶ", "南北朝": "なんぼくちょう", "東京": "とうきょう"
};
const manualStudyRubyTerms = [
  "仰韶文化", "龍山文化", "河姆渡文化", "良渚文化", "紅山文化", "三星堆文化", "黄河流域", "長江流域",
  "殷王朝", "春秋時代", "戦国時代", "秦と漢の中国統一", "前漢", "後漢", "東晋", "中国南北朝時代", "五胡十六国", "五胡十六国時代", "五代十国時代", "北魏", "渤海", "扶南", "新羅", "高句麗", "百済", "阮朝",
  "雑穀", "牧畜", "諸侯", "抵抗勢力", "列強", "進出期", "帝政", "共和政", "儒教", "仏教", "律令",
  "植民地支配", "先住民", "奴隷貿易", "奴隷制", "奴隷制廃止運動", "大西洋奴隷貿易", "迫害", "独裁", "枢軸国", "中央同盟国", "戦間期", "拮抗", "均衡",
  "帝国主義", "大航海時代", "航路開拓", "征服", "香辛料", "国際連盟", "国際社会主義運動", "非同盟運動", "公民権運動", "参政権", "女性参政権運動", "反植民地運動", "反アパルトヘイト運動", "気候変動対策運動", "世界恐慌", "地球規模",
  "古王国", "中王国", "新王国", "新バビロニア王国", "正統カリフ時代", "後ウマイヤ朝", "東ローマ帝国", "西ゴート王国", "大英帝国", "大日本帝国戦時期", "十六大国", "朝鮮三国時代", "地中海", "文化圏", "港市", "再編", "国際機関", "共同体", "中華人民共和国", "蜀", "呉", "並立", "民族移動", "南北朝", "三十年戦争", "宗教改革"
];

const manualStudyRuby = Object.fromEntries(
  manualStudyRubyTerms
    .map((word) => [word, rubyGlossary[word]])
    .filter(([, reading]) => reading)
);
const manualKingdomRubyTerms = [
  "夏王朝", "周王朝", "三国時代", "奈良時代", "南朝", "大韓帝国", "中華民国初期", "中国国民政府", "満州国", "明治日本", "江戸幕府",
  "夏", "殷", "周", "秦", "漢", "楚", "魏", "晋", "隋", "唐", "宋", "元", "明", "清", "金", "遼"
];

const manualKingdomRuby = Object.fromEntries(
  manualKingdomRubyTerms
    .map((word) => [word, rubyGlossary[word]])
    .filter(([, reading]) => reading)
);
const manualPersonRuby = {
  "一休宗純": "いっきゅうそうじゅん", "世宗": "せじょん", "伊藤博文": "いとうひろぶみ", "光緒帝": "こうしょてい", "則天武后": "そくてんぶこう",
  "劉備": "りゅうび", "劉邦": "りゅうほう", "北条時宗": "ほうじょうときむね", "卑弥呼": "ひみこ", "司馬光": "しばこう", "司馬遷": "しばせん", "呂后": "りょこう", "周恩来": "しゅうおんらい",
  "夏目漱石": "なつめそうせき", "大久保利通": "おおくぼとしみち", "大坂なおみ": "おおさかなおみ", "大隅良典": "おおすみよしのり", "太宗": "たいそう", "孟子": "もうし", "安禄山": "あんろくざん",
  "宋慶齢": "そうけいれい", "宮崎駿": "みやざきはやお", "山中伸弥": "やまなかしんや", "山本五十六": "やまもといそろく", "山田長政": "やまだながまさ", "岳飛": "がくひ",
  "康有為": "こうゆうい", "張衡": "ちょうこう", "張騫": "ちょうけん", "徳川家康": "とくがわいえやす", "忽必烈": "ふびらい", "慧遠": "えおん", "手塚治虫": "てづかおさむ",
  "推古天皇": "すいこてんのう", "支倉常長": "はせくらつねなが", "新羅の善徳女王": "しらぎのそんどくじょおう", "昭和天皇": "しょうわてんのう", "曹操": "そうそう", "最澄": "さいちょう",
  "朝永振一郎": "ともながしんいちろう", "木戸孝允": "きどたかよし", "本庶佑": "ほんじょたすく", "朱熹": "しゅき", "杉原千畝": "すぎはらちうね", "李成桂": "りせいけい", "李承晩": "いすんまん",
  "李斯": "りし", "李白": "りはく", "杜甫": "とほ", "東条英機": "とうじょうひでき", "林則徐": "りんそくじょ", "柳宗元": "りゅうそうげん", "梁啓超": "りょうけいちょう", "楊貴妃": "ようきひ",
  "武帝": "ぶてい", "毛沢東": "もうたくとう", "法顕": "ほっけん", "渋沢栄一": "しぶさわえいいち", "湯川秀樹": "ゆかわひでき", "溥儀": "ふぎ", "玄宗": "げんそう",
  "王安石": "おうあんせき", "王建": "おうけん", "王莽": "おうもう", "班固": "はんこ", "班昭": "はんしょう", "白居易": "はくきょい", "石原莞爾": "いしわらかんじ",
  "福沢諭吉": "ふくざわゆきち", "空海": "くうかい", "織田信長": "おだのぶなが", "義浄": "ぎじょう", "老子": "ろうし", "聖徳太子": "しょうとくたいし", "荀子": "じゅんし", "荘子": "そうし",
  "華佗": "かだ", "蒋介石": "しょうかいせき", "蔡倫": "さいりん", "蘇軾": "そしょく", "袁世凱": "えんせいがい", "西太后": "せいたいごう", "西郷隆盛": "さいごうたかもり",
  "諸葛亮": "しょかつりょう", "豊臣秀吉": "とよとみひでよし", "足利義満": "あしかがよしみつ", "近衛文麿": "このえふみまろ", "達磨": "だるま", "鄭成功": "ていせいこう",
  "野口英世": "のぐちひでよ", "金日成": "きむいるそん", "鑑真": "がんじん", "韓愈": "かんゆ", "韓非": "かんぴ", "項羽": "こうう", "魯迅": "ろじん", "鳩摩羅什": "くまらじゅう", "黒澤明": "くろさわあきら"
};

const personGenreGroups = [
  { id: "monarch", label: "国王・権力者", keywords: ["王", "皇帝", "女王", "王妃", "ファラオ", "君主", "スルタン", "カリフ", "独裁者", "最高指導者", "執権"] },
  { id: "politician", label: "政治家", keywords: ["大統領", "首相", "政治家", "議員", "宰相", "大臣", "政府", "議会", "憲法", "共和国", "法律", "制度", "民主", "中央集権", "国づくり"] },
  { id: "war", label: "軍事・戦争", keywords: ["将軍", "征服", "戦争", "軍", "司令官", "戦い", "帝国"] },
  { id: "religion", label: "宗教・思想", keywords: ["宗教", "仏教", "キリスト教", "イスラム教", "僧", "思想", "信仰", "預言者"] },
  { id: "culture", label: "文化・芸術", keywords: ["文化", "文学", "芸術", "建築", "記録", "旅", "翻訳"] },
  { id: "political-scholar", label: "政治学者", keywords: ["政治思想", "政治哲学", "法家", "儒家", "法学", "経済学", "社会契約", "立憲", "統治", "民主政", "百科全書"] },
  { id: "philosopher", label: "哲学者", keywords: ["思想家", "哲学者", "哲学", "倫理", "論理", "人の道", "学び", "学問"] },
  { id: "science", label: "科学者", keywords: ["科学", "物理", "天文", "数学", "化学", "生物", "進化", "発明", "研究", "データ", "地理学者"] },
  { id: "medicine", label: "医療・看護", keywords: ["医学", "医療", "医師", "看護", "病院", "感染症", "ワクチン", "保健"] },
  { id: "society", label: "産業・社会", keywords: ["労働", "工場", "権利", "差別", "環境", "女性", "平和", "非暴力", "社会運動"] },
  { id: "other", label: "そのほか", keywords: [] }
];

const personGenreOverrides = {
  "孔子": ["politician", "political-scholar", "philosopher"],
  "韓非": ["politician", "political-scholar", "philosopher"],
  "李斯": ["politician", "political-scholar"],
  "荀子": ["politician", "political-scholar", "philosopher"],
  "ルソー": ["politician", "political-scholar", "philosopher"],
  "ソクラテス": ["politician", "political-scholar", "philosopher"],
  "プラトン": ["politician", "political-scholar", "philosopher"],
  "アリストテレス": ["politician", "political-scholar", "philosopher", "science"],
  "孟子": ["politician", "political-scholar", "philosopher"],
  "老子": ["philosopher", "religion"],
  "荘子": ["philosopher", "religion"],
  "ジョン・ロック": ["politician", "political-scholar", "philosopher"],
  "モンテスキュー": ["politician", "political-scholar"],
  "ヴォルテール": ["politician", "political-scholar", "philosopher"],
  "鄧小平": ["monarch", "politician"],
  "ディドロ": ["political-scholar", "culture"]
};

function setPersonGenreOverrides(names, genreIds) {
  for (const name of names) personGenreOverrides[name] = genreIds;
}

setPersonGenreOverrides(
  ["ハンムラビ", "始皇帝", "アショーカ王", "クローヴィス", "カール大帝", "エドワード1世", "ヘンリー8世", "アンリ4世", "チャールズ1世", "マンサ・ムーサ", "チンギス・ハン", "ナポレオン", "ゴルバチョフ", "鄧小平"],
  ["monarch", "politician"]
);
setPersonGenreOverrides(
  ["クフ王", "アレクサンドロス大王", "オットー1世", "フリードリヒ・バルバロッサ", "ヘンリー5世", "マクシミリアン1世", "カール5世", "ルイ14世", "ルイ16世", "マリー・アントワネット", "クレオパトラ"],
  ["monarch"]
);
setPersonGenreOverrides(
  ["ナルメル", "メネス", "ジェセル", "スネフェル", "カフラー", "メンカウラー", "ペピ2世", "メントゥホテプ2世", "アメンエムハト1世", "センウセレト3世", "ハトシェプスト", "トトメス3世", "アメンホテプ3世", "アクエンアテン", "ツタンカーメン", "アイ", "サルゴン", "ウルナンム", "シュルギ", "リムシン", "シャムシアダド1世", "ジムリリム", "ティグラトピレセル1世", "アッシュルナツィルパル2世", "シャルマネセル3世", "サルゴン2世", "センナケリブ", "エサルハドン", "アッシュルバニパル", "ナボポラッサル", "ネブカドネザル2世"],
  ["monarch", "politician"]
);
setPersonGenreOverrides(["ネフェルティティ"], ["monarch"]);
setPersonGenreOverrides(["エンヘドゥアンナ"], ["religion", "culture"]);
setPersonGenreOverrides(["グデア"], ["monarch", "politician", "culture"]);

setPersonGenreOverrides(["ソロン", "クレイステネス", "ペリクレス", "キケロ", "カトー"], ["politician", "political-scholar"]);
setPersonGenreOverrides(["レオニダス"], ["monarch", "war"]);
setPersonGenreOverrides(["テミストクレス", "ミルティアデス", "アルキビアデス", "スキピオ・アフリカヌス", "マリウス", "ブルートゥス"], ["politician", "war"]);
setPersonGenreOverrides(["ティベリウス・グラックス"], ["politician", "society"]);
setPersonGenreOverrides(["スラ", "ポンペイウス", "クラッスス", "カエサル"], ["monarch", "politician", "war"]);
setPersonGenreOverrides(["アウグストゥス", "リウィア", "ティベリウス", "クラウディウス", "ネロ", "ウェスパシアヌス", "ティトゥス", "トラヤヌス"], ["monarch", "politician"]);
setPersonGenreOverrides(["ピタゴラス"], ["philosopher", "science"]);
setPersonGenreOverrides(["ユークリッド", "アルキメデス", "エラトステネス"], ["science"]);
setPersonGenreOverrides(["ヘロドトス", "トゥキディデス"], ["culture"]);
setPersonGenreOverrides(["ヒポクラテス"], ["medicine"]);

setPersonGenreOverrides(["キュロス2世", "ダレイオス1世", "クセルクセス1世", "アルタクセルクセス1世", "チャンドラグプタ", "カニシカ王", "チャンドラグプタ2世", "劉邦", "呂后", "武帝", "太宗", "則天武后", "玄宗", "忽必烈"], ["monarch", "politician"]);
setPersonGenreOverrides(["ゾロアスター"], ["religion"]);
setPersonGenreOverrides(["カウティリヤ"], ["politician", "political-scholar"]);
setPersonGenreOverrides(["カーリダーサ"], ["culture"]);
setPersonGenreOverrides(["パーニニ", "司馬遷", "班固", "班昭"], ["culture"]);
setPersonGenreOverrides(["張騫", "蔡倫"], ["politician", "society"]);
setPersonGenreOverrides(["張衡"], ["science"]);
setPersonGenreOverrides(["華佗"], ["medicine"]);
setPersonGenreOverrides(["曹操", "劉備"], ["monarch", "politician", "war"]);
setPersonGenreOverrides(["諸葛亮"], ["politician", "political-scholar", "war"]);
setPersonGenreOverrides(["卑弥呼"], ["monarch", "politician", "religion"]);

setPersonGenreOverrides(["パウロ", "ペテロ", "アウグスティヌス", "ヒエロニムス", "アタナシウス", "アリウス", "ベネディクトゥス", "グレゴリウス1世", "キュリロス", "メトディオス", "ナーガールジュナ", "アサンガ", "ヴァスバンドゥ", "鳩摩羅什", "達磨", "慧遠", "法顕"], ["religion", "philosopher"]);
setPersonGenreOverrides(["パウロ", "ペテロ", "ベネディクトゥス", "グレゴリウス1世", "達磨"], ["religion"]);
setPersonGenreOverrides(["アウグスティヌス", "アタナシウス", "アリウス", "ナーガールジュナ", "アサンガ", "ヴァスバンドゥ", "慧遠"], ["religion", "philosopher"]);
setPersonGenreOverrides(["ヒエロニムス"], ["religion", "culture"]);
setPersonGenreOverrides(["キュリロス", "メトディオス", "鳩摩羅什", "法顕"], ["religion", "culture"]);
setPersonGenreOverrides(["安禄山", "岳飛"], ["war"]);
setPersonGenreOverrides(["杜甫", "李白", "白居易"], ["culture"]);
setPersonGenreOverrides(["韓愈", "柳宗元", "蘇軾"], ["culture"]);
setPersonGenreOverrides(["王安石", "司馬光"], ["politician", "political-scholar"]);
setPersonGenreOverrides(["朱熹"], ["religion", "philosopher"]);
setPersonGenreOverrides(["マルコ・ポーロ"], ["culture"]);

setPersonGenreOverrides(["ユスティニアヌス", "テオドラ", "ヘラクレイオス", "バシレイオス2世", "ウラジーミル1世", "ヤロスラフ賢公", "ウィリアム1世", "ジョン王", "サラディン"], ["monarch", "politician"]);
setPersonGenreOverrides(["エレノア・オブ・アキテーヌ", "リチャード1世"], ["monarch"]);
setPersonGenreOverrides(["ダンテ", "チョーサー", "ジョット", "クリスティーヌ・ド・ピザン"], ["culture"]);
setPersonGenreOverrides(["アベラール"], ["culture", "philosopher"]);
setPersonGenreOverrides(["リチャード・ド・ベリー"], ["culture"]);

setPersonGenreOverrides(["エンリケ航海王子"], ["monarch", "politician"]);
setPersonGenreOverrides(["バルトロメウ・ディアス", "ヴァスコ・ダ・ガマ", "フェルディナンド・マゼラン", "フアン・セバスティアン・エルカーノ", "アメリゴ・ヴェスプッチ", "ジョン・カボット", "ジャック・カルティエ", "フランシス・ドレーク", "ウォルター・ローリー", "アベル・タスマン", "ジェームズ・クック", "鄭和", "クリストファー・コロンブス"], ["society"]);
setPersonGenreOverrides(["エルナン・コルテス", "フランシスコ・ピサロ"], ["war"]);
setPersonGenreOverrides(["トゥパク・アマル1世"], ["monarch", "politician", "war"]);
setPersonGenreOverrides(["マリンチェ", "バルトロメ・デ・ラス・カサス"], ["society"]);

setPersonGenreOverrides(["ジョージ・ワシントン", "トマス・ジェファーソン", "ジョン・アダムズ", "ロベスピエール", "ダントン", "マラー"], ["monarch", "politician"]);
setPersonGenreOverrides(["トマス・ペイン", "ベンジャミン・フランクリン", "ラファイエット", "シモン・ボリバル"], ["politician"]);
setPersonGenreOverrides(["メアリ・ウルストンクラフト", "アビゲイル・アダムズ"], ["politician", "political-scholar", "society"]);
setPersonGenreOverrides(["アダム・スミス"], ["political-scholar"]);
setPersonGenreOverrides(["デカルト", "ライプニッツ"], ["philosopher", "science"]);
setPersonGenreOverrides(["スピノザ", "ショーペンハウアー"], ["philosopher"]);
setPersonGenreOverrides(["カント", "ヘーゲル"], ["political-scholar", "philosopher"]);
setPersonGenreOverrides(["シラー", "ニーチェ"], ["culture", "philosopher"]);
setPersonGenreOverrides(["カール・マルクス", "フリードリヒ・エンゲルス", "ロバート・オーウェン"], ["politician", "political-scholar", "society"]);

setPersonGenreOverrides(["セシル・ローズ", "レオポルド2世", "メネリク2世", "テオドロス2世", "サモリ・トゥーレ", "ムハンマド・アフマド"], ["monarch", "politician"]);
setPersonGenreOverrides(["デイヴィッド・リヴィングストン", "ヘンリー・モートン・スタンリー"], ["society"]);
setPersonGenreOverrides(["ジャマールッディーン・アフガーニー", "ムハンマド・アブドゥフ", "サイイド・アフマド・ハーン"], ["religion", "political-scholar"]);
setPersonGenreOverrides(["ラーマクリシュナ", "ヴィヴェーカーナンダ"], ["religion", "philosopher"]);
setPersonGenreOverrides(["ラビンドラナート・タゴール", "ロキア・サカワット・ホセイン", "ホセ・リサール"], ["culture", "society"]);

setPersonGenreOverrides(["ウィンストン・チャーチル", "ネヴィル・チェンバレン", "シャルル・ド・ゴール", "フィリップ・ペタン", "ヨシップ・ブロズ・チトー", "ハリー・トルーマン", "ドワイト・アイゼンハワー", "東条英機"], ["monarch", "politician", "war"]);
setPersonGenreOverrides(["アドルフ・ヒトラー", "ベニート・ムッソリーニ", "フランシスコ・フランコ"], ["monarch", "politician", "war"]);
setPersonGenreOverrides(["ダグラス・マッカーサー", "ジョージ・マーシャル", "ジョージ・パットン", "チェスター・ニミッツ", "山本五十六"], ["war"]);

setPersonGenreOverrides(["ジャワハルラール・ネルー", "インディラ・ガンディー", "ベナジル・ブット", "リー・クアンユー", "パトリス・ルムンバ", "ジュリウス・ニエレレ", "トーマス・サンカラ", "エレン・ジョンソン・サーリーフ", "ジョン・F・ケネディ", "ネルソン・マンデラ"], ["monarch", "politician", "society"]);
setPersonGenreOverrides(["アウンサンスーチー", "ルース・ベイダー・ギンズバーグ", "ワンガリ・マータイ", "ハーヴェイ・ミルク"], ["politician", "society"]);
setPersonGenreOverrides(["ダライ・ラマ14世"], ["religion", "politician", "society"]);
setPersonGenreOverrides(["デズモンド・ツツ", "マーティン・ルーサー・キング・ジュニア", "マルコムX"], ["religion", "society"]);
setPersonGenreOverrides(["ローザ・パークス", "セサル・チャベス", "ドロレス・ウエルタ", "マハトマ・ガンディー", "マララ・ユスフザイ"], ["society"]);

const favorites = new Set(JSON.parse(localStorage.getItem("historyFavorites") || "[]"));
const peopleTools = document.querySelector(".people-tools");
let activeFilter = "all";
let activeQuiz = 0;
let activeEraDetail = null;

function normalizeModalData(data) {
  people = data.people || [];
  personByName = new Map(Object.entries(data.peopleByName || {}));
  actionCards = data.actionCards || {};
  kingdomCards = data.kingdomCards || [];
  kingdomPeople = data.kingdomPeople || {};
}

async function loadModalData() {
  if (window.WORLD_HISTORY_MODAL_DATA) {
    normalizeModalData(window.WORLD_HISTORY_MODAL_DATA);
    document.documentElement.dataset.modalDataSource = "js";
    return;
  }
  const response = await fetch("data/modal-data.json");
  if (!response.ok) throw new Error(`modal-data.json could not be loaded: ${response.status}`);
  normalizeModalData(await response.json());
  document.documentElement.dataset.modalDataSource = "json";
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


function ruby(text, reading) {
  if (!/[\u3400-\u9fff]/.test(text) || /[\u30a0-\u30ff]/.test(text) || text === reading) return escapeHtml(text);
  return `<ruby>${text}<rt>${reading}</rt></ruby>`;
}

function eraFor(name) {
  return eras.find((era) => name.includes(era.name)) || eras.find((era) => name.includes(era.name.replace("の時代", ""))) || eras[0];
}

function primaryEraIdForPerson(person) {
  return eraFor(person[2]).id;
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
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function applyRubyReadings(text, readingEntries) {
  const source = String(text || "");
  const readings = new Map(readingEntries);
  const words = [...readings.keys()]
    .filter((word) => readings.get(word) !== word && source.includes(word))
    .sort((a, b) => b.length - a.length);
  const escaped = escapeHtml(source);
  if (!words.length) return escaped;
  const pattern = new RegExp(words.map(escapeRegExp).join("|"), "g");
  return escaped.replace(pattern, (word) => `<ruby>${escapeHtml(word)}<rt>${readings.get(word)}</rt></ruby>`);
}

function applyStudyRuby(text) {
  return applyRubyReadings(text, [...Object.entries(manualStudyRuby), ...Object.entries(manualPersonRuby)]);
}

function applyKingdomRuby(text) {
  return applyRubyReadings(text, [...Object.entries(manualStudyRuby), ...Object.entries(manualKingdomRuby)]);
}

function linkLabelHtml(name, item) {
  if (item?.type === "person" && item.target === name) {
    const person = personByName.get(name);
    const reading = manualPersonRuby[name] || person?.[1];
    if (person && reading) return ruby(person[0], reading);
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

function shouldSkipInlineLink(source, name, index, item) {
  if (name.length === 1 && ["action", "kingdom"].includes(item?.type)) {
    const before = source[index - 1] || "";
    const after = source[index + name.length] || "";
    if (isCjkChar(before) || isKatakanaChar(before) || /[A-Za-z0-9]/.test(before)) return true;
    if (after && !singleCharInlineFollowers.has(after)) return true;
  }
  if (!isKatakanaText(name)) return false;
  const before = source[index - 1] || "";
  const after = source[index + name.length] || "";
  return isKatakanaChar(before) || isKatakanaChar(after);
}

const personInlineAliases = {
  "コロンブス": "クリストファー・コロンブス",
  "マゼラン": "フェルディナンド・マゼラン",
  "ダ・ガマ": "ヴァスコ・ダ・ガマ",
  "ディアス": "バルトロメウ・ディアス",
  "ルター": "マルティン・ルター",
  "ワシントン": "ジョージ・ワシントン",
  "リンカーン": "エイブラハム・リンカーン",
  "ガンディー": "マハトマ・ガンディー",
  "マンデラ": "ネルソン・マンデラ",
  "ケネディ": "ジョン・F・ケネディ",
  "ダーウィン": "チャールズ・ダーウィン",
  "エジソン": "トーマス・エジソン",
  "アインシュタイン": "アルベルト・アインシュタイン",
  "アームストロング": "ニール・アームストロング"
};

function kingdomInlineNames(card) {
  const names = [card.name, card.displayName];
  const shortDisplayName = String(card.displayName || "").replace(/（[^）]+）|\([^)]*\)/g, "");
  if (shortDisplayName) names.push(shortDisplayName);
  return [...new Set(names.filter(Boolean))];
}

function enrichDetailLinks(text) {
  const source = String(text);
  const peopleItems = [...personByName.keys()].filter((name) => source.includes(name)).map((name) => ({ name, target: name, type: "person" }));
  const aliasItems = Object.entries(personInlineAliases)
    .filter(([alias, target]) => source.includes(alias) && personByName.has(target))
    .map(([name, target]) => ({ name, target, type: "person" }));
  const actionItems = Object.keys(actionCards).filter((name) => source.includes(name)).map((name) => ({ name, target: name, type: "action" }));
  const kingdomItems = kingdomCards
    .flatMap((card) => kingdomInlineNames(card).map((name) => ({ name, target: card.id, type: "kingdom" })))
    .filter((item) => source.includes(item.name));
  const itemMap = new Map();
  [...peopleItems, ...kingdomItems, ...actionItems, ...aliasItems].forEach((item) => {
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
    html += applyStudyRuby(source.slice(cursor, match.index));
    if (shouldSkipInlineLink(source, name, match.index, item)) {
      html += linkLabelHtml(name, item);
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
  html += applyStudyRuby(source.slice(cursor));
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
  const region = card.modernRegion;
  if (card.name === "フランク王国" || card.name === "フランス王国" || card.name === "フランス第一共和政" || card.name === "ナポレオン帝国" || card.name === "フランス第三共和政" || card.name === "自由フランス") return "フランス周辺";
  if (card.name === "アングロ・サクソン諸王国" || card.name === "イングランド王国" || card.name === "イギリス帝国" || card.name === "大英帝国" || card.name === "イギリス労働運動") return "イギリス";
  if (card.name === "女性参政権運動") return "イギリス・アメリカ";
  if (card.name === "西ゴート王国" || card.name === "後ウマイヤ朝" || card.name === "スペイン帝国" || card.name === "スペイン第二共和政") return "スペイン";
  if (card.name === "ポルトガル海上帝国") return "ポルトガル";
  if (card.name === "オランダ東インド会社") return "オランダ";
  if (card.name === "プロイセン王国" || card.name === "ドイツ帝国" || card.name === "ドイツ帝国末期" || card.name === "ワイマール共和国" || card.name === "ナチス・ドイツ") return "ドイツ";
  if (card.name === "オーストリア帝国" || card.name === "オーストリア＝ハンガリー帝国") return "中央ヨーロッパ";
  if (card.name === "ロシア帝国" || card.name === "ロシア帝国後期" || card.name === "ソビエト連邦初期" || card.name === "ソビエト連邦冷戦期") return "ロシア周辺";
  if (region === "アメリカ") return "アメリカ";
  if (region === "メキシコ") return "メキシコ";
  if (region === "ペルー") return "ペルー";
  if (region === "ハイチ") return "ハイチ";
  if (region.includes("コロンビア") || region.includes("ベネズエラ")) return "コロンビア・ベネズエラ";
  if (region.includes("アメリカ・カナダ")) return "北米東部";
  if (region.includes("メキシコ・グアテマラ")) return "メソアメリカ";
  if (region.includes("中国")) return "中国";
  if (region.includes("日本")) return "日本";
  if (region.includes("韓国") || region.includes("朝鮮")) return "朝鮮半島";
  if (region.includes("インド") || region.includes("パキスタン") || region.includes("バングラデシュ")) return "南アジア";
  if (region.includes("イラン") || region.includes("イラク") || region.includes("シリア") || region.includes("トルコ") || region.includes("西アジア") || region.includes("アラビア")) return "西アジア";
  if (region.includes("エジプト") || region.includes("スーダン") || region.includes("北アフリカ")) return "北アフリカ";
  if (region.includes("ギリシャ") || region.includes("イタリア") || region.includes("ヨーロッパ南部") || region.includes("地中海")) return "地中海・南ヨーロッパ";
  if (region.includes("フランス")) return "フランス周辺";
  if (region.includes("イギリス")) return "イギリス";
  if (region.includes("スペイン")) return "スペイン";
  if (region.includes("ドイツ")) return "ドイツ";
  if (region.includes("オーストリア") || region.includes("ハンガリー") || region.includes("中央ヨーロッパ")) return "中央ヨーロッパ";
  if (region.includes("ロシア")) return "ロシア周辺";
  if (region.includes("ウクライナ")) return "ウクライナ";
  if (region.includes("ヨーロッパ")) return "ヨーロッパ広域";
  if (region.includes("メキシコ")) return "メキシコ";
  if (region.includes("ペルー")) return "ペルー";
  if (region.includes("アメリカ") || region.includes("カナダ")) return "北米";
  if (region.includes("中南米")) return "中南米";
  if (region.includes("タイ") || region.includes("インドネシア") || region.includes("カンボジア") || region.includes("ベトナム") || region.includes("東南アジア")) return "東南アジア";
  if (region.includes("アフリカ") || region.includes("ガーナ") || region.includes("ナイジェリア") || region.includes("エチオピア") || region.includes("ケニア") || region.includes("南アフリカ")) return "アフリカ";
  if (region.includes("世界")) return "世界";
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

// 地域タイムラインに表示する地域は「勢力の数」ではなく「その時代に世界へ与えた影響」で選ぶ。
// 政治・経済・軍事・文化・グローバルな波及などの観点から、時代ごとに影響の大きい地域を順に並べる。
// ここに挙げた地域（その時代に勢力データがあるもの）を優先し、足りない分だけ件数で補う。
const eraRegionPriority = {
  farming: ["西アジア", "中国", "メソアメリカ", "ペルー", "南アジア", "日本"],
  civilization: ["西アジア", "北アフリカ", "南アジア", "中国", "メソアメリカ", "ペルー"],
  "ancient-empires": ["西アジア", "地中海・南ヨーロッパ", "中国", "南アジア", "北アフリカ"],
  "faith-cultures": ["南アジア", "中国", "地中海・南ヨーロッパ", "西アジア", "朝鮮半島"],
  "trade-kingdoms": ["中国", "西アジア", "南アジア", "東南アジア", "フランス周辺", "イギリス", "地中海・南ヨーロッパ"],
  voyages: ["スペイン", "ポルトガル", "メキシコ", "ペルー", "アフリカ", "中国", "南アジア", "西アジア"],
  revolutions: ["イギリス", "アメリカ", "フランス周辺", "コロンビア・ベネズエラ", "ハイチ", "ロシア周辺", "南アジア"],
  "connected-world": ["イギリス", "アフリカ", "南アジア", "中国", "日本", "アメリカ", "ロシア周辺"],
  "world-wars": ["ドイツ", "ロシア周辺", "イギリス", "フランス周辺", "日本", "中国", "世界"],
  "global-future": ["アメリカ", "ロシア周辺", "南アジア", "アフリカ", "日本", "中国", "ヨーロッパ広域", "世界"]
};

// 時代ごとに、細分化された地域をより広い地域へ束ねて1レーンで見せたいときに使う仕組み。
// 島国イギリスを大陸の仏・独と同じレーンにするのは不適切なため、現在は未使用（{} のまま）。
const regionMergeByEra = {};

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

const subcategoryTimelineRegions = {
  "西アジア": ["西アジア", "パレスチナ", "イラク", "イラン", "トルコ"],
  "東アジア": ["中国", "日本", "朝鮮半島", "中国東北部"],
  "東アジア・太平洋": ["中国", "日本", "朝鮮半島", "東南アジア", "太平洋"],
  "南北アメリカ": ["メソアメリカ", "メキシコ", "ペルー", "エクアドル", "アメリカ", "北米", "北米東部", "ハイチ", "コロンビア・ベネズエラ", "中南米"],
  "北アフリカ": ["北アフリカ"],
  "南アジア": ["南アジア"],
  "地中海地域": ["地中海・南ヨーロッパ", "ギリシャ", "イタリア"],
  "ローマ帝国": ["地中海・南ヨーロッパ"],
  "中央アジア": ["中央アジア", "西アジア"],
  "南アジア・東南アジア": ["南アジア", "東南アジア"],
  "ヨーロッパ": ["イギリス", "フランス周辺", "スペイン", "ポルトガル", "オランダ", "ドイツ", "中央ヨーロッパ", "ロシア周辺", "ヨーロッパ広域", "地中海・南ヨーロッパ"],
  "ユーラシア": ["中国", "中央アジア", "西アジア", "ロシア周辺", "地中海・南ヨーロッパ", "ヨーロッパ広域"],
  "世界の海": ["スペイン", "ポルトガル", "オランダ", "イギリス", "フランス周辺"],
  "中南米": ["メキシコ", "ペルー", "ハイチ", "コロンビア・ベネズエラ", "中南米", "メソアメリカ"],
  "アフリカ・アメリカ": ["アフリカ", "北アフリカ", "アメリカ", "メキシコ", "ペルー", "ハイチ", "コロンビア・ベネズエラ"],
  "アジア": ["中国", "日本", "朝鮮半島", "南アジア", "東南アジア", "西アジア"],
  "イギリス": ["イギリス"],
  "北アメリカ": ["アメリカ", "北米", "北米東部"],
  "フランス": ["フランス周辺"],
  "世界": ["世界"],
  "アジア・アフリカ": ["南アジア", "東南アジア", "中国", "朝鮮半島", "アフリカ"],
  "アフリカ": ["アフリカ"]
};

const subcategoryTimelineRegionOverrides = {
  "東アジアの米と雑穀の農耕": ["中国"],
  "南北アメリカの初期農業": ["メソアメリカ", "ペルー"],
  "メソポタミアの都市と文字": ["西アジア"],
  "黄河流域の王朝の誕生": ["中国"],
  "ギリシャの市民政治": ["地中海・南ヨーロッパ"],
  "ローマ帝国の地中海支配": ["地中海・南ヨーロッパ"],
  "儒教と中国政治": ["中国"],
  "仏教の東アジア伝来": ["中国", "朝鮮半島", "日本"],
  "ポルトガルとスペインの航路開拓": ["ポルトガル", "スペイン"],
  "マゼラン船隊の世界一周": ["ポルトガル", "スペイン"],
  "アステカ・インカの征服": ["メキシコ", "ペルー"],
  "大西洋奴隷貿易": ["アフリカ", "アメリカ", "ハイチ"],
  "香辛料と銀の世界交易": ["中国", "南アジア", "東南アジア", "西アジア"],
  "ラテンアメリカ独立運動": ["ハイチ", "コロンビア・ベネズエラ", "メキシコ", "中南米"],
  "奴隷制廃止運動": ["アメリカ", "ハイチ", "イギリス"],
  "憲法と議会を求める動き": ["フランス周辺", "イギリス", "ドイツ", "中央ヨーロッパ"],
  "帝国主義の広がり": ["イギリス", "フランス周辺", "ドイツ", "スペイン", "ポルトガル", "オランダ"],
  "鉄道・汽船・電信の時代": ["世界"],
  "第一次世界大戦の拡大": ["ドイツ", "ロシア周辺", "イギリス", "フランス周辺", "中央ヨーロッパ"],
  "世界恐慌": ["世界"],
  "ナチスの独裁と迫害": ["ドイツ"],
  "東アジア・太平洋の戦争拡大": ["日本", "中国", "東南アジア"],
  "第二次世界大戦の世界的被害": ["世界"],
  "国際連合の成立": ["世界"],
  "冷戦の世界": ["アメリカ", "ロシア周辺"],
  "アジア・アフリカの独立": ["南アジア", "東南アジア", "アフリカ"],
  "アパルトヘイト廃止と人権": ["アフリカ"],
  "ヨーロッパ統合": ["ヨーロッパ広域", "フランス周辺", "ドイツ"],
  "インターネットの広がり": ["インターネットサービス"],
  "地球規模の課題とAI": ["世界"]
};

const subcategoryTimelineKeywords = {
  "メソポタミアの都市と文字": ["シュメール", "ウル", "ウルク", "アッカド", "バビロン", "アッシリア", "メソポタミア"],
  "ナイル川と古代エジプト": ["エジプト", "ヌビア"],
  "インダス文明の計画都市": ["インダス", "ハラッパー", "モヘンジョダロ"],
  "黄河流域の王朝の誕生": ["夏", "殷", "周", "中国"],
  "ペルシャ帝国の多民族支配": ["ペルシャ", "アケメネス", "パルティア", "ササン"],
  "ギリシャの市民政治": ["ギリシャ", "アテネ", "スパルタ", "マケドニア"],
  "ローマ帝国の地中海支配": ["ローマ"],
  "秦と漢の中国統一": ["秦", "漢"],
  "アショーカ王と仏教保護": ["マウリヤ", "インド"],
  "儒教と中国政治": ["中国", "漢", "唐", "宋", "明", "清"],
  "キリスト教の公認と国教化": ["ローマ", "ビザンツ"],
  "イスラム教の成立と広がり": ["イスラム", "ウマイヤ", "アッバース", "ファーティマ", "セルジューク"],
  "唐と長安の国際文化": ["唐", "中国"],
  "シルクロードの交流": ["中央アジア", "トルコ", "モンゴル", "ペルシャ"],
  "イスラム世界の商業と学問": ["イスラム", "ウマイヤ", "アッバース", "ファーティマ", "セルジューク"],
  "インド洋交易の広がり": ["インド", "シュリーヴィジャヤ", "マタラム", "ムガル"],
  "ヨーロッパ都市と商人の成長": ["フランク", "フランス", "イングランド", "神聖ローマ", "ビザンツ"],
  "モンゴル帝国と東西交流": ["モンゴル", "元"],
  "ポルトガルとスペインの航路開拓": ["ポルトガル", "スペイン"],
  "マゼラン船隊の世界一周": ["ポルトガル", "スペイン"],
  "アステカ・インカの征服": ["アステカ", "インカ", "スペイン"],
  "大西洋奴隷貿易": ["奴隷", "ハイチ", "アメリカ", "アフリカ"],
  "香辛料と銀の世界交易": ["オランダ", "東インド", "ムガル", "明", "清", "スペイン"],
  "イギリス産業革命": ["イギリス", "大英"],
  "アメリカ独立革命": ["アメリカ"],
  "フランス革命": ["フランス", "ナポレオン"],
  "ラテンアメリカ独立運動": ["ハイチ", "コロンビア", "ベネズエラ", "メキシコ"],
  "奴隷制廃止運動": ["奴隷", "ハイチ", "アメリカ", "イギリス"],
  "憲法と議会を求める動き": ["フランス", "イギリス", "ドイツ", "オーストリア"],
  "帝国主義の広がり": ["イギリス", "大英", "フランス", "ドイツ", "スペイン", "ポルトガル", "オランダ"],
  "アフリカ分割と植民地支配": ["アフリカ", "エチオピア", "ベニン", "ズールー", "アシャンティ"],
  "インドの植民地支配": ["インド", "イギリス東インド", "ムガル"],
  "清と日本の近代化への分かれ道": ["清", "明治", "日本"],
  "アメリカの工業化と鉄道": ["アメリカ"],
  "第一次世界大戦の拡大": ["ドイツ", "ロシア", "イギリス", "フランス", "オーストリア"],
  "ナチスの独裁と迫害": ["ナチス", "ドイツ"],
  "東アジア・太平洋の戦争拡大": ["日本", "中国"],
  "冷戦の世界": ["アメリカ", "ソビエト", "ソ連"],
  "アジア・アフリカの独立": ["インド", "インドネシア", "ガーナ", "アルジェリア", "アフリカ"],
  "東アジアの経済とくらしの変化": ["日本", "中国", "韓国"],
  "アパルトヘイト廃止と人権": ["南アフリカ", "アパルトヘイト"],
  "ヨーロッパ統合": ["ヨーロッパ", "EU", "フランス", "ドイツ"],
  "インターネットの広がり": ["インターネット", "Web", "Google", "Wikipedia", "Facebook", "YouTube", "Twitter", "X", "WhatsApp", "Instagram", "WeChat", "TikTok", "SNS"]
};

const subcategoriesWithoutTimeline = new Set([
  "東アジアの経済とくらしの変化"
]);

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
        <h3>${applyStudyRuby(group.heading)}</h3>
        <p>${applyStudyRuby(`${group.title}で押さえたい地域ごとの変化です。各子カテゴリーの勢力タイムラインは、関係が深い地域だけを表示し、同じ地域構成のタイムラインは大カテゴリー内で1回だけ表示します。`)}</p>
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
              <header>
                <span class="subcategory-region">${applyStudyRuby(region)}</span>
                <h4><button class="action-inline" type="button" data-action-name="${escapeHtml(name)}"><strong>${applyStudyRuby(name)}</strong></button></h4>
                <p>${applyStudyRuby(summary)}</p>
              </header>
              ${imageHtml}
              <p class="subcategory-body">${enrichDetailLinks(bodyText)}</p>
              <div class="tag-row">${tags.map((tag) => `<span class="tag">${applyStudyRuby(tag)}</span>`).join("")}</div>
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
  const text = `${person[3]} ${person[4]} ${person[5]}`;
  const titleText = `${person[3]} ${person[4]}`;
  if (personGenreOverrides[person[0]]) {
    const overridden = personGenreGroups.filter((group) => personGenreOverrides[person[0]].includes(group.id));
    return overridden.length ? overridden : [personGenreGroups.find((group) => group.id === "other")];
  }
  const matchedIds = new Set();
  for (const group of personGenreGroups) {
    const source = group.id === "monarch" ? titleText : text;
    if (group.id !== "other" && group.keywords.some((keyword) => source.includes(keyword))) matchedIds.add(group.id);
  }
  const matched = personGenreGroups.filter((group) => matchedIds.has(group.id));
  return matched.length ? matched : [personGenreGroups.find((group) => group.id === "other")];
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
  return `<article class="person-card" style="--person-color:${era.colors[0]}"><button class="favorite" type="button" aria-label="${person[0]}をお気に入り" onclick="toggleFavorite('${person[0]}', event)">${saved ? "★" : "☆"}</button><button type="button" onclick="openPerson('${person[0]}')"><div class="person-top"><div class="avatar">${person[6]}</div><div><h3>${ruby(person[0], person[1])}</h3><small>${person[2]} / ${personGenreLabels(person)}</small></div></div><p><strong>${applyStudyRuby(person[4])}</strong></p><p>${applyStudyRuby(person[5])}</p></button></article>`;
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
        <span class="person-name-text"><strong>${ruby(person[0], person[1])}</strong><small>${person[2]} / ${personGenreLabels(person)}</small></span>
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
  if (!Array.isArray(card)) return null;
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

function renderLearningModal({ type, icon, eyebrow, titleHtml, subtitle, visual, sections, tags, heroActions = "" }) {
  personDialog.classList.remove("kingdom-dialog");
  personDetail.className = "learning-modal-detail";
  personDetail.innerHTML = `
    <article class="learning-modal-card modal-type-${escapeHtml(type)}">
      <header class="modal-hero-row">
        <div class="modal-title-block">
          <div class="modal-icon-tile" aria-hidden="true">${escapeHtml(icon || "💡")}</div>
          <p class="modal-eyebrow">${eyebrow}</p>
          <h2>${titleHtml}</h2>
          <p class="modal-subtitle">${subtitle}</p>
          <div class="tag-row modal-tag-row">
            ${tags.map((tag) => `<span class="tag">${applyStudyRuby(tag)}</span>`).join("")}
          </div>
          ${heroActions}
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
          return `<button class="mini-person-button" type="button" onclick="openPerson('${name.replace(/'/g, "\\'")}')" aria-label="${name}の人物カードを開く"><span class="mini-person-icon">${person[6]}</span><span>${ruby(person[0], person[1])}</span></button>`;
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
    titleHtml: ruby(person[0], person[1]),
    subtitle: applyStudyRuby(person[4]),
    visual: findVisualForPerson(person),
    sections: personModalSections(person),
    tags: [person[3], person[2], ...getPersonGenres(person).map((genre) => genre.label)],
    heroActions: `<button class="modal-favorite-button ${saved ? "is-saved" : ""}" type="button" data-modal-favorite data-person-name="${escapedName}" aria-pressed="${saved ? "true" : "false"}"><span aria-hidden="true">${saved ? "★" : "☆"}</span><span>${saved ? "お気に入り済み" : "お気に入りに追加"}</span></button>`
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
  const icon = button.querySelector("span[aria-hidden='true']");
  const label = button.querySelector("span:last-child");
  if (icon) icon.textContent = saved ? "★" : "☆";
  if (label) label.textContent = saved ? "お気に入り済み" : "お気に入りに追加";
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
  } catch (error) {
    console.error(error);
    timeline.innerHTML = '<p class="section-band">データを読み込めませんでした。ローカルサーバーから開き直してください。</p>';
    return;
  }
  renderEraLinks();
  renderTimeline();
  renderPeopleFilters();
  renderPeople();
  renderQuiz();
  observeEra();
}

initApp();
