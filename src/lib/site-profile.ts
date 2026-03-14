import type {
  ProfileData,
  ProfileTopic,
  SiteProfileData,
} from "../types/profiling";
import {
  isInsufficientDataProfile,
  normalizeProfileDataInput,
} from "../types/profiling";

export interface ProfileTopicForm {
  name: string;
  frequency: string;
  description: string;
}

export interface ProfileEditorFormState {
  tone: string;
  style: string;
  characteristics: string;
  topics: ProfileTopicForm[];
  demographics: string;
  interests: string;
  expertiseLevel: string;
  averageLength: string;
  commonStructures: string;
  mediaUsage: string;
}

export function createEmptyTopicForm(): ProfileTopicForm {
  return {
    name: "",
    frequency: "",
    description: "",
  };
}

export function createProfileEditorFormState(
  profileData: ProfileData,
): ProfileEditorFormState {
  return {
    tone: profileData.brand_voice.tone,
    style: profileData.brand_voice.style,
    characteristics: profileData.brand_voice.characteristics.join(", "),
    topics:
      profileData.topics.length > 0
        ? profileData.topics.map((topic) => ({
            name: topic.name,
            frequency: String(Math.round(topic.frequency * 100)),
            description: topic.description,
          }))
        : [createEmptyTopicForm()],
    demographics: profileData.reader_persona.demographics,
    interests: profileData.reader_persona.interests.join(", "),
    expertiseLevel: profileData.reader_persona.expertise_level,
    averageLength: String(profileData.content_patterns.average_length),
    commonStructures: profileData.content_patterns.common_structures.join(", "),
    mediaUsage: profileData.content_patterns.media_usage,
  };
}

function parseList(value: string) {
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeTopic(topic: ProfileTopicForm): ProfileTopic | null {
  const name = topic.name.trim();
  const description = topic.description.trim();
  const frequencyRaw = Number.parseFloat(topic.frequency);

  if (!name && !description && !topic.frequency.trim()) {
    return null;
  }

  if (!name || !Number.isFinite(frequencyRaw)) {
    throw new Error("주제 이름과 빈도를 올바르게 입력해주세요.");
  }

  return {
    name,
    frequency: Math.max(0, Math.min(100, frequencyRaw)) / 100,
    description,
  };
}

export function buildProfileDataFromForm(
  form: ProfileEditorFormState,
): ProfileData {
  const topics = form.topics
    .map((topic) => normalizeTopic(topic))
    .filter((topic): topic is ProfileTopic => topic !== null);

  return normalizeProfileDataInput({
    brand_voice: {
      tone: form.tone,
      style: form.style,
      characteristics: parseList(form.characteristics),
    },
    topics,
    reader_persona: {
      demographics: form.demographics,
      interests: parseList(form.interests),
      expertise_level: form.expertiseLevel,
    },
    content_patterns: {
      average_length: form.averageLength,
      common_structures: parseList(form.commonStructures),
      media_usage: form.mediaUsage,
    },
  });
}

export function getEditableProfileData(
  profileData: SiteProfileData | null | undefined,
): ProfileData | null {
  if (!profileData || isInsufficientDataProfile(profileData)) {
    return null;
  }

  return normalizeProfileDataInput(profileData);
}

const siteProfileModule = {
  buildProfileDataFromForm,
  createEmptyTopicForm,
  createProfileEditorFormState,
  getEditableProfileData,
};

export default siteProfileModule;
