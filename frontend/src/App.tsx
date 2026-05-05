import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import LogWorkout from "./pages/LogWorkout";
import WorkoutHistory from "./pages/WorkoutHistory";
import Exercises from "./pages/Exercises";
import Goals from "./pages/Goals";
import Records from "./pages/Records";
import BodyWeight from "./pages/BodyWeight";
import Wellness from "./pages/Wellness";

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const userId = localStorage.getItem("user_id");
  return userId ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <>
      <Navbar />
      <main style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px" }}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/log" element={<PrivateRoute><LogWorkout /></PrivateRoute>} />
          <Route path="/history" element={<PrivateRoute><WorkoutHistory /></PrivateRoute>} />
          <Route path="/exercises" element={<PrivateRoute><Exercises /></PrivateRoute>} />
          <Route path="/goals" element={<PrivateRoute><Goals /></PrivateRoute>} />
          <Route path="/records" element={<PrivateRoute><Records /></PrivateRoute>} />
          <Route path="/bodyweight" element={<PrivateRoute><BodyWeight /></PrivateRoute>} />
          <Route path="/wellness" element={<PrivateRoute><Wellness /></PrivateRoute>} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </>
  );
}