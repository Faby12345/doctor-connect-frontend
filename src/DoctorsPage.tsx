import React, { useEffect, useMemo, useState } from "react";
import DoctorCard from "./components/DoctorCard";

import useDebounce from "./hooks/useDebounce";
import "./doctors.css";

 // same shape as our card

export type DoctorRow = {
id: string;
fullName: string;
specialty: string;
city: string;
priceMinCents: number;
priceMaxCents: number;
verified: boolean;
ratingAvg: number; // 0..5
ratingCount: number;
//nextSlots?: string[];
};
export default function DoctorsPage() {
  // ---------- UI state (controlled inputs) ----------
  const [specialty, setSpecialty] = useState("");
  const [city, setCity] = useState("");
  const [minPrice, setMinPrice] = useState<number | "">("");
  const [maxPrice, setMaxPrice] = useState<number | "">("");
  const [onlyVerified, setOnlyVerified] = useState(false);
  const [sort, setSort] = useState<"relevance" | "rating" | "priceAsc" | "priceDesc">("relevance");

  // debounce inputs for smoother UX on large lists
  const debSpecialty = useDebounce(specialty, 200);
  const debCity = useDebounce(city, 200);
  const debMin = useDebounce(minPrice, 200);
  const debMax = useDebounce(maxPrice, 200);
  const debVerified = useDebounce(onlyVerified, 100);
  const debSort = useDebounce(sort, 100);

  // data state
  const [rows, setRows] = useState<DoctorRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // load local JSON once
  const BASE_API = "http://localhost:8080/api/doctor";
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("http://localhost:8080/api/doctor/all", { cache: "no-store" });
        if (!res.ok) throw new Error(`Failed to load mock data: ${res.status}`);
        const data = (await res.json()) as DoctorRow[];
        setRows(data);
      } catch (e: any) {
        setError(e?.message ?? "Failed to load mock data");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // filter + sort entirely on client
  const visible = useMemo(() => {
    if (!rows) return null;
    let list = rows;

    const spec = debSpecialty.trim().toLowerCase();
    const cty = debCity.trim().toLowerCase();
    const min = debMin === "" ? null : Number(debMin);
    const max = debMax === "" ? null : Number(debMax);

    if (spec) list = list.filter((d) => d.specialty.toLowerCase().includes(spec));
    if (cty) list = list.filter((d) => d.city.toLowerCase().includes(cty));
    if (min !== null) list = list.filter((d) => d.priceMinCents >= min * 100);
    if (max !== null) list = list.filter((d) => d.priceMaxCents <= max * 100);
    if (debVerified) list = list.filter((d) => d.verified);

    const copy = [...list];
    switch (debSort) {
      case "rating":
        copy.sort((a, b) => b.ratingAvg - a.ratingAvg);
        break;
      case "priceAsc":
        copy.sort((a, b) => a.priceMinCents - b.priceMinCents);
        break;
      case "priceDesc":
        copy.sort((a, b) => b.priceMinCents - a.priceMinCents);
        break;
      default:
        // relevance – keep original order from JSON for now
        break;
    }

    return copy;
  }, [rows, debSpecialty, debCity, debMin, debMax, debVerified, debSort]);

  const count = visible?.length ?? 0;

  return (
    <div className="pageWrap">
      <h2 className="pageTitle">Find a Doctor</h2>

      {/* Filters row */}
      <div className="filters" role="region" aria-label="filters">
        <div>
          <label>Specialty</label>
          <input className="input" value={specialty} onChange={(e) => setSpecialty(e.target.value)} placeholder="Dermatology" />
        </div>
        <div>
          <label>City</label>
          <input className="input" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Bucharest" />
        </div>
        <div>
          <label>Min Price (RON)</label>
          <input className="input" inputMode="numeric" pattern="[0-9]*" value={minPrice}
            onChange={(e) => setMinPrice(e.target.value === "" ? "" : Number(e.target.value))} />
        </div>
        <div>
          <label>Max Price (RON)</label>
          <input className="input" inputMode="numeric" pattern="[0-9]*" value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value === "" ? "" : Number(e.target.value))} />
        </div>
        <div>
          <label>Sort</label>
          <select className="select" value={sort} onChange={(e) => setSort(e.target.value as any)}>
            <option value="relevance">Relevance</option>
            <option value="rating">Rating</option>
            <option value="priceAsc">Price ↑</option>
            <option value="priceDesc">Price ↓</option>
          </select>
        </div>
        <label className="checkboxRow">
          <input type="checkbox" checked={onlyVerified} onChange={(e) => setOnlyVerified(e.target.checked)} />
          Only verified
        </label>
      </div>

      {/* Toolbar */}
      <div className="toolbar" aria-live="polite">
        <span>{loading ? "Loading…" : `${count} doctors`}</span>
        <span className="spacer" />
        {/* room for future chips like Active filters */}
      </div>

      {/* Results */}
      {error && <div className="errorState">Error: {error}</div>}

      {loading ? (
        <div className="cardsGrid" aria-hidden>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeletonCard">
              <div className="shimmer lg" />
              <div className="shimmer md" />
              <div className="shimmer md" />
              <div className="shimmer sm" />
            </div>
          ))}
        </div>
      ) : visible && visible.length === 0 ? (
        <div className="emptyState">No doctors match your filters.</div>
      ) : (
        <div className="cardsGrid">
          {visible?.map((r) => (
            <DoctorCard key={r.id} d={r} onView={(id) => alert(`Open /doctor/${id}`)} />
          ))}
        </div>
      )}
    </div>
  );
}