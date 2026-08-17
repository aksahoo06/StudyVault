import React, { useState } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

function AppLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background font-sans text-ink flex flex-col">
      {/* Mobile Top Bar */}
      <Navbar variant="app" onMenuToggle={() => setIsSidebarOpen(true)} />

      {/* Navigation Sidebar (Desktop & Mobile Slide-over) */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main Panel Content */}
      <div className="md:pl-60 flex-1 flex flex-col">
        <main className="flex-grow w-full max-w-5xl mx-auto px-6 py-8 md:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
