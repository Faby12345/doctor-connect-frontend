// main.tsx
import React, { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";

import LoginPage from "./login";
import RegisterPage from "./register";
import MainPage, { type User } from "./MainPage";
import DoctorsPage from "./DoctorsPage";

import Dock from "./components/Dock.tsx";
import { VscHome, VscArchive, VscAccount, VscSettingsGear } from "react-icons/vsc";

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [booting, setBooting] = useState(true);
  const [view, setView] = useState<"login" | "register" | "main">("login");

  // 👇 hook-ul funcționează doar dacă App e copil al <BrowserRouter>
  const navigate = useNavigate();

  const items = [
    { icon: <VscHome size={27} />, label: "Home", onClick: () => navigate("/") },
    { icon: <VscArchive size={27} />, label: "Archive", onClick: () => navigate("/DoctorsPage") },
    { icon: <VscAccount size={27} />, label: "Profile", onClick: () => alert("Profile!") },
    { icon: <VscSettingsGear size={27} />, label: "Settings", onClick: () => alert("Settings!") },
  ];

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
  }, []);

  async function handleLogout() {
    await fetch("http://localhost:8080/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    setUser(null);
    setView("login");
    navigate("/"); // opțional: du-te „acasă” după logout
  }

  if (booting) return <div style={{ padding: 24 }}>Loading…</div>;

  // 🔹 Meniul (Dock) îl afișăm mereu
  // 🔹 Pagina țintă NU trebuie randată direct — doar prin rute
  return (
      <>
        <Dock items={items} panelHeight={75} baseItemSize={70} magnification={90} />

        <Routes>
          {/* Public routes */}
          {!user && view === "register" && (
              <Route
                  path="/register"
                  element={
                    <RegisterPage
                        onRegister={async (vals) => {
                          const res = await fetch("http://localhost:8080/api/auth/register", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            credentials: "include",
                            body: JSON.stringify(vals),
                          });
                          if (!res.ok) throw new Error(await res.text());
                          setView("login");
                          navigate("/"); // după register mergem la login
                        }}
                        onNavigateToLogin={() => {
                          setView("login");
                          navigate("/");
                        }}
                    />
                  }
              />
          )}

          {!user && view !== "register" && (
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
                          navigate("/"); // mergi în „main”
                        }}
                    />
                  }
              />
          )}

          {/* Private/main area */}
          {user && (
              <>
                <Route path="/" element={<MainPage user={user} onLogout={handleLogout} />} />
                {/* 👇 Ruta pe care o folosește butonul Archive */}
                <Route path="/DoctorsPage" element={<DoctorsPage />} />
              </>
          )}

          {/* Fallback simplu: dacă nu se potrivește nimic, mergi acasă */}
          <Route path="*" element={<div style={{ padding: 24 }}>Not found</div>} />
        </Routes>
      </>
  );
}

createRoot(document.getElementById("root")!).render(
    <StrictMode>
      {/* ✅ Router la rădăcină ca useNavigate să funcționeze */}
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </StrictMode>
);
