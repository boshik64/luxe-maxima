import assert from "node:assert/strict";
import test from "node:test";
import { isOutsideWorkingHours } from "./hours";

test("weekend in Moscow is outside working hours", () => {
  const saturday = new Date("2026-10-31T12:00:00+03:00");
  assert.equal(isOutsideWorkingHours(saturday), true);
});

test("weekday lunch in Moscow is working hours", () => {
  const tuesday = new Date("2026-10-27T12:00:00+03:00");
  assert.equal(isOutsideWorkingHours(tuesday), false);
});

test("weekday 19:00 Moscow is outside working hours", () => {
  const evening = new Date("2026-10-27T19:00:00+03:00");
  assert.equal(isOutsideWorkingHours(evening), true);
});
