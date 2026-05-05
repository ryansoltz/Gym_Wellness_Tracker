import { NavLink, useNavigate } from "react-router-dom";

const links = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/log", label: "Log Workout" },
  { to: "/history", label: "History" },
  { to: "/exercises", label: "Exercises" },
  { to: "/goals", label: "Goals" },
  { to: "/records", label: "PRs" },
  { to: "/bodyweight", label: "Body Weight" },
  { to: "/wellness", label: "Wellness" },
];

export default function Navbar() {
  const navigate = useNavigate();
  const userId = localStorage.getItem("user_id");

  function logout() {
    localStorage.removeItem("user_id");
    localStorage.removeItem("username");
    navigate("/login");
  }

  if (!userId) return null;

  return (
    <nav style={{
      background: "#4f46e5",
      padding: "0 24px",
      display: "flex",
      alignItems: "center",
      gap: 4,
      flexWrap: "wrap",
      minHeight: 52,
    }}>
      <span style={{ color: "#fff", fontWeight: 700, fontSize: 18, marginRight: 16, whiteSpace: "nowrap" }}>
        GymTracker
      </span>

      {links.map(({ to, label }) => (
        <NavLink
          key={to}
          to={to}
          style={({ isActive }) => ({
            color: isActive ? "#fff" : "#c7d2fe",
            background: isActive ? "rgba(255,255,255,0.15)" : "transparent",
            padding: "6px 12px",
            borderRadius: 6,
            fontSize: 14,
            fontWeight: 500,
            whiteSpace: "nowrap",
          })}
        >
          {label}
        </NavLink>
      ))}

      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ color: "#c7d2fe", fontSize: 13 }}>
          {localStorage.getItem("username")}
        </span>
        <button
          onClick={logout}
          style={{
            background: "rgba(255,255,255,0.15)",
            border: "none",
            color: "#fff",
            padding: "5px 14px",
            borderRadius: 6,
            cursor: "pointer",
            fontSize: 13,
          }}
        >
          Logout
        </button>
      </div>
    </nav>
  );
}
