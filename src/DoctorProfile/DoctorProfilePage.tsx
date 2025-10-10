import React, { useEffect, useMemo, useRef, useState } from "react";
import "./DoctorsProfilePage.css";

export type DoctorMe = {
  id: string;
  fullName: string;
  specialty: string;
  avatarUrl?: string | null;
  bio?: string | null;
  yearsOfExperience?: number | null;
  languages?: string[] | null;
  contact: { email: string; phone?: string | null; website?: string | null };
  clinic?: {
    name: string;
    addressLine1?: string | null;
    addressLine2?: string | null;
    city?: string | null;
    state?: string | null;
    zip?: string | null;
    country?: string | null;
  } | null;
  availability?: Array<{ dayOfWeek: number; start: string; end: string }> | null;
  stats?: { patientsCount?: number | null; appointmentsToday?: number | null; rating?: number | null } | null;
};

type FetchState =
  | { status: "idle" | "loading" }
  | { status: "ready"; data: DoctorMe }
  | { status: "error"; message: string; code?: number };

//const ME_ENDPOINT = import.meta.env.VITE_ME_ENDPOINT || "http://localhost:8080/api/doctors/me";

const ME_ENDPOINT = "/data/doctorProfile.json";
function dayName(idx: number) {
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][idx] ?? `Day ${idx}`;
}

export default function DoctorProfile() {
  const [state, setState] = useState<FetchState>({ status: "idle" });
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    (async () => {
      try {
        setState({ status: "loading" });
        const res = await fetch(ME_ENDPOINT, { credentials: "include", signal: ctrl.signal });
        if (!res.ok) {
          setState({
            status: "error",
            code: res.status,
            message:
              res.status === 401
                ? "You’re not signed in."
                : res.status === 403
                ? "You’re not allowed to view this page."
                : `Unexpected error (${res.status}).`,
          });
          return;
        }
        const data = (await res.json()) as DoctorMe;
        setState({ status: "ready", data });
      } catch (e: any) {
        if (e?.name !== "AbortError") {
          setState({ status: "error", message: "Network error loading profile." });
        }
      }
    })();
    return () => ctrl.abort();
  }, []);

  // ✅ Hooks below are called on every render (no early return above)
  const d = state.status === "ready" ? state.data : undefined;

  const availability = useMemo(() => {
    const slots = d?.availability ?? [];
    return [...slots].sort((a, b) => a.dayOfWeek - b.dayOfWeek);
  }, [d]);

  // Now it’s safe to branch the render
  if (state.status === "loading") {
    return (
      <div className="doctor-profile">
        <div className="card">
          <div className="skeleton skeleton--title" />
          <div className="skeleton skeleton--text" />
          <div className="skeleton skeleton--text" />
        </div>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="doctor-profile">
        <div className="card card--error">
          <strong>Couldn’t load your profile.</strong>
          <div className="card__spacer" />
          <div>{state.message}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="doctor-profile">
      <header className="doctor-profile__header">
        <div className="doctor-profile__avatar">
          {d?.avatarUrl ? (
            <img src={d.avatarUrl} alt={`${d.fullName} avatar`} />
          ) : (
            <div className="doctor-profile__avatar-fallback">
              {d?.fullName?.charAt(0)?.toUpperCase() ?? "?"}
            </div>
          )}
        </div>
        <div className="doctor-profile__meta">
          <h1 className="doctor-profile__name">{d?.fullName}</h1>
          <div className="doctor-profile__specialty">{d?.specialty}</div>
          <div className="doctor-profile__chips">
            {d?.yearsOfExperience != null && <span className="chip">{d.yearsOfExperience}y experience</span>}
            {d?.stats?.rating != null && <span className="chip">★ {d.stats.rating.toFixed(1)}</span>}
            {!!d?.languages?.length && <span className="chip">{d.languages.join(", ")}</span>}
          </div>
        </div>
      </header>

      <section className="card">
        <h2>About</h2>
        <p className="bio">{d?.bio || "No bio provided yet."}</p>
      </section>

      <section className="grid">
        <div className="card">
          <h2>Contact</h2>
          <ul className="list">
            <li>
              <span className="list__label">Email</span>
              <a href={`mailto:${d?.contact.email}`}>{d?.contact.email}</a>
            </li>
            {d?.contact.phone && (
              <li>
                <span className="list__label">Phone</span>
                <a href={`tel:${d.contact.phone}`}>{d.contact.phone}</a>
              </li>
            )}
            {d?.contact.website && (
              <li>
                <span className="list__label">Website</span>
                <a href={d.contact.website} target="_blank" rel="noreferrer">
                  {d.contact.website}
                </a>
              </li>
            )}
          </ul>
        </div>

        <div className="card">
          <h2>Clinic</h2>
          {d?.clinic ? (
            <>
              <div className="clinic-name">{d.clinic.name}</div>
              <address className="clinic-address">
                {[d.clinic.addressLine1, d.clinic.addressLine2].filter(Boolean).join(", ")}
                <br />
                {[d.clinic.city, d.clinic.state, d.clinic.zip].filter(Boolean).join(", ")}
                <br />
                {d.clinic.country}
              </address>
            </>
          ) : (
            "Not set"
          )}
        </div>

        <div className="card">
          <h2>At a glance</h2>
          <div className="stats">
            <div className="stat">
              <div className="stat__value">{d?.stats?.patientsCount ?? "—"}</div>
              <div className="stat__label">Patients</div>
            </div>
            <div className="stat">
              <div className="stat__value">{d?.stats?.appointmentsToday ?? "—"}</div>
              <div className="stat__label">Appointments today</div>
            </div>
            <div className="stat">
              <div className="stat__value">{d?.yearsOfExperience ?? "—"}</div>
              <div className="stat__label">Years</div>
            </div>
          </div>
        </div>
      </section>

      <section className="card">
        <h2>Availability</h2>
        {availability.length ? (
          <ul className="availability">
            {availability.map((s, i) => (
              <li key={`${s.dayOfWeek}-${i}`}>
                <span className="availability__day">{dayName(s.dayOfWeek)}</span>
                <span className="availability__time">
                  {s.start}–{s.end}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          "No weekly schedule set."
        )}
      </section>
    </div>
  );
}
