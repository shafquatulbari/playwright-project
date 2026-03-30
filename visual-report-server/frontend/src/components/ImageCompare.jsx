import React, { useState } from "react";

export default function ImageCompare({ baselineSrc, actualSrc, diffSrc }) {
  const [modalImage, setModalImage] = useState(null);
  const [viewMode, setViewMode] = useState("side-by-side");

  return (
    <div>
      <div style={{ marginBottom: 8, display: "flex", gap: 4 }}>
        {["side-by-side", "overlay", "diff-only"].map((m) => (
          <button
            key={m}
            className={`btn btn-sm ${viewMode === m ? "btn-primary" : ""}`}
            onClick={() => setViewMode(m)}
          >
            {m === "side-by-side" ? "Side by Side" : m === "overlay" ? "Overlay" : "Diff Only"}
          </button>
        ))}
      </div>

      {viewMode === "side-by-side" && (
        <div className="images-grid">
          <div className="image-col">
            <h4>Baseline</h4>
            <img src={baselineSrc} alt="Baseline" onClick={() => setModalImage(baselineSrc)} />
          </div>
          <div className="image-col">
            <h4>Actual</h4>
            <img src={actualSrc} alt="Actual" onClick={() => setModalImage(actualSrc)} />
          </div>
          {diffSrc && (
            <div className="image-col">
              <h4>Diff</h4>
              <img src={diffSrc} alt="Diff" onClick={() => setModalImage(diffSrc)} />
            </div>
          )}
        </div>
      )}

      {viewMode === "overlay" && (
        <div style={{ position: "relative", maxWidth: "100%" }}>
          <img src={baselineSrc} alt="Baseline" style={{ width: "100%", borderRadius: 8 }} />
          <img
            src={actualSrc}
            alt="Actual"
            style={{
              width: "100%",
              position: "absolute",
              top: 0,
              left: 0,
              opacity: 0.5,
              borderRadius: 8,
              mixBlendMode: "difference",
            }}
          />
          <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 8 }}>
            Overlay view: differences appear as bright pixels against dark background
          </p>
        </div>
      )}

      {viewMode === "diff-only" && diffSrc && (
        <div>
          <img
            src={diffSrc}
            alt="Diff"
            style={{ width: "100%", borderRadius: 8, cursor: "pointer" }}
            onClick={() => setModalImage(diffSrc)}
          />
          <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 8 }}>
            Red pixels indicate differences between baseline and actual
          </p>
        </div>
      )}

      {viewMode === "diff-only" && !diffSrc && (
        <p style={{ color: "var(--text-muted)" }}>No diff image available</p>
      )}

      {/* Full-size modal */}
      {modalImage && (
        <div className="modal-overlay" onClick={() => setModalImage(null)}>
          <div className="modal-content">
            <img src={modalImage} alt="Full size" />
          </div>
        </div>
      )}
    </div>
  );
}
