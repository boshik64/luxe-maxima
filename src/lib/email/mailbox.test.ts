import assert from "node:assert/strict";
import test from "node:test";
import { checkMailbox, isNullMx } from "./mailbox";

test("rejects reserved and placeholder mailboxes", async () => {
  assert.match((await checkMailbox("ivan@example.com")) ?? "", /существующ/i);
  assert.match((await checkMailbox("a@foo.test")) ?? "", /существующ/i);
});

test("rejects common domain typos with a hint", async () => {
  const message = await checkMailbox("ivan@gmial.com");
  assert.match(message ?? "", /gmail\.com/);
});

test("rejects disposable mailboxes", async () => {
  const message = await checkMailbox("bot@mailinator.com");
  assert.match(message ?? "", /постоянный/i);
});

test("treats RFC 7505 null MX as no mail", () => {
  assert.equal(isNullMx("."), true);
  assert.equal(isNullMx(""), true);
  assert.equal(isNullMx("mx.yandex.net."), false);
});
