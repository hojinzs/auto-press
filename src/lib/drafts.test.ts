import test from "node:test";
import assert from "node:assert/strict";
import {
  isDashboardActiveDraftStatus,
  isVisibleDraftStatus,
} from "./drafts";

test("visible drafts exclude only archived items", () => {
  assert.equal(isVisibleDraftStatus("draft"), true);
  assert.equal(isVisibleDraftStatus("scheduled"), true);
  assert.equal(isVisibleDraftStatus("published"), true);
  assert.equal(isVisibleDraftStatus("archived"), false);
});

test("dashboard active drafts exclude published and archived items", () => {
  assert.equal(isDashboardActiveDraftStatus("draft"), true);
  assert.equal(isDashboardActiveDraftStatus("scheduled"), true);
  assert.equal(isDashboardActiveDraftStatus("published"), false);
  assert.equal(isDashboardActiveDraftStatus("archived"), false);
});
