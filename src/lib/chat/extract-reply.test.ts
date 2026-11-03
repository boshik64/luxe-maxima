import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { extractLatestReply } from "@/lib/chat/extract-reply";

describe("extractLatestReply", () => {
  it("keeps only Gmail RU reply above quoted thread", () => {
    const raw = `жжжжж

вт, 3 нояб. 2026 г. в 22:40, <karoevent@karofilm.ru>:

> Эй тест -- Ищенко Влад Админ
> Заявка KM-291
`;
    assert.equal(extractLatestReply(raw), "жжжжж");
  });

  it("keeps Gmail EN reply", () => {
    const raw = `hello there

On Tue, Nov 3, 2026 at 10:40 PM Vlad <karoevent@karofilm.ru> wrote:

> previous
`;
    assert.equal(extractLatestReply(raw), "hello there");
  });

  it("stops at > quotes without header", () => {
    const raw = `новый ответ

> старое
> ещё
`;
    assert.equal(extractLatestReply(raw), "новый ответ");
  });

  it("returns full text when there is no quote", () => {
    assert.equal(extractLatestReply("просто текст"), "просто текст");
  });
});
