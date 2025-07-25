import React from "react";

export default function FinTrackerLogo({ size = 48 }: { size?: number }) {
  const gold = "#C9B037";
  return (
    <svg
      width={size * 8}
      height={size}
      viewBox="0 0 400 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block" }}
    >
      {/* Left ₹ */}
      <text x="0" y="40" fontFamily="inherit" fontWeight="bold" fontSize="48" fill={gold} style={{ fontFamily: "sans-serif" }}>
        ₹
      </text>
      {/* IN */}
      <text x="40" y="40" fontFamily="inherit" fontWeight="bold" fontSize="48" fill={gold}>
        IN
      </text>
      {/* Stylized T */}
      <g>
        <rect x="110" y="8" width="32" height="8" fill={gold} />
        <rect x="124" y="16" width="8" height="32" fill={gold} />
      </g>
      {/* RACKE */}
      <text x="150" y="40" fontFamily="inherit" fontWeight="bold" fontSize="48" fill={gold}>
        RACKE
      </text>
      {/* Right ₹ */}
      <text x="320" y="40" fontFamily="inherit" fontWeight="bold" fontSize="48" fill={gold}>
        ₹
      </text>
    </svg>
  );
}