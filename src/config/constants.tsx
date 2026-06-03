const CONSTANTS = {
  TIMEZONE: "America/Mexico_City",
  BATCHES_RECORDS: Number(process.env.BATCHES_RECORDS) || 5000,
  BATCHES_CSV_LINES: Number(process.env.BATCHES_CSV_LINES) || 10000,
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
  },
  PRINTERS_TIMEOUT: Number(process.env.PRINTERS_TIMEOUT) || 10000,
  TOKEN_EXPIRACY: {
    ACCESS: process.env.TOKEN_EXPIRACY_ACCESS || "1h",
    REFRESH: process.env.TOKEN_EXPIRACY_REFRESH || "1d",
  },
  RATE_LIMIT: {
    AUTH_LOGIN: {
      REQUESTS: 10,
      WINDOW: "15 m",
    },
    AUTH_REFRESH: {
      REQUESTS: 60,
      WINDOW: "15 m",
    },
    // Default bucket for all web + mobile endpoints that aren't auth or
    // dashboard. Keyed per-user (web session) or per-IP (mobile / pre-auth).
    API: {
      REQUESTS: 60,
      WINDOW: "1 m",
    },
    // Read-only dashboard KPI endpoints: fired in parallel (3 per filter change)
    // plus 30s polling. Keyed per-user, so a generous budget is safe.
    DASHBOARD: {
      REQUESTS: 120,
      WINDOW: "1 m",
    },
  },
};

export default CONSTANTS;
