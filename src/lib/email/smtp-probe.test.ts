import assert from "node:assert/strict";
import test from "node:test";
import { classifySmtpRcpt } from "./smtp-probe";

test("treats 250 as an existing mailbox", () => {
  assert.equal(classifySmtpRcpt(250, "2.1.5 Ok"), "exists");
});

test("treats classic user-unknown codes as missing", () => {
  assert.equal(classifySmtpRcpt(550, "5.1.1 User unknown"), "missing");
  assert.equal(classifySmtpRcpt(553, "Requested action not taken"), "missing");
});

test("does not reject greylist or policy noise", () => {
  assert.equal(classifySmtpRcpt(450, "Greylisted"), "unknown");
  assert.equal(classifySmtpRcpt(550, "5.7.1 Relay denied"), "unknown");
});
