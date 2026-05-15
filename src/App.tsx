import { useState } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/auth/Login";
import VerifyOtp from "./pages/auth/VerifyOtp";
import Dashboard from "./pages/Dashboard";
import MonitoringPage from "./pages/MonitoringWorkbenchPage";
import MapPage from "./pages/MapPage";
import IncidentsPage from "./pages/IncidentsPage";
import RcaPage from "./pages/RcaPage";
import RunbooksPage from "./pages/RunbooksPage";
import InternalMailPage from "./pages/InternalMailPage";
import AssistantPage from "./pages/AssistantPage";
import ProfilePage from "./pages/ProfilePage";
import SettingsPage from "./pages/SettingsPage";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import AppBootScreen from "@/components/system/AppBootScreen";

function AppRoutes() {
  const location = useLocation();
  const [bootVisible, setBootVisible] = useState(true);

  const skipBootScreen = location.pathname.startsWith("/rca");

  return (
    <>
      {!skipBootScreen && (
        <AppBootScreen
          visible={bootVisible}
          onComplete={() => setBootVisible(false)}
        />
      )}

      <Routes>
        {/* public */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/verify-otp" element={<VerifyOtp />} />

        {/* protected */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/monitoring"
          element={
            <ProtectedRoute>
              <MonitoringPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/map"
          element={
            <ProtectedRoute>
              <MapPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/incidents"
          element={
            <ProtectedRoute>
              <IncidentsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/rca"
          element={
            <ProtectedRoute>
              <RcaPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/runbooks"
          element={
            <ProtectedRoute>
              <RunbooksPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/mail"
          element={
            <ProtectedRoute>
              <InternalMailPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/assistant"
          element={
            <ProtectedRoute>
              <AssistantPage />
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

        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;