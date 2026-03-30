import React, { useState } from "react";
import Sidebar from "./components/Sidebar.jsx";
import RunTests from "./components/RunTests.jsx";
import Results from "./components/Results.jsx";
import Baselines from "./components/Baselines.jsx";
import History from "./components/History.jsx";
import Settings from "./components/Settings.jsx";

const TABS = [
  { id: "run", label: "Run Tests", icon: "\u25B6" },
  { id: "results", label: "Results", icon: "\u2691" },
  { id: "baselines", label: "Baselines", icon: "\u29C9" },
  { id: "history", label: "History", icon: "\u29D6" },
  { id: "settings", label: "Settings", icon: "\u2699" },
];

export default function App() {
  const [activeTab, setActiveTab] = useState("run");
  const [selectedRunId, setSelectedRunId] = useState(null);

  function handleViewRun(runId) {
    setSelectedRunId(runId);
    setActiveTab("results");
  }

  return (
    <div className="app">
      <Sidebar tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="main">
        {activeTab === "run" && <RunTests />}
        {activeTab === "results" && (
          <Results selectedRunId={selectedRunId} onClearRunId={() => setSelectedRunId(null)} />
        )}
        {activeTab === "baselines" && <Baselines />}
        {activeTab === "history" && <History onViewRun={handleViewRun} />}
        {activeTab === "settings" && <Settings />}
      </main>
    </div>
  );
}
