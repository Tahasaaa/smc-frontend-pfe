import { apiRequest } from "./api";

const PROFILE_API_BASE_URL = "http://127.0.0.1:8004/api";

export type ProfileResponse = {
  created?: boolean;
  message?: string;
  profile: {
    id: number;
    username: string;
    email: string;
    full_name: string;
    role: string;
    timezone: string;
    avatar: string | null;
    avatar_url: string | null;
    created_at: string;
    updated_at: string;
  };
};

export type UpdateProfilePayload = {
  full_name?: string;
  timezone?: string;
};

export async function getMyProfile() {
  return apiRequest<ProfileResponse>("/profile/me/", {
    baseUrl: PROFILE_API_BASE_URL,
  });
}

export async function updateMyProfile(payload: UpdateProfilePayload) {
  return apiRequest<ProfileResponse>("/profile/me/", {
    method: "PUT",
    baseUrl: PROFILE_API_BASE_URL,
    body: payload,
  });
}

export async function uploadMyAvatar(file: File, token?: string) {
  const formData = new FormData();
  formData.append("avatar", file);

  const authToken =
    token || localStorage.getItem("access_token") || localStorage.getItem("token");

  const response = await fetch(`${PROFILE_API_BASE_URL}/profile/avatar/`, {
    method: "POST",
    headers: authToken
      ? {
          Authorization: `Bearer ${authToken}`,
        }
      : undefined,
    body: formData,
  });

  if (!response.ok) {
    let errorMessage = "Avatar upload failed.";

    try {
      const errorData = await response.json();
      errorMessage =
        errorData?.detail ||
        errorData?.avatar?.[0] ||
        errorData?.message ||
        errorMessage;
    } catch {
      // ignore
    }

    throw new Error(errorMessage);
  }

  return (await response.json()) as ProfileResponse;
}

export async function removeMyAvatar(token?: string) {
  const authToken =
    token || localStorage.getItem("access_token") || localStorage.getItem("token");

  const response = await fetch(`${PROFILE_API_BASE_URL}/profile/avatar/`, {
    method: "DELETE",
    headers: authToken
      ? {
          Authorization: `Bearer ${authToken}`,
        }
      : undefined,
  });

  if (!response.ok) {
    let errorMessage = "Avatar removal failed.";

    try {
      const errorData = await response.json();
      errorMessage =
        errorData?.detail ||
        errorData?.message ||
        errorMessage;
    } catch {
      // ignore
    }

    throw new Error(errorMessage);
  }

  return (await response.json()) as ProfileResponse;
}