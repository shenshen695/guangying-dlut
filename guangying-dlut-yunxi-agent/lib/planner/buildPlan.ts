import type { PlannerInput, ShootingPlan, StyleReference } from "@/types/planner";
import type { Spot } from "@/types/spot";
import { inferStyle, retrieveCandidates } from "@/lib/planner/retrieveCandidates";

const styleGuide: Record<StyleReference, Pick<ShootingPlan, "colorPalette" | "actions"> & { reason: string }> = {
  海风清透: {
    reason: "明亮自然的环境与浅色服装更容易形成轻盈、清爽的毕业氛围。",
    colorPalette: ["白色", "浅蓝", "低饱和绿"],
    actions: ["沿路线自然慢走", "回头看向同伴", "利用逆光拍轻松侧影"],
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
