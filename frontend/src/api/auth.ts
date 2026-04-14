import { requestJson } from "../utils/request";

export interface UserProfile {
  id: string;
  account: string;
  userName: string;
  city: string;
  age: number | null;
  targetRole: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  token: string;
  user: UserProfile;
}

export interface RegisterPayload {
  account: string;
  password: string;
  userName?: string;
  city?: string;
  age?: number | null;
  targetRole?: string;
}

export interface LoginPayload {
  account: string;
  password: string;
}

export interface UpdateProfilePayload {
  userName?: string;
  city?: string;
  age?: number | null;
  targetRole?: string;
}

function withAuth(token: string) {
  return {
    Authorization: `Bearer ${token}`
  };
}

export function registerUser(baseUrl: string, payload: RegisterPayload) {
  return requestJson<AuthResponse>(baseUrl, "/users/register", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function loginUser(baseUrl: string, payload: LoginPayload) {
  return requestJson<AuthResponse>(baseUrl, "/users/login", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function logoutUser(baseUrl: string, token: string) {
  return requestJson<{ success: boolean }>(baseUrl, "/users/logout", {
    method: "POST",
    headers: withAuth(token)
  });
}

export function fetchCurrentUser(baseUrl: string, token: string) {
  return requestJson<UserProfile>(baseUrl, "/users/me", {
    headers: withAuth(token)
  });
}

export function updateCurrentUser(baseUrl: string, token: string, payload: UpdateProfilePayload) {
  return requestJson<UserProfile>(baseUrl, "/users/me", {
    method: "PATCH",
    headers: withAuth(token),
    body: JSON.stringify(payload)
  });
}

