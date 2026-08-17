import React from "react";

function Card({ children, className = "", ...props }) {
  return (
    <div
      className={`bg-surface border border-border rounded-lg p-5 shadow-xs hover:shadow-md transition duration-200 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export default Card;
