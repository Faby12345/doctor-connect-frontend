// main.tsx
import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import LoginPage from "./login";
import RegisterPage from "./register"; // keep if you have it
import MainPage from "./MainPage";
import type {User} from "./MainPage";

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [booting, setBooting] = useState(true);
  const [view, setView] = useState<"login" | "register" | "main">("login");

  // 🔄 hydrate from session on app load
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
  }

  if (booting) return <div style={{ padding: 24 }}>Loading…</div>;

  if (!user) {
    if (view === "register") {
      return (
        <RegisterPage
          onRegister={async (vals) => {
            const res = await fetch("http://localhost:8080/api/auth/register", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify(vals),
            });
            if (!res.ok) throw new Error(await res.text());
            // After register you can either switch to login or auto-login if your backend does it.
            setView("login");
          }}
          onNavigateToLogin={() => setView("login")}
        />
      );
    }
    return (
      <LoginPage
        onNavigateToRegister={() => setView("register")}
        onLoginSuccess={(u) => {
          setUser(u);
          setView("main");
        }}
      />
    );
  }

  return <MainPage user={user} onLogout={handleLogout} />;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
