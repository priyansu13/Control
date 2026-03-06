# Wedding Dashboard Setup

## 1) Install and run

```bash
npm install
npm run dev
```

## 2) Connect Google Sheets

Create a `.env` file in project root:

```env
VITE_CONFIRMATION_SHEET_ID=12opn7s5SpmO2He3GDqa8WaX5pna_Zmb2vOAD7O5_T7o
VITE_CONFIRMATION_GID=5
VITE_BLESSINGS_SHEET_ID=1OGx9Mfo-YZHw5G4jcld-2F6TOXg7dz-STN1w9LP1sKw
VITE_BLESSINGS_GID=2
```

## 3) Important

- Your sheets must be readable by link (`Anyone with the link can view`) for browser-side fetch.
- If your sheets are private, this frontend cannot read them directly. Use a backend/API proxy or make those tabs viewable.
- Current column mapping defaults are in `src/api/googleSheets.js`:
  - Confirmation: `timestamp`, `full name`, `no. of guests`, `ceremony`, `travelling city`
  - Blessings: `timestamps`, `share your blessings`, `private`
- If your form column titles are different, update the mapping values in that file.

## 4) Features

- RSVP metrics cards
- Confirmation table with search/filter
- Blessings cards view
- CSV export (all + filtered)
- Mobile responsive design
