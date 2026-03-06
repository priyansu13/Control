const sampleConfirmation = [
  {
    timestamp: "2026-02-28 16:10",
    fullName: "Aarav Mehta",
    guestCount: 3,
    ceremony: "Sangeet",
    travellingCity: "Mumbai",
  },
  {
    timestamp: "2026-02-27 11:22",
    fullName: "Nisha Verma",
    guestCount: 1,
    ceremony: "Wedding",
    travellingCity: "Delhi",
  },
  {
    timestamp: "2026-02-26 09:02",
    fullName: "Rohan Kapoor",
    guestCount: 2,
    ceremony: "Reception",
    travellingCity: "Jaipur",
  },
];

const sampleBlessings = [
  {
    timestamp: "2026-02-28 18:40",
    message: "May your journey be filled with joy and kindness.",
    private: "No",
  },
  {
    timestamp: "2026-02-27 08:03",
    message: "Wishing you both a lifetime of laughter.",
    private: "Yes",
  },
  {
    timestamp: "2026-02-26 21:30",
    message: "Blessings and love always.",
    private: "No",
  },
];

function parseGoogleVizResponse(text) {
  if (!text.includes("google.visualization.Query.setResponse")) {
    throw new Error(
      "Unable to read Google Sheet data. Your sheet is likely private. Make it viewable by link, or provide a backend/API endpoint."
    );
  }
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) {
    throw new Error("Invalid Google Sheets response format.");
  }
  return JSON.parse(text.slice(start, end + 1));
}

function cellValue(cell) {
  return cell?.v ?? "";
}

function normalizeHeader(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeRows(tableData, keyMap) {
  const columns = tableData.table.cols.map((col) => col.label || col.id || "");
  const rows = tableData.table.rows.map((row) =>
    row.c.map((cell) => cellValue(cell))
  );

  return rows.map((row) => {
    const item = {};
    columns.forEach((columnName, i) => {
      const normalizedColumn = normalizeHeader(columnName);
      const key = Object.keys(keyMap).find((mappedKey) => {
        const aliases = Array.isArray(keyMap[mappedKey])
          ? keyMap[mappedKey]
          : [keyMap[mappedKey]];
        return aliases.some(
          (alias) => normalizeHeader(alias) === normalizedColumn
        );
      });
      if (key) {
        item[key] = row[i];
      }
    });
    return item;
  });
}

async function fetchSheetRows(sheetId, gid, keyMap) {
  if (!sheetId || !gid) {
    return [];
  }

  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&gid=${gid}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch sheet ${gid}.`);
  }
  const raw = await response.text();
  const json = parseGoogleVizResponse(raw);
  return normalizeRows(json, keyMap);
}

function normalizeSheetId(value) {
  if (!value) return "";
  const input = String(value).trim();
  const match = input.match(/\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : input;
}

const confirmationMap = {
  timestamp: ["timestamp", "timestamps"],
  fullName: ["full name", "name"],
  guestCount: [
    "no of guests",
    "no. of guests",
    "number of guests",
    "number of guest",
    "guests count",
  ],
  ceremony: ["ceremony", "which ceremony"],
  travellingCity: [
    "travelling city",
    "traveling city",
    "travelling from city state",
    "travelling from: [city,state]",
    "city",
  ],
};

const blessingMap = {
  timestamp: ["timestamp", "timestamps"],
  message: ["share your blessings", "blessings", "message"],
  private: ["private"],
};

export async function loadDashboardData() {
  const confirmationSheetId = normalizeSheetId(
    import.meta.env.VITE_CONFIRMATION_SHEET_ID ||
      "12opn7s5SpmO2He3GDqa8WaX5pna_Zmb2vOAD7O5_T7o"
  );
  const confirmationGid = import.meta.env.VITE_CONFIRMATION_GID || "5";
  const blessingsSheetId = normalizeSheetId(
    import.meta.env.VITE_BLESSINGS_SHEET_ID ||
      "1OGx9Mfo-YZHw5G4jcld-2F6TOXg7dz-STN1w9LP1sKw"
  );
  const blessingsGid = import.meta.env.VITE_BLESSINGS_GID || "2";

  const hasConfig =
    confirmationSheetId && confirmationGid && blessingsSheetId && blessingsGid;

  if (!hasConfig) {
    return {
      confirmation: sampleConfirmation,
      blessings: sampleBlessings,
      usingSampleData: true,
    };
  }

  const [confirmation, blessings] = await Promise.all([
    fetchSheetRows(confirmationSheetId, confirmationGid, confirmationMap),
    fetchSheetRows(blessingsSheetId, blessingsGid, blessingMap),
  ]);

  return {
    confirmation,
    blessings,
    usingSampleData: false,
  };
}
