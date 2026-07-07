import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import AssessRisk from "./pages/AssessRisk";
import AssessResult from "./pages/AssessResult";
import AssessReport from "./pages/AssessReport";
import Member from "./pages/Member";
import MemberLookup from "./pages/MemberLookup";
import Insights from "./pages/Insights";
import Applications from "./pages/Applications";
import ApplicationDetail from "./pages/ApplicationDetail";
import Monitoring from "./pages/Monitoring";
import Admin from "./pages/Admin";
import { RequireAuth } from "./components/auth/RequireAuth";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
        <Route path="/assess" element={<RequireAuth><AssessRisk /></RequireAuth>} />
        <Route path="/applications" element={<RequireAuth><Applications /></RequireAuth>} />
        <Route path="/applications/:id" element={<RequireAuth><ApplicationDetail /></RequireAuth>} />
        <Route path="/assess/result" element={<RequireAuth><AssessResult /></RequireAuth>} />
        <Route path="/assess/report" element={<RequireAuth><AssessReport /></RequireAuth>} />
        <Route path="/members" element={<RequireAuth><MemberLookup /></RequireAuth>} />
        <Route path="/member/:id" element={<RequireAuth><Member /></RequireAuth>} />
        <Route path="/network" element={<Navigate to="/members" replace />} />
        <Route path="/monitoring" element={<RequireAuth><Monitoring /></RequireAuth>} />
        <Route path="/admin" element={<RequireAuth><Admin /></RequireAuth>} />
        <Route path="/watchlist" element={<Navigate to="/monitoring" replace />} />
        <Route path="/early-warning" element={<Navigate to="/monitoring" replace />} />
        <Route path="/insights" element={<RequireAuth><Insights /></RequireAuth>} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
