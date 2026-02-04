const CONSTANTS = {
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
    AUTH: {
      REQUESTS: 10,
      WINDOW: "15 m",
    },
    API: {
      REQUESTS: 30,
      WINDOW: "1 m",
    },
  },
};

export default CONSTANTS;
