import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Navbar({ variant = "marketing", onMenuToggle }) {
  const { token } = useAuth();

  if (variant === "app") {
    return (
      <header className="md:hidden flex items-center justify-between px-6 py-4 bg-surface border-b border-border sticky top-0 z-30">
        {/* Hamburger Menu Toggle */}
        <button
          onClick={onMenuToggle}
          className="p-1.5 text-ink-muted hover:text-ink transition cursor-pointer"
          aria-label="Open sidebar"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
            />
          </svg>
        </button>

        {/* Centered Brand Logo */}
        <div className="flex items-center gap-2">
          <div className="bg-primary text-white h-7 w-7 rounded flex items-center justify-center font-bold text-base shadow-sm">
            S
          </div>
          <span className="font-bold text-lg text-ink tracking-tight">
            StudyVault
          </span>
        </div>

        {/* Dummy spacer for symmetry */}
        <div className="w-9" />
      </header>
    );
  }

  return (
    <nav className="border-b border-border bg-surface">
      <div className="max-w-7xl mx-auto flex justify-between items-center px-6 py-4">
        {/* Brand Logo Link */}
        <Link to="/" className="flex items-center gap-2">
          <div className="bg-primary text-white h-8 w-8 rounded flex items-center justify-center font-bold text-lg shadow-sm">
            S
          </div>
          <span className="font-bold text-xl text-ink tracking-tight">
            StudyVault
          </span>
        </Link>

        {/* Navigation CTAs */}
        <div className="flex gap-4 items-center">
          {token ? (
            <Link
              to="/dashboard"
              className="bg-primary text-white px-4 py-2 text-sm font-medium rounded hover:bg-primary-hover transition duration-150"
            >
              Go to Workspace
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm font-medium text-ink-muted hover:text-ink transition duration-150"
              >
                Log in
              </Link>
              <Link
                to="/register"
                className="bg-primary text-white px-4 py-2 text-sm font-medium rounded hover:bg-primary-hover transition duration-150"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;