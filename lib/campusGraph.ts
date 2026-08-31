/**
 * 校园道路网络 — 用于定制路线的步行距离计算
 * 使用简化节点图 + Dijkstra 算法，避免路线穿楼或穿湖。
 *
 * 坐标系：与 map-points.json 一致（地图图片 % 坐标）
 * 物理比例：凌水校区约 1.5km × 1.2km
 *   1% x ≈ 15m   1% y ≈ 12m
 */

type Node = { x: number; y: number };

/** 节点坐标（包含实际点位 + 道路路口） */
export const GRAPH_NODES: Record<string, Node> = {
  // ── 实际点位 ───────────────────────────────────────────────
  "south-gate":       { x: 33.3, y: 88.4 },
  "lover-road":       { x: 30.1, y: 76.5 },
  "lover-slope":      { x: 45.1, y: 77.4 },
  "music-fountain":   { x: 41.0, y: 74.0 },
  "bochuan":          { x: 31.0, y: 71.3 },
  "chairman-statue":  { x: 34.8, y: 67.6 },
  "landmark-mtbglalg":{ x: 46.1, y: 71.4 },
  "student-center":   { x: 55.6, y: 63.9 },
  "main-building":    { x: 38.9, y: 62.6 },
  "second-building":  { x: 38.0, y: 57.6 },
  "comprehensive-one":{ x: 46.3, y: 52.0 },
  "ling-shui-lake":   { x: 35.0, y: 50.6 },
  "flower-wall":      { x: 44.0, y: 45.5 },
  "first-building":   { x: 22.0, y: 30.9 },
  // ── 道路路口（中间节点，用于绕湖等障碍） ────────────────────
  "j1":  { x: 36.0, y: 83.0 },   // 南门主路口
  "j2":  { x: 36.0, y: 77.0 },   // 主路中段路口
  "j3":  { x: 36.0, y: 71.5 },   // 主路近伯川路口
  "j4":  { x: 42.0, y: 64.5 },   // 东侧路口（一馆附近）
  "j5":  { x: 43.0, y: 55.0 },   // 二馆东路口
  "j6":  { x: 35.5, y: 55.0 },   // 凌水湖北路口
  "j7":  { x: 35.5, y: 44.5 },   // 凌水湖南路口（绕湖）
  "j8":  { x: 24.0, y: 56.0 },   // 西路
  "j9":  { x: 22.0, y: 43.0 },   // 西北路
};

/** 双向道路边 */
const EDGES: Array<[string, string]> = [
  // 南门 → 主路
  ["south-gate",       "j1"],
  ["j1",               "lover-road"],
  ["j1",               "j2"],
  // 主路中段
  ["j2",               "lover-road"],
  ["j2",               "lover-slope"],
  ["j2",               "music-fountain"],
  ["j2",               "j3"],
  // 情人坡 ↔ 音乐喷泉
  ["lover-slope",      "music-fountain"],
  ["music-fountain",   "landmark-mtbglalg"],
  ["landmark-mtbglalg","student-center"],
  // 主路近北部
  ["j3",               "bochuan"],
  ["j3",               "chairman-statue"],
  ["bochuan",          "chairman-statue"],
  // 中部
  ["chairman-statue",  "main-building"],
  ["main-building",    "j4"],
  ["j4",               "student-center"],
  ["j4",               "second-building"],
  // 二馆 → 东路 → 综一 → 花墙
  ["second-building",  "j5"],
  ["j5",               "comprehensive-one"],
  ["j5",               "flower-wall"],
  ["comprehensive-one","student-center"],
  // 绕湖路（西侧绕行，不穿湖）
  ["second-building",  "j6"],
  ["j6",               "ling-shui-lake"],
  ["ling-shui-lake",   "j7"],
  ["j7",               "flower-wall"],
  // 西路 → 令希图书馆
  ["j3",               "j8"],
  ["j8",               "j9"],
  ["j9",               "first-building"],
  // 令希 ↔ 综一（西部内环）
  ["first-building",   "j8"],
  ["j8",               "comprehensive-one"],
];

/** 两点间物理距离（米） */
function dist(a: Node, b: Node): number {
  const dx = (a.x - b.x) * 15; // 1% x ≈ 15 m
  const dy = (a.y - b.y) * 12; // 1% y ≈ 12 m
  return Math.sqrt(dx * dx + dy * dy);
}

/** 构建邻接表 */
function buildAdjacency(): Map<string, Array<{ to: string; d: number }>> {
  const adj = new Map<string, Array<{ to: string; d: number }>>();
  for (const [a, b] of EDGES) {
    const na = GRAPH_NODES[a];
    const nb = GRAPH_NODES[b];
    if (!na || !nb) continue;
    const d = dist(na, nb);
    if (!adj.has(a)) adj.set(a, []);
    if (!adj.has(b)) adj.set(b, []);
    adj.get(a)!.push({ to: b, d });
    adj.get(b)!.push({ to: a, d });
  }
  return adj;
}

const ADJ = buildAdjacency();

/**
 * Dijkstra 最短路径
 * @returns { distance, path } — path 包含起始和终止节点 id
 */
export function shortestPath(
  from: string,
  to: string
): { distance: number; path: string[] } {
  const dist_map = new Map<string, number>();
  const prev = new Map<string, string | null>();
  const visited = new Set<string>();

  for (const id of Object.keys(GRAPH_NODES)) {
    dist_map.set(id, Infinity);
    prev.set(id, null);
  }
  dist_map.set(from, 0);

  // 简单优先队列（节点少，暴力扫描即可）
  while (true) {
    let u: string | null = null;
    let best = Infinity;
    dist_map.forEach((d, id) => {
      if (!visited.has(id) && d < best) { best = d; u = id; }
    });
    if (u === null || u === to) break;
    visited.add(u);
    for (const { to: v, d } of ADJ.get(u) ?? []) {
      const alt = dist_map.get(u)! + d;
      if (alt < dist_map.get(v)!) {
        dist_map.set(v, alt);
        prev.set(v, u);
      }
    }
  }

  // 回溯路径
  const path: string[] = [];
  let cur: string | null = to;
  while (cur) { path.unshift(cur); cur = prev.get(cur) ?? null; }
  const total = dist_map.get(to) ?? Infinity;
  return { distance: total, path };
}

/**
 * 计算有序点位序列的总步行距离和各段距离
 */
export function routeStats(spotIds: string[]): {
  totalDistM: number;
  segments: Array<{ from: string; to: string; distM: number }>;
  estimatedMinutes: number;
} {
  const segments: Array<{ from: string; to: string; distM: number }> = [];
  let totalDistM = 0;
  for (let i = 0; i < spotIds.length - 1; i++) {
    const { distance } = shortestPath(spotIds[i], spotIds[i + 1]);
    segments.push({ from: spotIds[i], to: spotIds[i + 1], distM: distance });
    totalDistM += distance;
  }
  const estimatedMinutes = Math.round(totalDistM / 72); // 步速 1.2 m/s ≈ 72 m/min
  return { totalDistM, segments, estimatedMinutes };
}

/**
 * 最近邻贪心算法（用于"自动规划"按钮）
 * 从 startId 出发，依次选择最近未访问节点，以 endId 结尾
 */
export function nearestNeighborRoute(
  spotIds: string[],
  startId?: string,
  endId?: string
): string[] {
  if (spotIds.length <= 2) return spotIds;
  const fixed_start = startId && spotIds.includes(startId) ? startId : spotIds[0];
  const fixed_end   = endId   && spotIds.includes(endId)   && endId !== fixed_start
    ? endId : null;

  const middle = spotIds.filter(
    (id) => id !== fixed_start && id !== fixed_end
  );

  const ordered: string[] = [fixed_start];
  const remaining = [...middle];

  while (remaining.length > 0) {
    const current = ordered[ordered.length - 1];
    let bestIdx = 0;
    let bestDist = Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const { distance } = shortestPath(current, remaining[i]);
      if (distance < bestDist) { bestDist = distance; bestIdx = i; }
    }
    ordered.push(remaining[bestIdx]);
    remaining.splice(bestIdx, 1);
  }

  if (fixed_end) ordered.push(fixed_end);
  return ordered;
}

/**
 * 根据路径节点列表获取地图上的折线坐标串（供 SVG polyline 使用）
 * 返回 "x1,y1 x2,y2 ..." 格式
 */
export function pathToPolyline(path: string[]): string {
  return path
    .map((id) => {
      const n = GRAPH_NODES[id];
      return n ? `${n.x},${n.y}` : null;
    })
    .filter(Boolean)
    .join(" ");
}
