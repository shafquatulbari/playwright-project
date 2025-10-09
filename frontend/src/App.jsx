import React, { useState } from "react";
import { AuthProvider, useAuth } from "./AuthContext.jsx";
import { Login } from "./pages/Login.jsx";
import { Register } from "./pages/Register.jsx";
import { Board } from "./pages/Board.jsx";

function AppInner() {
  const { user, logout } = useAuth();
  const [view, setView] = useState("login");

  if (!user) {
    return (
      <div className="auth">
        <div className="card">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <h2>Welcome</h2>
            <div className="toolbar">
              <button
                data-testid="switch-to-login"
                onClick={() => setView("login")}
              >
                Login
              </button>
              <button
                data-testid="switch-to-register"
                onClick={() => setView("register")}
              >
                Register
              </button>
            </div>
          </div>
          {view === "login" ? (
            <Login onRegistered={() => setView("login")} />
          ) : (
            <Register onLoggedIn={() => setView("board")} />
          )}
        </div>
      </div>
    );
  }

  return <Board onLogout={logout} />;
}

export function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
