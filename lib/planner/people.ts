const chineseDigits: Record<string, number> = {
  一: 1,
  二: 2,
  两: 2,
  俩: 2,
  三: 3,
  四: 4,
  五: 5,
  六: 6,
  七: 7,
  八: 8,
  九: 9,
  十: 10,
};

// 第二轮移动端修正：用户明确写出的人数永远优先于拍摄类型推断。
export function parsePeopleCount(text: string): number | null {
  const friendsNumeric = text.match(/我\s*和\s*(\d{1,2})\s*个?朋友/);
  if (friendsNumeric) return Number(friendsNumeric[1]) + 1;

  const friendsChinese = text.match(/我\s*和\s*([一二两俩三四五六七八九十])\s*个?朋友/);
  if (friendsChinese) return chineseDigits[friendsChinese[1]] + 1;

  const numeric = text.match(/(?:我们\s*)?(\d{1,2})\s*(?:个(?:人)?|人)/);
  if (numeric) return Number(numeric[1]);

  const chinese = text.match(/(?:我们\s*)?([一二两俩三四五六七八九十])\s*(?:个(?:人)?|人)/);
  if (chinese) return chineseDigits[chinese[1]];

  const friendsOnly = text.match(/(?:和|有)\s*([一二两俩三四五六七八九十])\s*个?朋友/);
  if (friendsOnly) return chineseDigits[friendsOnly[1]] + (text.includes("我") ? 1 : 0);

  if (text.includes("情侣")) return 2;
  if (text.includes("一个人") || text.includes("一人")) return 1;
  return null;
}
