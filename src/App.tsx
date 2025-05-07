import { Suspense } from "react";
import { useRoutes, Routes, Route, Navigate } from "react-router-dom";
import Home from "./components/home";
import UserDashboard from "./pages/UserDashboard";
import ProjectDetail from "./pages/ProjectDetail";
import MainLayout from "./components/layout/MainLayout";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import routes from "tempo-routes";

// Protected route component
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { currentUser, loading } = useAuth();

  if (loading) return <p>Loading...</p>;

  if (!currentUser) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function AppRoutes() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Home />} />
            <Route path="project/:id" element={<ProjectDetail />} />
            <Route
              path="dashboard"
              element={
                <ProtectedRoute>
                  <UserDashboard />
                </ProtectedRoute>
              }
            />
          </Route>
        </Routes>
        {import.meta.env.VITE_TEMPO === "true" && useRoutes(routes)}
      </>
    </Suspense>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
