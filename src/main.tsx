// main.tsx
import React, { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";

import LoginPage from "./login";
import RegisterPage from "./register";
import MainPage, { type User } from "./MainPage";
import DoctorsPage from "./DoctorsPage";
import DoctorProfile from "./DoctorProfile/DoctorProfilePage";

import Dock from "./components/Dock.tsx";
import {
  VscHome,
  VscArchive,
  VscAccount,
  VscSettingsGear,
} from "react-icons/vsc";

/** Guard a route by role */
function RoleRoute({
  user,
  allow,
  children,
}: {
  user: User;
  allow: Array<User["role"]>;
  children: React.ReactElement;
}) {
  if (!allow.includes(user.role))
    return <div style={{ padding: 24 }}>Forbidden</div>;
  return children;
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [booting, setBooting] = useState(true);
  const [view, setView] = useState<"login" | "register" | "main">("login");

  const navigate = useNavigate();

  const items = [
    {
      icon: <VscHome size={27} />,
      label: "Home",
      onClick: () => navigate("/"),
    },
    {
      icon: <VscArchive size={27} />,
      label: "Doctors",
      onClick: () => navigate("/doctors"),
    },
    {
      icon: <VscAccount size={27} />,
      label: "Profile",
      onClick: () => navigate("/me"),
    },
    {
      icon: <VscSettingsGear size={27} />,
      label: "Settings",
      onClick: () => alert("Settings"),
    },
  ];

  // Boot: check session
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("http://localhost:8080/api/auth/me", {
          credentials: "include",
        });
        if (res.ok) {
          const me = (await res.json()) as User;
          if (me && (me.authenticated ?? true) && me.id) {
            setUser(me);
            setView("main");
          }
        }
      } catch {
        /* ignore */
      } finally {
        setBooting(false);
      }
    })();
  }, [navigate]);

  async function handleLogout() {
    await fetch("http://localhost:8080/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    setUser(null);
    setView("login");
    navigate("/");
  }

  if (booting) return <div style={{ padding: 24 }}>Loading…</div>;

  return (
    <>
      <Dock
        items={items}
        panelHeight={75}
        baseItemSize={70}
        magnification={90}
      />

      <Routes>
        {/* Public routes */}
        {!user ? (
          <>
            <Route
              path="/register"
              element={
                <RegisterPage
                  onRegister={async (vals) => {
                    const res = await fetch(
                      "http://localhost:8080/api/auth/register",
                      {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        credentials: "include",
                        body: JSON.stringify(vals),
                      }
                    );
                    if (!res.ok) throw new Error(await res.text());
                    setView("login");
                    navigate("/");
                  }}
                  onNavigateToLogin={() => {
                    setView("login");
                    navigate("/");
                  }}
                />
              }
            />
            <Route
              path="/"
              element={
                <LoginPage
                  onNavigateToRegister={() => {
                    setView("register");
                    navigate("/register");
                  }}
                  onLoginSuccess={(u) => {
                    setUser(u);
                    setView("main");
                    // after login, doctors go to /doctors; others to /
                    if (u.role === "DOCTOR") navigate("/doctors");
                    else navigate("/");
                  }}
                />
              }
            />
          </>
        ) : (
          <>
            {/* Private/main area */}
            <Route
              path="/"
              element={<MainPage user={user} onLogout={handleLogout} />}
            />
            <Route path="/doctors" element={<DoctorsPage />} />
            {/* Doctor details (visible to any signed-in user) */}
            <Route path="/doctor/:id" element={<DoctorProfile />} />
            {/* Doctor's own profile restricted to DOCTOR */}
            <Route
              path="/me"
              element={
                <RoleRoute user={user} allow={["DOCTOR"]}>
                  <DoctorProfile />
                </RoleRoute>
              }
            />
          </>
        )}

        {/* Fallback */}
        <Route
          path="*"
          element={<div style={{ padding: 24 }}>Not found</div>}
        />
      </Routes>
    </>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);
