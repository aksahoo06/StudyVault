import React from "react";

function ProgressBar({ current, total, percentage, className = "" }) {
  const percent =
    percentage !== undefined
      ? percentage
      : total > 0
      ? (current / total) * 100
      : 0;

  return (
    <div className={`w-full bg-border rounded-full h-2 overflow-hidden ${className}`}>
      <div
        className="bg-primary h-full rounded-full transition-all duration-300"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

export default ProgressBar;
