import React from "react";

function EventLabel({ label, position, isVisible }) {
  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        transform: `translate(-50%, -50%) translateX(${position}px) translateY(-100px)`,
        color: "#455a64",
        fontSize: "18px",
        fontWeight: "500",
        textAlign: "center",
        pointerEvents: "none",
        opacity: isVisible ? 1 : 0,
        transition: "opacity 0.3s ease",
        textShadow: "0 2px 10px rgba(255, 255, 255, 0.8)",
        whiteSpace: "nowrap",
        padding: "8px 16px",
        background: "rgba(255, 255, 255, 0.9)",
        borderRadius: "8px",
        border: "1px solid rgba(100, 181, 246, 0.3)",
      }}
    >
      {label}
    </div>
  );
}

export default EventLabel;
