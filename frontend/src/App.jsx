import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import LibraryPage from "./pages/LibraryPage";
import ProfilePage from "./pages/ProfilePage";
import LiveClassesDashboard from "./pages/LiveClassesDashboard";
import ClassroomPage from "./pages/ClassroomPage";
import WorkspaceLayout from "./pages/Workspace/WorkspaceLayout";
import Summary from "./pages/Workspace/Summary";
import Chat from "./pages/Workspace/Chat/Chat";
import Flashcards from "./pages/Workspace/Flashcards/Flashcards";
import Quiz from "./pages/Workspace/Quiz/Quiz";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <Routes>
      {/* Marketing Landing */}
      <Route path="/" element={<LandingPage />} />

      {/* Auth Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected Main App Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/library"
        element={
          <ProtectedRoute>
            <LibraryPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/live-classes"
        element={
          <ProtectedRoute>
            <LiveClassesDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/live/:classroomId"
        element={
          <ProtectedRoute>
            <ClassroomPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />

      {/* Protected Study Workspace Tab Layout */}
      <Route
        path="/document/:id"
        element={
          <ProtectedRoute>
            <WorkspaceLayout />
          </ProtectedRoute>
        }
      >
        {/* Redirect base document path to default tab (Summary) */}
        <Route index element={<Navigate to="summary" replace />} />
        <Route path="summary" element={<Summary />} />
        <Route path="chat" element={<Chat />} />
        <Route path="flashcards" element={<Flashcards />} />
        <Route path="quiz" element={<Quiz />} />
      </Route>

      {/* Fallback Catch-all Route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;