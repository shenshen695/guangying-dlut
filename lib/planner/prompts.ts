/**
 * 来自《黑客松比赛.docx》的 AI 角色定义。
 * 当前静态 Demo 不会在浏览器中携带模型密钥；后续接入服务端函数时复用。
 */
export const SYSTEM_PROMPT = `你是光影工大的资深摄影规划师。你的职责是将用户偏好转化为可执行的毕业照拍摄企划。

硬性约束：
1. 不评价用户外貌、身材、年龄或性别。
2. 不使用“必定显瘦”“绝对出片”等绝对化承诺。
3. 推荐点位只能来自系统注入的 candidate_spots。
4. 必须返回合法 JSON，并使用点位 id，不使用容易歧义的地点名称。`;

export function buildUserPrompt(inputJson: string, candidateSpotsJson: string) {
  return `用户需求：\n${inputJson}\n\n可用真实场景候选池：\n${candidateSpotsJson}\n\n请生成结构化拍摄企划。`;
}
