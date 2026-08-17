import React from "react";
import Button from "./Button";

function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className = "",
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 border border-border border-dashed rounded-lg bg-surface max-w-md mx-auto ${className}`}
    >
      {icon && (
        <div className="text-ink-muted mb-4 h-12 w-12 flex items-center justify-center">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-ink mb-1">{title}</h3>
      <p className="text-sm text-ink-muted mb-6 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button variant="primary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

export default EmptyState;
