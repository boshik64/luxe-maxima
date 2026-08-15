import assert from "node:assert/strict";
import test from "node:test";
import { applicationAdminPatchSchema } from "./admin-patch";

test("admin patch rejects garbage phone", () => {
  const parsed = applicationAdminPatchSchema.safeParse({ phone: "просто текст" });
  assert.equal(parsed.success, false);
});

test("admin patch normalizes a valid russian phone", () => {
  const parsed = applicationAdminPatchSchema.safeParse({
    phone: "8 900 123-45-67",
  });
  assert.equal(parsed.success, true);
  if (parsed.success) assert.equal(parsed.data.phone, "+79001234567");
});

test("admin patch rejects invalid email", () => {
  const parsed = applicationAdminPatchSchema.safeParse({ email: "not-an-email" });
  assert.equal(parsed.success, false);
});
