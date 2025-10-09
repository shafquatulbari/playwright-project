import React, { useState } from "react";
import { useAuth } from "../AuthContext.jsx";

export function Register() {
  const { register } = useAuth();
  const [name, setName] = useState("Demo User");
  const [email, setEmail] = useState("user@example.com");
  const [password, setPassword] = useState("Password123!");
  const [error, setError] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await register(name, email, password);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <form onSubmit={onSubmit} aria-label="register-form">
      <div className="row">
        <input
          data-testid="register-name"
          placeholder="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div className="row" style={{ marginTop: 8 }}>
        <input
          data-testid="register-email"
          placeholder="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="row" style={{ marginTop: 8 }}>
        <input
          data-testid="register-password"
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
        <button data-testid="register-submit" type="submit">
          Create account
        </button>
      </div>
    </form>
  );
}
