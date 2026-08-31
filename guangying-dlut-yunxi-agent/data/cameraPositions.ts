import type { CameraPosition } from "@/types/camera-position";

// 第二轮移动端修正：凌水湖第一版空间机位为可替换的演示数据，不修改 Spot 经纬度。
export const lingshuiCameraPositions: CameraPosition[] = [
  { id: "lake-west", spotId: "ling-shui-lake", label: "A", name: "湖岸西侧", cameraPosition: "西侧亲水步道", cameraDirection: "朝东北", directionDegrees: -40, sceneX: 19, sceneY: 62, recommendedTime: "16:00–18:00", tags: ["日落倒影", "人像"], sampleWorkIds: ["demo-lake-portrait"], photographer: null, focalLength: "50–85mm", tips: "中长焦压缩湖面与背景建筑，人物站在岸线内侧保留水面反光。" },
  { id: "lake-bridge", spotId: "ling-shui-lake", label: "B", name: "红桥附近", cameraPosition: "桥头南侧开阔处", cameraDirection: "朝西北", directionDegrees: -145, sceneX: 68, sceneY: 38, recommendedTime: "15:30–17:30", tags: ["毕业照", "环境人像"], sampleWorkIds: ["demo-lake-portrait"], photographer: null, focalLength: "35–50mm", tips: "让桥成为画面纵深，不要站在通行正中；先拍全身，再靠近补半身互动。" },
  { id: "lake-lawn", spotId: "ling-shui-lake", label: "C", name: "湖岸开阔草地", cameraPosition: "东南侧草地边缘", cameraDirection: "朝西", directionDegrees: 180, sceneX: 78, sceneY: 73, recommendedTime: "16:00–18:00", tags: ["校园环境", "多人合影"], sampleWorkIds: ["demo-lake-portrait"], photographer: null, focalLength: "24–35mm", tips: "低机位带入草地前景，人物与湖岸保持距离，适合三至六人的松散站位。" },
];
