import type { PlannerInput, ShootingPlan, StyleReference } from "@/types/planner";
import type { Spot } from "@/types/spot";
import { inferStyle, retrieveCandidates } from "@/lib/planner/retrieveCandidates";

const styleGuide: Record<StyleReference, Pick<ShootingPlan, "colorPalette" | "actions"> & { reason: string }> = {
  海风清透: {
    reason: "明亮自然的环境与浅色服装更容易形成轻盈、清爽的毕业氛围。",
    colorPalette: ["白色", "浅蓝", "低饱和绿"],
    actions: ["沿路线自然慢走", "回头看向同伴", "利用逆光拍轻松侧影"],
  },
  清透自然: {
    reason: "柔和光线、浅色衣物和开阔点位可以让毕业照显得干净、轻松、不过度摆拍。",
    colorPalette: ["米白", "浅蓝", "薄荷绿"],
    actions: ["沿路线自然慢走", "在校门或湖边做开场全景", "保留同伴互动和回头瞬间"],
  },
  学院纪实: {
    reason: "建筑、课堂感和同伴互动能够保留最真实的校园记忆。",
    colorPalette: ["白色", "牛仔蓝", "卡其"],
    actions: ["并肩走过教学楼", "自然交谈抓拍", "在校名或建筑前完成合影"],
  },
  复古胶片: {
    reason: "旧建筑、长廊和暖色场景适合安静、有故事感的画面。",
    colorPalette: ["暖棕", "褪色红", "墨绿"],
    actions: ["利用墙面和长廊构图", "避免直视镜头的摆拍", "保留行走和回望动作"],
  },
  电影氛围: {
    reason: "黄昏光线与建筑线条能形成更强的远近层次和画面张力。",
    colorPalette: ["深蓝", "金色", "对比色"],
    actions: ["借建筑线条安排站位", "拍摄远景和人物剪影", "在黄昏光线下完成收尾"],
  },
  低饱和: {
    reason: "阴天、湖边和建筑线条适合压低色彩，让画面更安静，也更容易统一多人服装。",
    colorPalette: ["灰白", "雾蓝", "浅灰绿"],
    actions: ["选择湖边或建筑外立面", "减少跳色道具", "用侧影和远景制造留白"],
  },
  新中式: {
    reason: "石阶、门廊、树荫和低调色彩可以形成更含蓄的校园毕业纪念感。",
    colorPalette: ["月白", "墨绿", "黛灰"],
    actions: ["利用门廊和台阶构图", "动作保持安静克制", "用树影作为自然前景"],
  },
  Citywalk感: {
    reason: "校园漫步路线适合把毕业照拍成日常同行记录，减少站定摆拍。",
    colorPalette: ["白色", "牛仔蓝", "浅卡其"],
    actions: ["边走边拍抓拍", "保留同行交流", "在路线节点拍少量定格合影"],
  },
  多巴胺轻彩: {
    reason: "夏季、花墙和多人场景适合少量明快颜色，让画面活泼但不显杂乱。",
    colorPalette: ["浅黄", "天空蓝", "草绿"],
    actions: ["用花束或小道具做色彩点", "安排多人互动动作", "在花墙或开阔区域完成收尾"],
  },
};

export function buildShootingPlan(input: PlannerInput, spots: Spot[]): ShootingPlan {
  const style = inferStyle(input);
  const guide = styleGuide[style];
  const candidates = retrieveCandidates(input, spots);

  return {
    style,
    styleReason: input.styleReference ? guide.reason : `你没有指定风格，系统根据人数和时间推断为“${style}”。${guide.reason}`,
    selectedSpotIds: candidates.map((spot) => spot.id),
    colorPalette: guide.colorPalette,
    outfit: {
      inner: input.dressingColor.trim() || (input.hasAcademicGown ? "白色或浅色内搭" : "与主色调呼应的简洁上衣"),
      shoes: "便于步行的浅色鞋",
      accessory: input.peopleCount > 1 ? "统一色系花束或学院纪念物" : "简单花束或学位帽",
    },
    actions: guide.actions,
    avoid: ["高峰期长时间占用通道", "使用未经授权的人像或作品", "依赖绝对化出片承诺"],
    notice: input.indoorBackupNeeded && !candidates.some((spot) => spot.hasIndoorBackup)
      ? "当前候选路线缺少室内备选，请在拍摄前确认天气。"
      : "路线来自已录入的真实候选点位，具体机位请以现场安全和授权情况为准。",
  };
}
