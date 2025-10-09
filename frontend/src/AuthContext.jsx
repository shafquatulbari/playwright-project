import React, { createContext, useContext, useEffect, useState } from "react";
import { api, setToken, getToken } from "./lib/api.js";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const t = getToken();
    if (!t) return;
    // No user endpoint; keep minimal state
    setUser({ token: t });
  }, []);

  const login = async (email, password) => {
    const { token, user } = await api.login({ email, password });
    setToken(token);
    setUser(user);
  };

  const register = async (name, email, password) => {
    const { token, user } = await api.register({ name, email, password });
    setToken(token);
    setUser(user);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  return (
    <AuthCtx.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
