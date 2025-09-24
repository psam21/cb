/**
 * Error type definitions and categorization for the application
 * Provides consistent error codes and status codes across all services
 */

export enum ErrorCode {
  // Authentication & Authorization Errors (400-499)
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',

  // Validation Errors (400-499)
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT = 'INVALID_FORMAT',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',

  // Resource Errors (400-499)
  NOT_FOUND = 'NOT_FOUND',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  CONTRIBUTION_NOT_FOUND = 'CONTRIBUTION_NOT_FOUND',
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',

  // Conflict Errors (400-499)
  CONFLICT = 'CONFLICT',
  DUPLICATE_RESOURCE = 'DUPLICATE_RESOURCE',
  RESOURCE_ALREADY_EXISTS = 'RESOURCE_ALREADY_EXISTS',

  // External Service Errors (500-599)
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  STORJ_ERROR = 'STORJ_ERROR',
  NOSTR_ERROR = 'NOSTR_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',

  // Signer Authentication Errors (400-499)
  SIGNER_NOT_DETECTED = 'SIGNER_NOT_DETECTED',
  SIGNER_LOCKED = 'SIGNER_LOCKED',
  SIGNER_ERROR = 'SIGNER_ERROR',
  SIGNER_AUTH_FAILED = 'SIGNER_AUTH_FAILED',
  SIGNER_PROFILE_NOT_FOUND = 'SIGNER_PROFILE_NOT_FOUND',

  // Internal Server Errors (500-599)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_CONNECTION_ERROR = 'DATABASE_CONNECTION_ERROR',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export enum HttpStatus {
  // Client Errors
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  UNPROCESSABLE_ENTITY = 422,
  TOO_MANY_REQUESTS = 429,

  // Server Errors
  INTERNAL_SERVER_ERROR = 500,
  NOT_IMPLEMENTED = 501,
  BAD_GATEWAY = 502,
  SERVICE_UNAVAILABLE = 503,
  GATEWAY_TIMEOUT = 504,
}

/**
 * Error category for grouping related errors
 */
export enum ErrorCategory {
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  VALIDATION = 'VALIDATION',
  RESOURCE = 'RESOURCE',
  EXTERNAL_SERVICE = 'EXTERNAL_SERVICE',
  INTERNAL = 'INTERNAL',
  NETWORK = 'NETWORK',
}

/**
 * Error severity levels for logging and monitoring
 */
export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

/**
 * Interface for error metadata
 */
export interface ErrorMetadata {
  category: ErrorCategory;
  severity: ErrorSeverity;
  retryable: boolean;
  userVisible: boolean;
  context?: Record<string, unknown>;
}

/**
 * Error type mapping for quick lookup
 */
export const ERROR_TYPE_MAP: Record<ErrorCode, ErrorMetadata> = {
  [ErrorCode.UNAUTHORIZED]: {
    category: ErrorCategory.AUTHENTICATION,
    severity: ErrorSeverity.MEDIUM,
    retryable: false,
    userVisible: true,
  },
  [ErrorCode.FORBIDDEN]: {
    category: ErrorCategory.AUTHORIZATION,
    severity: ErrorSeverity.MEDIUM,
    retryable: false,
    userVisible: true,
  },
  [ErrorCode.INVALID_CREDENTIALS]: {
    category: ErrorCategory.AUTHENTICATION,
    severity: ErrorSeverity.LOW,
    retryable: false,
    userVisible: true,
  },
  [ErrorCode.TOKEN_EXPIRED]: {
    category: ErrorCategory.AUTHENTICATION,
    severity: ErrorSeverity.LOW,
    retryable: false,
    userVisible: true,
  },
  [ErrorCode.INSUFFICIENT_PERMISSIONS]: {
    category: ErrorCategory.AUTHORIZATION,
    severity: ErrorSeverity.MEDIUM,
    retryable: false,
    userVisible: true,
  },
  [ErrorCode.VALIDATION_ERROR]: {
    category: ErrorCategory.VALIDATION,
    severity: ErrorSeverity.LOW,
    retryable: false,
    userVisible: true,
  },
  [ErrorCode.INVALID_INPUT]: {
    category: ErrorCategory.VALIDATION,
    severity: ErrorSeverity.LOW,
    retryable: false,
    userVisible: true,
  },
  [ErrorCode.MISSING_REQUIRED_FIELD]: {
    category: ErrorCategory.VALIDATION,
    severity: ErrorSeverity.LOW,
    retryable: false,
    userVisible: true,
  },
  [ErrorCode.INVALID_FORMAT]: {
    category: ErrorCategory.VALIDATION,
    severity: ErrorSeverity.LOW,
    retryable: false,
    userVisible: true,
  },
  [ErrorCode.FILE_TOO_LARGE]: {
    category: ErrorCategory.VALIDATION,
    severity: ErrorSeverity.LOW,
    retryable: false,
    userVisible: true,
  },
  [ErrorCode.INVALID_FILE_TYPE]: {
    category: ErrorCategory.VALIDATION,
    severity: ErrorSeverity.LOW,
    retryable: false,
    userVisible: true,
  },
  [ErrorCode.NOT_FOUND]: {
    category: ErrorCategory.RESOURCE,
    severity: ErrorSeverity.LOW,
    retryable: false,
    userVisible: true,
  },
  [ErrorCode.RESOURCE_NOT_FOUND]: {
    category: ErrorCategory.RESOURCE,
    severity: ErrorSeverity.LOW,
    retryable: false,
    userVisible: true,
  },
  [ErrorCode.USER_NOT_FOUND]: {
    category: ErrorCategory.RESOURCE,
    severity: ErrorSeverity.LOW,
    retryable: false,
    userVisible: true,
  },
  [ErrorCode.CONTRIBUTION_NOT_FOUND]: {
    category: ErrorCategory.RESOURCE,
    severity: ErrorSeverity.LOW,
    retryable: false,
    userVisible: true,
  },
  [ErrorCode.FILE_NOT_FOUND]: {
    category: ErrorCategory.RESOURCE,
    severity: ErrorSeverity.LOW,
    retryable: false,
    userVisible: true,
  },
  [ErrorCode.CONFLICT]: {
    category: ErrorCategory.RESOURCE,
    severity: ErrorSeverity.MEDIUM,
    retryable: false,
    userVisible: true,
  },
  [ErrorCode.DUPLICATE_RESOURCE]: {
    category: ErrorCategory.RESOURCE,
    severity: ErrorSeverity.MEDIUM,
    retryable: false,
    userVisible: true,
  },
  [ErrorCode.RESOURCE_ALREADY_EXISTS]: {
    category: ErrorCategory.RESOURCE,
    severity: ErrorSeverity.MEDIUM,
    retryable: false,
    userVisible: true,
  },
  [ErrorCode.EXTERNAL_SERVICE_ERROR]: {
    category: ErrorCategory.EXTERNAL_SERVICE,
    severity: ErrorSeverity.HIGH,
    retryable: true,
    userVisible: false,
  },
  [ErrorCode.STORJ_ERROR]: {
    category: ErrorCategory.EXTERNAL_SERVICE,
    severity: ErrorSeverity.HIGH,
    retryable: true,
    userVisible: false,
  },
  [ErrorCode.NOSTR_ERROR]: {
    category: ErrorCategory.EXTERNAL_SERVICE,
    severity: ErrorSeverity.HIGH,
    retryable: true,
    userVisible: false,
  },
  [ErrorCode.DATABASE_ERROR]: {
    category: ErrorCategory.EXTERNAL_SERVICE,
    severity: ErrorSeverity.HIGH,
    retryable: true,
    userVisible: false,
  },
  [ErrorCode.NETWORK_ERROR]: {
    category: ErrorCategory.NETWORK,
    severity: ErrorSeverity.MEDIUM,
    retryable: true,
    userVisible: false,
  },
  [ErrorCode.INTERNAL_ERROR]: {
    category: ErrorCategory.INTERNAL,
    severity: ErrorSeverity.CRITICAL,
    retryable: false,
    userVisible: false,
  },
  [ErrorCode.DATABASE_CONNECTION_ERROR]: {
    category: ErrorCategory.INTERNAL,
    severity: ErrorSeverity.CRITICAL,
    retryable: true,
    userVisible: false,
  },
  [ErrorCode.CONFIGURATION_ERROR]: {
    category: ErrorCategory.INTERNAL,
    severity: ErrorSeverity.CRITICAL,
    retryable: false,
    userVisible: false,
  },
  [ErrorCode.UNKNOWN_ERROR]: {
    category: ErrorCategory.INTERNAL,
    severity: ErrorSeverity.CRITICAL,
    retryable: false,
    userVisible: false,
  },
  [ErrorCode.SIGNER_NOT_DETECTED]: {
    category: ErrorCategory.AUTHENTICATION,
    severity: ErrorSeverity.MEDIUM,
    retryable: false,
    userVisible: true,
  },
  [ErrorCode.SIGNER_LOCKED]: {
    category: ErrorCategory.AUTHENTICATION,
    severity: ErrorSeverity.MEDIUM,
    retryable: false,
    userVisible: true,
  },
  [ErrorCode.SIGNER_ERROR]: {
    category: ErrorCategory.AUTHENTICATION,
    severity: ErrorSeverity.HIGH,
    retryable: false,
    userVisible: true,
  },
  [ErrorCode.SIGNER_AUTH_FAILED]: {
    category: ErrorCategory.AUTHENTICATION,
    severity: ErrorSeverity.MEDIUM,
    retryable: false,
    userVisible: true,
  },
  [ErrorCode.SIGNER_PROFILE_NOT_FOUND]: {
    category: ErrorCategory.AUTHENTICATION,
    severity: ErrorSeverity.MEDIUM,
    retryable: false,
    userVisible: true,
  },
};

/**
 * Helper function to get error metadata for a given error code
 */
export function getErrorMetadata(errorCode: ErrorCode): ErrorMetadata {
  return ERROR_TYPE_MAP[errorCode];
}

/**
 * Helper function to check if an error is retryable
 */
export function isRetryableError(errorCode: ErrorCode): boolean {
  return ERROR_TYPE_MAP[errorCode]?.retryable || false;
}

/**
 * Helper function to check if an error should be visible to users
 */
export function isUserVisibleError(errorCode: ErrorCode): boolean {
  return ERROR_TYPE_MAP[errorCode]?.userVisible || false;
}
