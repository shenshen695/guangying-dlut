import assert from "node:assert/strict";
import test from "node:test";
import { parsePeopleCount } from "./people";

test("识别用户明确写出的人数", () => {
  const cases: Array<[string, number]> = [
    ["我有三个人，我想拍毕业照", 3],
    ["我们3个人今晚想去凌水湖拍照", 3],
    ["我们三个拍毕业照", 3],
    ["两个人拍情侣照", 2],
    ["俩人拍校园写真", 2],
    ["我一个人拍写真", 1],
    ["十个人拍毕业照", 10],
    ["我和两个朋友去拍毕业照", 3],
    ["我和3个朋友今晚拍照", 4],
    ["我和五个朋友拍毕业照", 6],
  ];
  cases.forEach(([prompt, expected]) => assert.equal(parsePeopleCount(prompt), expected));
});

test("未说明人数时保持待确认", () => {
  assert.equal(parsePeopleCount("今晚想拍凌水湖日落"), null);
});
