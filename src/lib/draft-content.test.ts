import assert from "node:assert/strict";
import test from "node:test";
import {
  extractPlainTextFromHtml,
  hasMeaningfulDraftHtml,
  normalizeDraftHtml,
  normalizeDraftLinkHref,
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

test("hasMeaningfulDraftHtml rejects plain text with angle brackets", () => {
  assert.equal(hasMeaningfulDraftHtml("1 < 2 > 0"), false);
});

test("normalizeDraftHtml strips unsafe link attributes", () => {
  assert.equal(
    normalizeDraftHtml(
      '<p><a href="javascript:alert(1)" onclick="alert(1)">위험</a><script>alert(1)</script></p>',
    ),
    '<p><a>위험</a></p>',
  );
});

test("normalizeDraftLinkHref only accepts safe protocols", () => {
  assert.equal(normalizeDraftLinkHref("https://example.com/post"), "https://example.com/post");
  assert.equal(normalizeDraftLinkHref("/posts/slug"), "/posts/slug");
  assert.equal(normalizeDraftLinkHref("javascript:alert(1)"), null);
  assert.equal(normalizeDraftLinkHref(" data:text/html,test"), null);
});
