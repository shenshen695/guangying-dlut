// 光影大工 Product V2：开发展示素材清单；正式发布前可按此字段逐项完成版权核验与替换。
export type CampusMedia = {
  id: string;
  src: string;
  alt: string;
  source: string;
  sourceUrl: string;
  attribution: string;
  usage: "official-demo";
};

const autumnSource = "https://news.dlut.edu.cn/info/1020/80042.htm";
const lakeSource = "https://news.dlut.edu.cn/info/1020/92404.htm";
const lakeCompletionSource = "https://jjc.dlut.edu.cn/info/1018/3286.htm";
const mainBuildingSource = "https://dangan.dlut.edu.cn/info/1025/1054.htm";

export const campusMedia: CampusMedia[] = [
  { id: "lake-wide", src: "/campus-v2/lingshui-lake-wide.jpg", alt: "凌水湖与环湖步道全景", source: "大连理工大学基建处", sourceUrl: lakeCompletionSource, attribution: "党委宣传部、新闻中心", usage: "official-demo" },
  { id: "lake-portrait", src: "/campus-v2/lingshui-portrait.jpg", alt: "凌水湖红桥与水面倒影", source: "大连理工大学新闻网", sourceUrl: lakeSource, attribution: "郭雅琦、曹德泉、张辉等（原文组图）", usage: "official-demo" },
  { id: "lake-golden", src: "/campus-v2/lingshui-golden.jpg", alt: "夕阳下的凌水湖红桥与校园摄影", source: "大连理工大学新闻网", sourceUrl: lakeSource, attribution: "郭雅琦、曹德泉、张辉等（原文组图）", usage: "official-demo" },
  { id: "main-building", src: "/campus-v2/main-building.jpg", alt: "大连理工大学主楼与广场全景", source: "大连理工大学档案馆（校史馆）", sourceUrl: mainBuildingSource, attribution: "大连理工大学档案馆（校史馆）", usage: "official-demo" },
  { id: "autumn-walk", src: "/campus-v2/campus-autumn-walk.jpg", alt: "大工校园秋日银杏路", source: "大连理工大学新闻网", sourceUrl: autumnSource, attribution: "余琴健、刘芸松、曹德泉等（原文组图）", usage: "official-demo" },
  { id: "autumn-light", src: "/campus-v2/campus-autumn-light.jpg", alt: "银杏树与校园建筑细节", source: "大连理工大学新闻网", sourceUrl: autumnSource, attribution: "余琴健、刘芸松、曹德泉等（原文组图）", usage: "official-demo" },
  { id: "shuyang-road", src: "/campus-v2/campus-shuyang-road.jpg", alt: "大工书阳路秋景", source: "大连理工大学新闻网", sourceUrl: autumnSource, attribution: "余琴健、刘芸松、曹德泉等（原文组图）", usage: "official-demo" },
  { id: "campus-life", src: "/campus-v2/campus-life.jpg", alt: "秋日校园里的学生", source: "大连理工大学新闻网", sourceUrl: autumnSource, attribution: "余琴健、刘芸松、曹德泉等（原文组图）", usage: "official-demo" },
];

export function getCampusMedia(id: string) {
  return campusMedia.find((item) => item.id === id) || campusMedia[0];
}

export const spotMedia: Record<string, string> = {
  "ling-shui-lake": "lake-wide",
  "main-building": "main-building",
  "south-gate": "shuyang-road",
  bochuan: "autumn-light",
  "first-building": "campus-life",
  "flower-wall": "lake-golden",
};
