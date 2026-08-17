import React from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

function LandingPage() {
  const steps = [
    {
      num: "1",
      title: "Upload your PDFs",
      desc: "Drag & drop textbooks, slides, or study notes. We extract the text and index it securely.",
    },
    {
      num: "2",
      title: "Ask & Review",
      desc: "Get summaries and chat directly with your files. We retrieve relevant context on-demand.",
    },
    {
      num: "3",
      title: "Practice & Test",
      desc: "Generate smart multiple-choice quizzes and active recall flashcards to lock in learning.",
    },
  ];

  const features = [
    {
      title: "AI Chat with RAG",
      desc: "Ask any question. Our Retrieval-Augmented Generation parses your PDF and cites pages in its answers.",
    },
    {
      title: "Instant Summaries",
      desc: "Transform long documents into structured bullet summaries highlighting key terms and formulas.",
    },
    {
      title: "Recall Flashcards",
      desc: "Quiz yourself with AI-generated double-sided cards. Reveal answers with a single click.",
    },
    {
      title: "Interactive Quizzes",
      desc: "Practice with custom generated multiple-choice tests. Get immediate feedback on correct answers.",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans text-ink">
      <Navbar variant="marketing" />

      {/* Hero Section */}
      <main className="flex-1">
        <section className="max-w-5xl mx-auto px-6 py-20 text-center flex flex-col items-center">
          <h1 className="text-4xl sm:text-5xl font-bold leading-tight max-w-3xl mb-6">
            Turn your PDFs into an interactive study workspace.
          </h1>
          <p className="text-lg text-ink-muted leading-relaxed max-w-2xl mb-10">
            Upload study documents to get instant summaries, ask questions
            backed by page-level source references, and test your knowledge
            with AI-generated quizzes and flashcards.
          </p>
          <div className="flex gap-4">
            <Link
              to="/register"
              className="bg-primary text-white px-6 py-3 rounded font-semibold hover:bg-primary-hover transition duration-150 shadow-sm"
            >
              Get Started — it's free
            </Link>
            <Link
              to="/login"
              className="bg-surface text-ink border border-border px-6 py-3 rounded font-semibold hover:bg-background transition duration-150"
            >
              Sign In
            </Link>
          </div>

          {/* Simple Mockup Preview */}
          <div className="mt-16 w-full max-w-4xl border border-border rounded-lg bg-surface p-4 shadow-xl">
            <div className="flex items-center gap-2 border-b border-border pb-3 mb-4">
              <span className="h-3 w-3 rounded-full bg-red-400" />
              <span className="h-3 w-3 rounded-full bg-yellow-400" />
              <span className="h-3 w-3 rounded-full bg-green-400" />
              <span className="text-xs text-ink-muted ml-2 font-medium">
                StudyVault Workspace — Summary View
              </span>
            </div>
            <div className="bg-background rounded-md h-72 flex flex-col items-center justify-center border border-border/40 text-ink-muted">
              <svg
                className="w-12 h-12 mb-3 text-ink-muted/60"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="font-semibold text-ink">Calm, Focused Workspace</p>
              <p className="text-xs max-w-xs text-center mt-1">
                Interact page-by-page with your learning material without visual
                clutter.
              </p>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="bg-surface border-y border-border py-20">
          <div className="max-w-5xl mx-auto px-6">
            <h2 className="text-2xl font-bold text-center mb-16">
              How it works
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {steps.map((step) => (
                <div key={step.num} className="flex flex-col items-center text-center">
                  <div className="bg-primary/10 text-primary h-12 w-12 rounded-full flex items-center justify-center font-bold text-lg mb-6">
                    {step.num}
                  </div>
                  <h3 className="text-lg font-semibold text-ink mb-3">
                    {step.title}
                  </h3>
                  <p className="text-sm text-ink-muted leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Core Features */}
        <section className="max-w-5xl mx-auto px-6 py-20">
          <h2 className="text-2xl font-bold text-center mb-16">
            Everything you need to master your material
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feat) => (
              <div
                key={feat.title}
                className="bg-surface border border-border p-6 rounded-lg shadow-2xs hover:shadow-sm transition"
              >
                <h3 className="text-lg font-semibold text-ink mb-2">
                  {feat.title}
                </h3>
                <p className="text-sm text-ink-muted leading-relaxed">
                  {feat.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="bg-primary text-white py-20 text-center">
          <div className="max-w-3xl mx-auto px-6">
            <h2 className="text-3xl font-bold mb-4">
              Stop scrolling, start studying.
            </h2>
            <p className="text-primary-100 mb-8 max-w-xl mx-auto opacity-90 leading-relaxed">
              Create an account in 10 seconds and turn your lecture files into
              your most effective study partner.
            </p>
            <Link
              to="/register"
              className="bg-white text-primary px-8 py-3.5 rounded font-semibold hover:bg-neutral-50 transition duration-150 inline-block shadow"
            >
              Get Started for Free
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default LandingPage;