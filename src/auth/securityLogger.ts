export enum SecurityEventType {
  AUTH_SUCCESS = "AUTH_SUCCESS",
  AUTH_FAILURE = "AUTH_FAILURE",
  TOKEN_REFRESH = "TOKEN_REFRESH",
  TOKEN_REFRESH_FAILURE = "TOKEN_REFRESH_FAILURE",
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
  DATA_DELETE = "DATA_DELETE",
  USER_CREATED = "USER_CREATED",
  USER_CREATION_DENIED = "USER_CREATION_DENIED",
  PERMISSION_CHANGE = "PERMISSION_CHANGE",
}

interface SecurityEvent {
  type: SecurityEventType;
  ip?: string;
  userId?: string;
  resource: string;
  details?: Record<string, unknown>;
}

export function logSecurityEvent(event: SecurityEvent) {
  const entry = {
    timestamp: new Date().toISOString(),
    level: "SECURITY",
    ...event,
  };

  console.log(JSON.stringify(entry));
}
