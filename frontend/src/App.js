import React from "react";
import BasicStatsCards from "./components/BasicStatsCards";
import TpsChart from "./components/TpsChart";
import TpsHistoryChart from "./components/TpsHistoryChart";
import "./App.css";

function App() {
  return (
    <div
      style={{
        background: "#020617",
        minHeight: "100vh",
        padding: "2rem 3rem",
        color: "white",
      }}
    >
      {/* Header + network badge */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.5rem",
        }}
      >
        <div>
          <h1 style={{ marginBottom: "0.25rem" }}>
            Solana Explorer – Basic Stats
          </h1>
          <p style={{ color: "#9ca3af", margin: 0 }}>
            Live devnet statistics fetched via Solana JSON-RPC and visualized
            with React & Chart.js.
          </p>
        </div>
        <span
          style={{
            background: "rgba(56, 189, 248, 0.15)",
            color: "#22d3ee",
            padding: "0.3rem 0.9rem",
            borderRadius: "999px",
            fontSize: "0.8rem",
          }}
        >
          Network: Devnet
        </span>
      </div>

      {/* Cards row */}
      <BasicStatsCards />

      {/* Charts stacked with same width */}
      <div
        style={{
          marginTop: "2rem",
          display: "flex",
          flexDirection: "column",
          gap: "1.5rem",
        }}
      >
        <TpsChart />
        <TpsHistoryChart />
      </div>
    </div>
  );
}

export default App;
