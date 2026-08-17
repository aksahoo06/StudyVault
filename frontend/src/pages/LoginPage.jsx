import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import Button from "../components/Button";

function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const isFormValid = email.trim() && password.trim();

  async function handleSubmit(e) {
    e.preventDefault();
    if (!isFormValid) return;

    setIsLoading(true);
    setError("");

    try {
      const response = await api.post("/auth/login", {
        email: email.trim(),
        password,
      });

      login(response.data.token, response.data.user);
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message || "Incorrect email or password."
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 font-sans">
      {/* Brand logo header */}
      <div className="flex items-center gap-2 mb-6">
        <div className="bg-primary text-white h-9 w-9 rounded flex items-center justify-center font-bold text-xl shadow-sm">
          S
        </div>
        <span className="font-bold text-2xl text-ink tracking-tight">
          StudyVault
        </span>
      </div>

      {/* Card container */}
      <div className="w-full max-w-md bg-surface border border-border p-8 rounded-lg shadow-sm">
        <h1 className="text-2xl font-bold text-ink mb-6 text-center">
          Sign in to your account
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">
              Email address
            </label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-border bg-background rounded px-3 py-2 text-ink text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-border bg-background rounded px-3 py-2 text-ink text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              required
            />
          </div>

          {error && (
            <div className="text-danger text-sm font-medium pt-1">
              {error}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            className="w-full py-2.5 mt-2"
            isLoading={isLoading}
            disabled={!isFormValid}
          >
            Log in
          </Button>
        </form>

        <div className="mt-6 pt-5 border-t border-border text-center">
          <p className="text-sm text-ink-muted">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="text-primary font-medium hover:underline"
            >
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;