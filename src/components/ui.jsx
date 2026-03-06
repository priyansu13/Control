import { useMemo, useState } from "react";

function formatDate(value) {
  if (!value) return "-";
  let date = null;

  if (value instanceof Date) {
    date = value;
  } else if (typeof value === "number") {
    date = new Date(value);
  } else if (typeof value === "string") {
    const gvizMatch = value.match(
      /^Date\((\d{4}),\s*(\d{1,2}),\s*(\d{1,2})(?:,\s*(\d{1,2}),\s*(\d{1,2}),\s*(\d{1,2}))?\)$/
    );
    if (gvizMatch) {
      const [, y, m, d, hh = "0", mm = "0", ss = "0"] = gvizMatch;
      date = new Date(
        Number(y),
        Number(m),
        Number(d),
        Number(hh),
        Number(mm),
        Number(ss)
      );
    } else {
      const cleaned = value.trim();
      date = new Date(cleaned);
    }
  }

  if (!date) return String(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

function StatCard({ label, value, tone = "gold" }) {
  return (
    <article className={`stat-card ${tone}`}>
      <p>{label}</p>
      <h3>{value}</h3>
    </article>
  );
}

function exportCsv(fileName, rows) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((header) => `"${String(row[header] ?? "").replaceAll("\"", '""')}"`)
        .join(",")
    ),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(link.href);
}

function SearchBox({ value, onChange }) {
  return (
    <label className="search-box">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search by guest name, city, relation, message..."
      />
    </label>
  );
}

export { formatDate, StatCard, exportCsv, SearchBox };
