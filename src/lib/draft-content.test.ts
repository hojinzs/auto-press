import assert from "node:assert/strict";
import test from "node:test";
import {
  extractPlainTextFromHtml,
  hasMeaningfulDraftHtml,
  normalizeDraftHtml,
} from "./draft-content";

test("normalizeDraftHtml trims surrounding whitespace", () => {
  assert.equal(normalizeDraftHtml("  <p>Hello</p>\n"), "<p>Hello</p>");
});

test("extractPlainTextFromHtml removes tags and spacing entities", () => {
  assert.equal(
    extractPlainTextFromHtml("<h2>제목</h2><p>본문&nbsp;<strong>강조</strong></p>"),
    "제목 본문 강조",
  );
});

test("hasMeaningfulDraftHtml rejects empty editor output", () => {
  assert.equal(hasMeaningfulDraftHtml(""), false);
  assert.equal(hasMeaningfulDraftHtml("<p></p>"), false);
  assert.equal(hasMeaningfulDraftHtml("<p><br></p>"), false);
});

test("hasMeaningfulDraftHtml accepts structured article markup", () => {
  assert.equal(
    hasMeaningfulDraftHtml("<h2>도입</h2><p>워드프레스용 본문입니다.</p><ul><li>핵심</li></ul>"),
    true,
  );
});
