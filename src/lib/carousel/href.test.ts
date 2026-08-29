import assert from "node:assert/strict";
import test from "node:test";
import {
  CarouselHrefError,
  isExternalCarouselHref,
  normalizeCarouselHref,
} from "./types";

test("defaults empty href to the application form", () => {
  assert.equal(normalizeCarouselHref(""), "#form");
  assert.equal(normalizeCarouselHref("   "), "#form");
});

test("keeps internal hashes and site paths", () => {
  assert.equal(normalizeCarouselHref("#products"), "#products");
  assert.equal(normalizeCarouselHref("/keys#form"), "/keys#form");
  assert.equal(normalizeCarouselHref("event"), "/event");
});

test("normalizes external urls", () => {
  assert.equal(
    normalizeCarouselHref("https://karofilm.ru/promo"),
    "https://karofilm.ru/promo",
  );
  assert.equal(normalizeCarouselHref("karofilm.ru/promo"), "https://karofilm.ru/promo");
  assert.equal(isExternalCarouselHref("https://karofilm.ru"), true);
  assert.equal(isExternalCarouselHref("#form"), false);
});

test("rejects unsafe protocols", () => {
  assert.throws(() => normalizeCarouselHref("javascript:alert(1)"), CarouselHrefError);
});
