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
import NetworkExplorer from "./pages/NetworkExplorer";
import Watchlist from "./pages/Watchlist";
import Insights from "./pages/Insights";
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
        <Route path="/assess/result" element={<RequireAuth><AssessResult /></RequireAuth>} />
        <Route path="/assess/report" element={<RequireAuth><AssessReport /></RequireAuth>} />
        <Route path="/members" element={<RequireAuth><MemberLookup /></RequireAuth>} />
        <Route path="/member/:id" element={<RequireAuth><Member /></RequireAuth>} />
        <Route path="/network" element={<RequireAuth><NetworkExplorer /></RequireAuth>} />
        <Route path="/watchlist" element={<RequireAuth><Watchlist /></RequireAuth>} />
        <Route path="/insights" element={<RequireAuth><Insights /></RequireAuth>} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
