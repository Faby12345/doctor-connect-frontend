// MainPage.tsx
import React from "react";

export type User = {
  id: string;
  fullName: string;
  email: string;
  role: "PATIENT" | "DOCTOR" | "ADMIN";
  createdAt: string;
  authenticated?: boolean;
};

export default function MainPage({
  user,
  onLogout,
}: {
  user: User;
  onLogout: () => void;
}) {
  return (
    <div style={{ padding: 24 }}>
      <h2>Welcome, {user.fullName}</h2>
      <p>
        Email: {user.email} — Role: {user.role}
      </p>
      <button
        onClick={onLogout}
        style={{
          padding: "10px 14px",
          borderRadius: 12,
          border: "1px solid #e6eefc",
          cursor: "pointer",
        }}
      >
        Logout
      </button>
    </div>
  );
}
