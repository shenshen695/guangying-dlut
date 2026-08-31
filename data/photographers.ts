import type { Photographer } from "@/types/photographer";

// 固定虚拟账号仅用于验证作品归属、关注和主页链路，不对应照片中的人物或现实摄影师。
export const photographers: Photographer[] = [
  { id: "light-walker", nickname: "光影旅人", handle: "@lightwalker", avatar: "/photography/lake-couple.jpg", cover: "/photography/lovers-road.jpg", intro: "沿着校园里的水面和树影，记录自然发生的瞬间。", location: "大连理工大学", styleTags: ["湖边", "纪实", "人像"], workIds: ["lake-couple", "lovers-road", "flower-wall"], worksCount: 56, followers: 1280, following: 342, isFollowing: false, isPrototype: true },
  { id: "campus-frame", nickname: "校园取景框", handle: "@campusframe", avatar: "/photography/south-gate-graduates.jpg", cover: "/photography/south-gate-graduates.jpg", intro: "毕业季与校园地标长期记录。", location: "大连理工大学", styleTags: ["校园风光", "毕业照", "青春"], workIds: ["south-gate", "lingxi-library", "student-center"], worksCount: 48, followers: 968, following: 218, isFollowing: true, isPrototype: true },
  { id: "flower-and-light", nickname: "花与光", handle: "@flowerlight", avatar: "/photography/bochuan-flowers.jpg", cover: "/photography/ginkgo-portrait.jpg", intro: "喜欢花期、逆光与安静的人像。", location: "大连理工大学", styleTags: ["人像", "秋景", "暖光"], workIds: ["bochuan-flowers", "magnolia", "ginkgo-portrait"], worksCount: 42, followers: 1532, following: 196, isFollowing: false, isPrototype: true },
  { id: "winter-note", nickname: "北风手记", handle: "@northwindnote", avatar: "/photography/winter-portrait.jpg", cover: "/photography/winter-portrait.jpg", intro: "记录北方校园的雪、风和低饱和色彩。", location: "大连理工大学", styleTags: ["校园风光", "人像", "氛围"], workIds: ["winter-portrait", "second-building", "building-lawn"], worksCount: 35, followers: 744, following: 151, isFollowing: false, isPrototype: true },
  { id: "line-observer", nickname: "线条观察者", handle: "@lineobserver", avatar: "/photography/glass-corridor.jpg", cover: "/photography/glass-corridor.jpg", intro: "从建筑秩序中寻找人物与光线的位置。", location: "大连理工大学", styleTags: ["建筑", "校园风光", "构图"], workIds: ["glass-corridor", "bochuan-interior", "management"], worksCount: 62, followers: 1106, following: 284, isFollowing: true, isPrototype: true },
  { id: "field-diary", nickname: "操场日记", handle: "@fielddiary", avatar: "/photography/stadium-jump.jpg", cover: "/photography/stadium-jump.jpg", intro: "把奔跑、跳跃和下课后的风留在画面里。", location: "大连理工大学", styleTags: ["校园风光", "人像", "抓拍"], workIds: ["stadium-jump", "stadium-graduate", "classroom"], worksCount: 39, followers: 892, following: 175, isFollowing: false, isPrototype: true },
  { id: "graduation-lens", nickname: "毕业镜头", handle: "@graduationlens", avatar: "/photography/lawn-graduate.jpg", cover: "/photography/lawn-rest.jpg", intro: "专注毕业季的轻松合影与个人肖像。", location: "大连理工大学", styleTags: ["人像", "校园风光", "毕业照"], workIds: ["lawn-graduate", "lawn-rest", "lawn-male"], worksCount: 71, followers: 1874, following: 306, isFollowing: true, isPrototype: true },
  { id: "green-hour", nickname: "青绿时刻", handle: "@greenhour", avatar: "/photography/naval-lawn.jpg", cover: "/photography/naval-lawn.jpg", intro: "关注校园里的草地、树荫和轻盈动作。", location: "大连理工大学", styleTags: ["校园风光", "秋景", "抓拍"], workIds: ["naval-lawn"], worksCount: 28, followers: 621, following: 126, isFollowing: false, isPrototype: true },
];

export function getPhotographer(id: string) {
  return photographers.find((photographer) => photographer.id === id);
}
