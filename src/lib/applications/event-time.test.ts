import assert from "node:assert/strict";
import test from "node:test";
import {
  hoursUntilEvent,
  isEventPast,
  isWithinHours,
  parseEventStart,
} from "./event-time";

test("parseEventStart reads rentalStart ISO", () => {
  const date = parseEventStart({
    rentalStart: "2026-11-22T18:30",
    rentalDate: null,
    rentalTime: null,
    sessionLabel: null,
    sessionCustom: null,
  });
  assert.ok(date);
  assert.equal(date!.getFullYear(), 2026);
  assert.equal(date!.getMonth(), 10);
  assert.equal(date!.getDate(), 22);
  assert.equal(date!.getHours(), 18);
  assert.equal(date!.getMinutes(), 30);
});

test("parseEventStart reads rentalDate + rentalTime", () => {
  const date = parseEventStart({
    rentalStart: null,
    rentalDate: "2026-12-01",
    rentalTime: "14:00",
    sessionLabel: null,
    sessionCustom: null,
  });
  assert.ok(date);
  assert.equal(date!.getDate(), 1);
  assert.equal(date!.getHours(), 14);
});

test("parseEventStart reads session label dd.mm.yyyy", () => {
  const date = parseEventStart({
    rentalStart: null,
    rentalDate: null,
    rentalTime: null,
    sessionLabel: "Сеанс 15.03.2027 20:15 IMAX",
    sessionCustom: null,
  });
  assert.ok(date);
  assert.equal(date!.getFullYear(), 2027);
  assert.equal(date!.getMonth(), 2);
  assert.equal(date!.getDate(), 15);
  assert.equal(date!.getHours(), 20);
  assert.equal(date!.getMinutes(), 15);
});

test("isEventPast and isWithinHours", () => {
  const now = new Date(2026, 10, 20, 12, 0, 0);
  const soon = {
    rentalStart: "2026-11-22T10:00",
    rentalDate: null,
    rentalTime: null,
    sessionLabel: null,
    sessionCustom: null,
  };
  const past = {
    rentalStart: "2026-11-19T10:00",
    rentalDate: null,
    rentalTime: null,
    sessionLabel: null,
    sessionCustom: null,
  };
  assert.equal(isEventPast(past, now), true);
  assert.equal(isEventPast(soon, now), false);
  assert.equal(isWithinHours(soon, 72, now), true);
  assert.equal(isWithinHours(soon, 24, now), false);
  const until = hoursUntilEvent(soon, now);
  assert.ok(until != null && until > 40 && until < 50);
});
