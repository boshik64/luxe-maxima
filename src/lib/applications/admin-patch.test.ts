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

test("admin patch accepts paid and managerId", () => {
  const parsed = applicationAdminPatchSchema.safeParse({
    paid: true,
    managerId: "550e8400-e29b-41d4-a716-446655440000",
  });
  assert.equal(parsed.success, true);
  if (parsed.success) {
    assert.equal(parsed.data.paid, true);
    assert.equal(parsed.data.managerId, "550e8400-e29b-41d4-a716-446655440000");
  }
});

test("admin patch allows clearing manager", () => {
  const parsed = applicationAdminPatchSchema.safeParse({ managerId: null });
  assert.equal(parsed.success, true);
  if (parsed.success) assert.equal(parsed.data.managerId, null);
});
