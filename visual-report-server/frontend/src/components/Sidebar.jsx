import React from "react";

export default function Sidebar({ tabs, activeTab, onTabChange }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h1>Visual Testing</h1>
        <p>AI-Powered Screenshot Comparison</p>
      </div>
      <nav className="sidebar-nav">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`nav-item ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => onTabChange(tab.id)}
          >
            <span className="nav-icon">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </nav>
      <div style={{ padding: "12px 20px", borderTop: "1px solid var(--border)" }}>
        <p style={{ fontSize: 11, color: "var(--text-muted)" }}>
          Playwright Visual Testing v1.0
        </p>
      </div>
    </aside>
  );
}
