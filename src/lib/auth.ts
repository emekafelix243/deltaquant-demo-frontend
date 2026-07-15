// src/lib/auth.ts
const TOKEN_KEY = "token";
const USER_KEY = "user";

const getStorage = () => {
  if (typeof window === "undefined") return null;
  try {
    window.localStorage.setItem("test", "1");
    window.localStorage.removeItem("test");
    return window.localStorage;
  } catch {
    return window.sessionStorage;
  }
};

export const saveToken = (token: string) => {
  getStorage()?.setItem(TOKEN_KEY, token);
};

export const getToken = () => {
  if (typeof window === "undefined") return null;
  return getStorage()?.getItem(TOKEN_KEY) ?? null;
};

export const removeToken = () => {
  getStorage()?.removeItem(TOKEN_KEY);
};

export const saveUser = (user: object) => {
  getStorage()?.setItem(USER_KEY, JSON.stringify(user));
};

export const getUser = () => {
  if (typeof window === "undefined") return null;
  const user = getStorage()?.getItem(USER_KEY);
  return user ? JSON.parse(user) : null;
};

export const removeUser = () => {
  getStorage()?.removeItem(USER_KEY);
};

export const logout = () => {
  removeToken();
  removeUser();
  window.location.href = "/login";
};

export const isAuthenticated = () => {
  if (typeof window === "undefined") return false;
  return !!getStorage()?.getItem(TOKEN_KEY);
};
