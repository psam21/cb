import { ErrorCode, HttpStatus, ErrorCategory, ErrorSeverity } from './ErrorTypes';

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly httpStatus: HttpStatus;
  public readonly category: ErrorCategory;
  public readonly severity: ErrorSeverity;
  public readonly context?: Record<string, unknown>;
  public readonly timestamp: Date;

  constructor(
    message: string,
    code: ErrorCode,
    httpStatus: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
    category: ErrorCategory = ErrorCategory.INTERNAL,
    severity: ErrorSeverity = ErrorSeverity.HIGH,
    context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.httpStatus = httpStatus;
    this.category = category;
    this.severity = severity;
    this.context = context;
    this.timestamp = new Date();

    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, AppError.prototype);
  }

  public toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      httpStatus: this.httpStatus,
      category: this.category,
      severity: this.severity,
      context: this.context,
      timestamp: this.timestamp.toISOString(),
      stack: this.stack,
    };
  }

  public toString(): string {
    return `[${this.code}] ${this.message} (${this.httpStatus})`;
  }
}
