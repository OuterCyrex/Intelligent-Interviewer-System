import { ref, watch } from "vue";
import { defineStore } from "pinia";

export interface UserProfile {
  age: number | null;
  city: string;
  curiosity: number;
  techStacks: string;
  targetRole: string;
}

const PROFILE_KEY = "intervene_user_profile";

function loadProfile(): UserProfile {
  const raw = localStorage.getItem(PROFILE_KEY);
  if (!raw) {
    return {
      age: null,
      city: "上海",
      curiosity: 7,
      techStacks: "Java, Spring Boot, MySQL",
      targetRole: "Java 后端工程师"
    };
  }

  try {
    const parsed = JSON.parse(raw) as Partial<UserProfile>;
    return {
      age: typeof parsed.age === "number" ? parsed.age : null,
      city: typeof parsed.city === "string" ? parsed.city : "",
      curiosity: typeof parsed.curiosity === "number" ? parsed.curiosity : 7,
      techStacks: typeof parsed.techStacks === "string" ? parsed.techStacks : "",
      targetRole: typeof parsed.targetRole === "string" ? parsed.targetRole : ""
    };
  } catch {
    return {
      age: null,
      city: "",
      curiosity: 7,
      techStacks: "",
      targetRole: ""
    };
  }
}

export const useProfileStore = defineStore("profile", () => {
  const profile = ref<UserProfile>(loadProfile());

  watch(
    profile,
    (value) => {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(value));
    },
    { deep: true }
  );

  function updateProfile(next: Partial<UserProfile>) {
    profile.value = {
      ...profile.value,
      ...next
    };
  }

  return {
    profile,
    updateProfile
  };
});
