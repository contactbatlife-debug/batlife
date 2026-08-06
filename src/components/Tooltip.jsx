import { useState, useEffect, useRef } from "react";

export default function Tooltip({ text, position = "top" }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!visible) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setVisible(false);
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [visible]);

  return (
    <span ref={ref} style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
      {/* ✅ span au lieu de button — évite button-dans-button */}
      <span
        role="button"
        tabIndex={0}
        onClick={(e) => { e.stopPropagation(); setVisible(v => !v); }}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.stopPropagation(); setVisible(v => !v); }}}
        style={{
          width: "18px", height: "18px",
          borderRadius: "50%",
          background: visible ? "rgba(56,189,248,0.2)" : "rgba(255,255,255,0.08)",
          border: `0.5px solid ${visible ? "rgba(56,189,248,0.5)" : "rgba(255,255,255,0.15)"}`,
          color: visible ? "#38bdf8" : "rgba(148,197,240,0.6)",
          fontSize: "10px", fontWeight: 700,
          cursor: "pointer",
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          transition: "all 0.2s ease",
          flexShrink: 0,
          lineHeight: 1,
          userSelect: "none",
          WebkitUserSelect: "none",
        }}
        aria-label="Aide"
      >
        ?
      </span>

      {/* Bulle */}
      {visible && (
        <div
          style={{
            position: "fixed",
            zIndex: 9999,
            width: "220px",
            background: "rgba(10,20,40,0.97)",
            border: "0.5px solid rgba(56,189,248,0.3)",
            borderTop: "0.5px solid rgba(56,189,248,0.5)",
            borderRadius: "12px",
            padding: "10px 14px",
            fontSize: "12px",
            color: "rgba(200,235,255,0.9)",
            lineHeight: 1.5,
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.6), 0 0 16px rgba(56,189,248,0.1)",
            pointerEvents: "none",
            ...(() => {
              if (!ref.current) return { top: 0, left: 0 };
              const rect = ref.current.getBoundingClientRect();
              const BUBBLE_WIDTH = 220;
              const MARGIN = 10;
              const screenW = window.innerWidth;

              let left = rect.left + rect.width / 2 - BUBBLE_WIDTH / 2;
              if (left + BUBBLE_WIDTH > screenW - MARGIN) left = screenW - MARGIN - BUBBLE_WIDTH;
              if (left < MARGIN) left = MARGIN;

              if (position === "top") {
                return { top: rect.top - 8 + "px", transform: "translateY(-100%)", left: left + "px" };
              } else if (position === "bottom") {
                return { top: rect.bottom + 8 + "px", left: left + "px" };
              } else if (position === "left") {
                return { top: rect.top + rect.height / 2 + "px", transform: "translateY(-50%)", right: (screenW - rect.left + 8) + "px" };
              } else {
                return { top: rect.top + rect.height / 2 + "px", transform: "translateY(-50%)", left: rect.right + 8 + "px" };
              }
            })(),
          }}
        >
          <div style={{
            position: "absolute", top: 0, left: "10%", right: "10%", height: "1px",
            background: "linear-gradient(90deg, transparent, rgba(56,189,248,0.6), transparent)",
          }} />
          {text}
        </div>
      )}
    </span>
  );
}
