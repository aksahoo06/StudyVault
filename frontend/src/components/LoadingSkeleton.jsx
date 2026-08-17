import React from "react";

function LoadingSkeleton({ variant = "card", count = 3 }) {
  const items = Array.from({ length: count });

  if (variant === "line") {
    return (
      <div className="space-y-3 animate-pulse">
        {items.map((_, idx) => (
          <div
            key={idx}
            className="h-4 bg-border rounded"
            style={{ width: `${Math.floor(Math.random() * 40) + 60}%` }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
      {items.map((_, idx) => (
        <div key={idx} className="bg-surface border border-border rounded-lg p-5 space-y-4">
          <div className="h-6 bg-border rounded w-3/4" />
          <div className="h-4 bg-border rounded w-1/2" />
          <div className="h-10 bg-border rounded w-full pt-4" />
        </div>
      ))}
    </div>
  );
}

export default LoadingSkeleton;
