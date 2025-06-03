import { Suspense } from "react";
import { useRoutes, Routes, Route, Navigate } from "react-router-dom";
import Home from "./components/home";
import UserDashboard from "./pages/UserDashboard";
import ProjectDetail from "./pages/ProjectDetail";
import ExploreProjects from "./pages/ExploreProjects";
import UserProfile from "./pages/UserProfile";
import EditProfile from "./pages/UserProfile";
import ViewProfile from "./pages/ViewProfile";
import UserProjects from "./pages/UserProjects";
import Ranking from "./pages/Ranking"
import MainLayout from "./components/layout/MainLayout";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { Loader2 } from "lucide-react";
import Feed from "./pages/Feed";
import Groups from "./pages/Groups";
import GroupDetail from "./pages/GroupDetail";

// Protected route component
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/" replace state={{ from: window.location.pathname }} />;
  }

  return children;
};

function AppRoutes() {
  const routes = useRoutes([
    {
      path: "/",
      element: <MainLayout />,
      children: [
        { index: true, element: <Home /> },
        { path: "explore", element: <ExploreProjects /> },
        { path: "groups", element: <Groups /> },
        { path: "groups/:groupId", element: <GroupDetail /> },
        { path: "ranking", element: <Ranking/>}, 
        { path: "feed", element: (
          <ProtectedRoute>
            <Feed />
          </ProtectedRoute>
        ) },
        {
          path: "dashboard",
          element: (
            <ProtectedRoute>
              <UserDashboard />
            </ProtectedRoute>
          ),
        },
        {
          path: "profile",
          element: (
            <ProtectedRoute>
              <UserProfile />
            </ProtectedRoute>
          ),
        },
        {
          path: "profile/edit",
          element: (
            <ProtectedRoute>
              <EditProfile />
            </ProtectedRoute>
          ),
        },
        {
          path: "profile/:userId",
          element: <ViewProfile />,
        },
        {
          path: "user/:userId/projects",
          element: <UserProjects />,
        },
        {
          path: "my-projects",
          element: (
            <ProtectedRoute>
              <UserProjects />
            </ProtectedRoute>
          ),
        },
        {
          path: "projects/:projectId",
          element: <ProjectDetail />,
        },
      ],
    },
  ]);

  return routes;
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
