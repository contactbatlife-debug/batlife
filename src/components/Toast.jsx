import { useEffect, useState } from "react";

// Variantes visuelles
const VARIANTS = {
  default: {
    background: "linear-gradient(135deg, rgba(56,189,248,0.18), rgba(99,102,241,0.14))",
    border: "0.5px solid rgba(56,189,248,0.4)",
    borderTop: "0.5px solid rgba(56,189,248,0.6)",
    lineColor: "linear-gradient(90deg, transparent, rgba(56,189,248,0.8), rgba(139,92,246,0.6), transparent)",
    glow: "0 8px 32px rgba(0,0,0,0.4), 0 0 20px rgba(56,189,248,0.15)",
  },
  success: {
    background: "linear-gradient(135deg, rgba(74,222,128,0.18), rgba(56,189,248,0.12))",
    border: "0.5px solid rgba(74,222,128,0.45)",
    borderTop: "0.5px solid rgba(74,222,128,0.7)",
    lineColor: "linear-gradient(90deg, transparent, rgba(74,222,128,0.9), rgba(56,189,248,0.5), transparent)",
    glow: "0 8px 32px rgba(0,0,0,0.4), 0 0 20px rgba(74,222,128,0.2)",
  },
  warning: {
    background: "linear-gradient(135deg, rgba(251,146,60,0.18), rgba(251,191,36,0.12))",
    border: "0.5px solid rgba(251,146,60,0.45)",
    borderTop: "0.5px solid rgba(251,146,60,0.7)",
    lineColor: "linear-gradient(90deg, transparent, rgba(251,146,60,0.9), rgba(251,191,36,0.5), transparent)",
    glow: "0 8px 32px rgba(0,0,0,0.4), 0 0 20px rgba(251,146,60,0.2)",
  },
};

export default function Toast({ message, onClose }) {
  const [visible, setVisible] = useState(false);
  const [currentMsg, setCurrentMsg] = useState(null);
  const [variant, setVariant] = useState("default");

  useEffect(() => {
    if (!message) return;

    // message peut être une string ou un objet { text, variant }
    if (typeof message === "object" && message.text) {
      setCurrentMsg(message.text);
      setVariant(message.variant || "default");
    } else {
      setCurrentMsg(message);
      setVariant("default");
    }

    setVisible(true);

    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => {
        setCurrentMsg(null);
        onClose?.();
      }, 400);
    }, 3500);

    return () => clearTimeout(timer);
  }, [message]);

  if (!currentMsg) return null;

  const v = VARIANTS[variant] || VARIANTS.default;

  return (
    <div
      role="alert"
      aria-live="assertive"
      style={{
        position: "fixed",
        top: "24px",
        left: "50%",
        transform: `translateX(-50%) translateY(${visible ? "0" : "-20px"})`,
        zIndex: 9999,
        maxWidth: "90%",
        opacity: visible ? 1 : 0,
        transition: "opacity 0.3s ease, transform 0.3s ease",
        background: v.background,
        border: v.border,
        borderTop: v.borderTop,
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderRadius: "20px",
        padding: "12px 24px",
        boxShadow: v.glow,
        color: "white",
        fontWeight: 600,
        fontSize: "14px",
        textAlign: "center",
        whiteSpace: "pre-line", // permet les sauts de ligne avec \n
      }}
    >
      {/* Ligne lumineuse top */}
      <div style={{
        position: "absolute", top: 0, left: "10%", right: "10%", height: "1px",
        background: v.lineColor,
        borderRadius: "1px",
      }} />
      {currentMsg}
    </div>
  );
}
