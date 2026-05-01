import { apiRequest, AUTH_API_BASE_URL } from "./api";

export type LoginPayload = {
  email: string;
  password: string;
};

export type LoginResponse = {
  message: string;
  requires_verification: boolean;
  email: string;
};

export type VerifyCodePayload = {
  email: string;
  code: string;
};

export type VerifyCodeResponse = {
  token: string;
  user: {
    id: number;
    fullname: string;
    email: string;
    role: string;
    permissions: string[];
  };
};

export type ChangePasswordPayload = {
  current_password: string;
  new_password: string;
  confirm_password: string;
};

export type ChangePasswordResponse = {
  message: string;
};

export async function loginUser(payload: LoginPayload) {
  return apiRequest<LoginResponse>("/auth/login/", {
    method: "POST",
    body: payload,
    baseUrl: AUTH_API_BASE_URL,
  });
}

export async function verifyOtpCode(payload: VerifyCodePayload) {
  return apiRequest<VerifyCodeResponse>("/auth/verify-code/", {
    method: "POST",
    body: payload,
    baseUrl: AUTH_API_BASE_URL,
  });
}

export async function changePasswordUser(payload: ChangePasswordPayload) {
  return apiRequest<ChangePasswordResponse>("/auth/change-password/", {
    method: "POST",
    body: payload,
    baseUrl: AUTH_API_BASE_URL,
  });
}

export function saveAuthSession(data: VerifyCodeResponse) {
  localStorage.setItem("token", data.token);
  localStorage.setItem("user", JSON.stringify(data.user));
}

export function savePendingEmail(email: string) {
  localStorage.setItem("pending_verification_email", email);
}

export function getPendingEmail() {
  return localStorage.getItem("pending_verification_email");
}

export function clearPendingEmail() {
  localStorage.removeItem("pending_verification_email");
}

export function getToken() {
  return localStorage.getItem("token");
}

export function getStoredUser() {
  const raw = localStorage.getItem("user");
  return raw ? JSON.parse(raw) : null;
}

export function logoutUser() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("pending_verification_email");
}