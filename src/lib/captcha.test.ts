import assert from "node:assert/strict";
import test from "node:test";
import {
  hashCaptchaProof,
  issueCaptcha,
  proofPrefix,
  solveCaptchaProof,
  solveIssuedCaptcha,
  verifyCaptcha,
} from "./captcha";

test("issues a captcha that a correct proof unlocks once", () => {
  const { token, difficulty } = issueCaptcha(2);
  const proof = solveCaptchaProof(token, difficulty);
  assert.equal(hashCaptchaProof(token, proof).startsWith(proofPrefix(difficulty)), true);
  assert.equal(verifyCaptcha(token, proof).ok, true);
  assert.equal(verifyCaptcha(token, proof).ok, false);
});

test("rejects a missing or wrong captcha proof", () => {
  const { token } = issueCaptcha(2);
  assert.equal(verifyCaptcha(token, "0").ok, false);
  assert.equal(verifyCaptcha(undefined, undefined).ok, false);
});

test("solves an issued captcha on the server", () => {
  const { token, difficulty } = issueCaptcha(2);
  const proof = solveIssuedCaptcha(token);
  assert.ok(proof);
  assert.equal(
    hashCaptchaProof(token, proof).startsWith(proofPrefix(difficulty)),
    true,
  );
});
