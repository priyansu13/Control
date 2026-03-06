import { useEffect, useMemo, useState } from "react";
import { loadDashboardData } from "./api/googleSheets";
import { formatDate } from "./components/ui";

function DonutChart({ data, title }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <section className="chart-panel">
      <header>
        <h3>{title}</h3>
        <p>{total} responses</p>
      </header>
      <div className="donut-wrap">
        <svg viewBox="0 0 160 160" className="donut-svg" role="img" aria-label={title}>
          <circle cx="80" cy="80" r={radius} className="donut-track" />
          {data.map((item) => {
            const fraction = total ? item.value / total : 0;
            const dash = fraction * circumference;
            const segment = (
              <circle
                key={item.label}
                cx="80"
                cy="80"
                r={radius}
                className="donut-segment"
                stroke={item.color}
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={-offset}
              />
            );
            offset += dash;
            return segment;
          })}
        </svg>
        <div className="donut-center">
          <span>Total Responses</span>
          <strong>{total}</strong>
        </div>
      </div>
      <div className="legend">
        {data.map((item) => (
          <div key={item.label}>
            <span style={{ background: item.color }} />
            <p>{item.label}</p>
            <strong>{total ? `${Math.round((item.value / total) * 100)}%` : "0%"}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

function BarChart({ data, title, subtitle }) {
  const max = Math.max(...data.map((item) => item.value), 1);

  return (
    <section className="chart-panel">
      <header>
        <h3>{title}</h3>
        <p>{subtitle}</p>
      </header>
        <div className="bars">
          {data.map((item) => (
            <div className="bar-row" key={item.label}>
              <div className="bar-meta">
                <p>{item.label}</p>
              </div>
              <div className="bar-track-wrap">
                <div className="bar-track">
                  <div
                    className="bar-fill"
                    style={{ width: `${(item.value / max) * 100}%` }}
                  />
                </div>
                <strong className="bar-value">{item.value}</strong>
              </div>
            </div>
          ))}
        </div>
    </section>
  );
}

export default function App() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [usingSampleData, setUsingSampleData] = useState(false);
  const [confirmation, setConfirmation] = useState([]);
  const [blessings, setBlessings] = useState([]);
  const [confirmationSearch, setConfirmationSearch] = useState("");
  const [blessingTrayOpen, setBlessingTrayOpen] = useState(false);
  const [showContent, setShowContent] = useState(false);
  // PWA install helpers removed per request.

  function playEnvelopeSound() {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.14, ctx.sampleRate);
    const channel = noiseBuffer.getChannelData(0);
    for (let i = 0; i < channel.length; i += 1) {
      channel[i] = (Math.random() * 2 - 1) * (1 - i / channel.length);
    }

    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = "bandpass";
    noiseFilter.frequency.setValueAtTime(1400, now);
    noiseFilter.Q.setValueAtTime(0.8, now);
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.0001, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.16, now + 0.015);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(now);
    noise.stop(now + 0.16);

    const flapOsc = ctx.createOscillator();
    const flapGain = ctx.createGain();
    flapOsc.type = "triangle";
    flapOsc.frequency.setValueAtTime(260, now + 0.02);
    flapOsc.frequency.exponentialRampToValueAtTime(180, now + 0.16);
    flapGain.gain.setValueAtTime(0.0001, now + 0.02);
    flapGain.gain.exponentialRampToValueAtTime(0.05, now + 0.04);
    flapGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
    flapOsc.connect(flapGain);
    flapGain.connect(ctx.destination);
    flapOsc.start(now + 0.02);
    flapOsc.stop(now + 0.2);

    setTimeout(() => {
      ctx.close();
    }, 280);
  }

  useEffect(() => {
    let active = true;

    async function fetchData() {
      try {
        const data = await loadDashboardData();
        if (!active) return;
        setConfirmation(data.confirmation || []);
        setBlessings(data.blessings || []);
        setUsingSampleData(Boolean(data.usingSampleData));
      } catch (err) {
        if (active) {
          setError(err.message || "Unable to load dashboard data.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchData();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (loading) return;
    const timer = setTimeout(() => setShowContent(true), 220);
    return () => clearTimeout(timer);
  }, [loading]);

  const totalResponses = confirmation.length;
  const totalBlessings = blessings.length;
  const totalGuests = confirmation.reduce(
    (sum, item) => sum + Number(item.guestCount || 0),
    0
  );

  const ceremonyData = useMemo(() => {
    const palette = ["#d94a43", "#2f6edb", "#e58a2f", "#6c4fb7", "#2f9d7a"];
    const counts = confirmation.reduce((map, row) => {
      const key = String(row.ceremony || "Unknown").trim() || "Unknown";
      map.set(key, (map.get(key) || 0) + 1);
      return map;
    }, new Map());

    const sorted = [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([label, value], i) => ({ label, value, color: palette[i % palette.length] }));

    if (sorted.length <= 4) {
      return sorted;
    }

    const topThree = sorted.slice(0, 3);
    const others = sorted
      .slice(3)
      .reduce((sum, item) => sum + item.value, 0);

    return [...topThree, { label: "Others", value: others, color: "#9c8f84" }];
  }, [confirmation]);

  const cityData = useMemo(() => {
    const toDisplayCity = (value) => {
      const cleaned = String(value || "").trim().replace(/\s+/g, " ");
      if (!cleaned) return "Unknown";
      if (cleaned.toLowerCase() === "unknown") return "Unknown";
      const primary = cleaned.split(",")[0].trim() || cleaned;
      return primary
        .split(" ")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(" ");
    };

    const toCityKey = (cityLabel) => {
      return cityLabel
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .trim();
    };

    const counts = confirmation.reduce((map, row) => {
      const display = toDisplayCity(row.travellingCity);
      const normalizedKey = toCityKey(display) || "unknown";
      const current = map.get(normalizedKey) || { label: display, value: 0 };
      map.set(normalizedKey, { label: current.label, value: current.value + 1 });
      return map;
    }, new Map());

    return [...counts.values()]
      .sort((a, b) => b.value - a.value)
      .slice(0, 6)
      .map(({ label, value }) => ({ label, value }));
  }, [confirmation]);

  const filteredConfirmation = useMemo(() => {
    if (!confirmationSearch.trim()) return confirmation;
    const q = confirmationSearch.toLowerCase();
    return confirmation.filter((row) =>
      [row.fullName, row.ceremony, row.travellingCity, row.guestCount]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [confirmation, confirmationSearch]);

  if (loading || !showContent) {
    return (
      <div className="page center">
        <div className="loader" role="img" aria-label="Loading">
          <span className="loader-text">CR</span>
          <span className="loader-core" />
          <span className="loader-orbit loader-orbit-one" />
          <span className="loader-orbit loader-orbit-two" />
          <span className="loader-orbit loader-orbit-three" />
        </div>
      </div>
    );
  }

  return (
    <div className="page page-enter">
      <button
        className={`envelope-trigger ${blessingTrayOpen ? "open" : ""}`}
        onClick={() => {
          playEnvelopeSound();
          setBlessingTrayOpen((prev) => !prev);
        }}
        aria-label="Open blessings notifications"
      >
        <span className="paper-envelope">
          <span className="paper-letter" />
          <span className="paper-stamp">S</span>
        </span>
        <span className="notify-badge">
          <em />
          {`${totalBlessings} blessings`}
        </span>
      </button>

      {blessingTrayOpen && (
        <aside className="blessing-tray">
          <header>
            <h4>Blessing Notifications</h4>
            <button onClick={() => setBlessingTrayOpen(false)}>Close</button>
          </header>
          <p className="tray-hint">Click to open blessings</p>
          <div className="tray-list">
            {blessings.map((item, index) => (
              <details key={`${item.timestamp}-${index}`} className="tray-item">
                <summary>
                  <strong>{`Blessing ${index + 1}`}</strong>
                  <p>{formatDate(item.timestamp)}</p>
                </summary>
                <div className="tray-message">{item.message || "No message"}</div>
              </details>
            ))}
          </div>
        </aside>
      )}

      <header className="topbar">
        <div className="title-row">
          <h1>Control Room</h1>
        </div>
      </header>

      {usingSampleData && (
        <section className="notice">Currently showing sample data until sheets are readable.</section>
      )}
      {error && <section className="error">{error}</section>}

      <section className="summary-strip">
        <p>
          Confirmations <strong>{totalResponses}</strong>
        </p>
        <span />
        <p>
          Estimated Guests <strong>{totalGuests}</strong>
        </p>
        <span />
        <p>
          Blessings <strong>{totalBlessings}</strong>
        </p>
      </section>

      <section className="chart-grid">
        <DonutChart data={ceremonyData.length ? ceremonyData : [{ label: "No Data", value: 1, color: "#b8aba0" }]} title="Ceremony Response Split" />
        <BarChart data={cityData.length ? cityData : [{ label: "No Data", value: 0 }]} title="Top Travelling Cities" subtitle="Most frequent city/state sources" />
      </section>

      <section className="clean-section">
        <div className="panel-head">
          <h3>Guest List</h3>
          <label className="guest-search" aria-label="Search guests">
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M10.5 4a6.5 6.5 0 1 0 4.23 11.44l3.9 3.9a1 1 0 0 0 1.42-1.41l-3.9-3.9A6.5 6.5 0 0 0 10.5 4Zm0 2a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9Z" />
            </svg>
            <input
              value={confirmationSearch}
              onChange={(e) => setConfirmationSearch(e.target.value)}
              placeholder="Search name, city, ceremony..."
            />
            {confirmationSearch && (
              <button
                type="button"
                className="search-clear"
                onClick={() => setConfirmationSearch("")}
                aria-label="Clear guest search"
              >
                Clear
              </button>
            )}
          </label>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Guest Name</th>
                <th>No. of Guests</th>
                <th>Ceremony</th>
                <th>Travelling From</th>
                <th>Submitted At</th>
              </tr>
            </thead>
            <tbody>
              {filteredConfirmation.map((row, i) => (
                <tr key={`${row.fullName}-${row.timestamp}-${i}`}>
                  <td>{row.fullName || "-"}</td>
                  <td>{row.guestCount || "-"}</td>
                  <td>{row.ceremony || "-"}</td>
                  <td>{row.travellingCity || "-"}</td>
                  <td>{formatDate(row.timestamp)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

    </div>
  );
}
