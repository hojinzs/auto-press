import assert from "node:assert/strict";
import test from "node:test";
import siteProfileModule from "../lib/site-profile.ts";
import {
  isInsufficientDataProfile,
  normalizeProfileDataInput,
} from "./profiling.ts";

const {
  buildProfileDataFromForm,
  createEmptyTopicForm,
  createProfileEditorFormState,
  getEditableProfileData,
} = siteProfileModule;

test("normalizeProfileDataInput trims text and normalizes topic frequency", () => {
  const profile = normalizeProfileDataInput({
    brand_voice: {
      tone: " 친근한 ",
      style: " 대화형 ",
      characteristics: [" 실용적 ", "명확함"],
    },
    topics: [
      {
        name: " 자동화 ",
        frequency: "75",
        description: " 워크플로우 ",
      },
    ],
    reader_persona: {
      demographics: " 마케터 ",
      interests: "AI, 자동화",
      expertise_level: " 중급 ",
    },
    content_patterns: {
      average_length: "1800",
      common_structures: "리스트형, 튜토리얼",
      media_usage: " 이미지 중심 ",
    },
  });

  assert.deepEqual(profile, {
    brand_voice: {
      tone: "친근한",
      style: "대화형",
      characteristics: ["실용적", "명확함"],
    },
    topics: [{ name: "자동화", frequency: 0.75, description: "워크플로우" }],
    reader_persona: {
      demographics: "마케터",
      interests: ["AI", "자동화"],
      expertise_level: "중급",
    },
    content_patterns: {
      average_length: 1800,
      common_structures: ["리스트형", "튜토리얼"],
      media_usage: "이미지 중심",
    },
  });
});

test("normalizeProfileDataInput rejects missing required fields", () => {
  assert.throws(
    () =>
      normalizeProfileDataInput({
        brand_voice: {
          tone: "",
          style: "설명형",
          characteristics: [],
        },
        topics: [],
        reader_persona: {
          demographics: "",
          interests: [],
          expertise_level: "초급",
        },
        content_patterns: {
          average_length: 0,
          common_structures: [],
          media_usage: "",
        },
      }),
    /비워둘 수 없습니다|최소 1개 이상 필요합니다|1 이상이어야 합니다/,
  );
});

test("isInsufficientDataProfile identifies insufficient profiles", () => {
  assert.equal(
    isInsufficientDataProfile({
      status: "insufficient_data",
      message: "게시글이 부족합니다.",
    }),
    true,
  );

  assert.equal(
    isInsufficientDataProfile({
      brand_voice: {
        tone: "전문적",
        style: "간결함",
        characteristics: [],
      },
    }),
    false,
  );
});

test("buildProfileDataFromForm round-trips profile editor state", () => {
  const source = {
    brand_voice: {
      tone: "신뢰감 있는",
      style: "분석형",
      characteristics: ["근거 중심", "간결함"],
    },
    topics: [{ name: "데이터", frequency: 0.4, description: "사례 소개" }],
    reader_persona: {
      demographics: "실무자",
      interests: ["자동화", "분석"],
      expertise_level: "중급",
    },
    content_patterns: {
      average_length: 1500,
      common_structures: ["가이드", "체크리스트"],
      media_usage: "스크린샷 포함",
    },
  };

  const rebuilt = buildProfileDataFromForm(createProfileEditorFormState(source));

  assert.deepEqual(rebuilt, source);
});

test("buildProfileDataFromForm rejects empty required sections", () => {
  assert.throws(
    () =>
      buildProfileDataFromForm({
        tone: "전문적",
        style: "해설형",
        characteristics: "",
        topics: [createEmptyTopicForm()],
        demographics: "",
        interests: "",
        expertiseLevel: "초급",
        averageLength: "1200",
        commonStructures: "",
        mediaUsage: "텍스트 중심",
      }),
    /비워둘 수 없습니다|최소 1개 이상 필요합니다/,
  );
});

test("getEditableProfileData returns null for insufficient profiles", () => {
  assert.equal(
    getEditableProfileData({
      status: "insufficient_data",
      message: "게시글이 부족합니다.",
    }),
    null,
  );
});
