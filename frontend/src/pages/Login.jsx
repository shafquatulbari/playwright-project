import React, { useState } from "react";
import { useAuth } from "../AuthContext.jsx";

export function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("user@example.com");
  const [password, setPassword] = useState("Password123!");
  const [error, setError] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <form onSubmit={onSubmit} aria-label="login-form">
      <div className="row">
        <input
          data-testid="login-email"
          placeholder="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="row" style={{ marginTop: 8 }}>
        <input
          data-testid="login-password"
          type="password"
          placeholder="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      {error && (
        <div
          role="alert"
          className="muted"
          style={{ color: "#ff6b6b", marginTop: 8 }}
        >
          {error}
        </div>
      )}
      <div className="row" style={{ marginTop: 12 }}>
        <button data-testid="login-submit" type="submit">
          Login
        </button>
      </div>
    </form>
  );
}
