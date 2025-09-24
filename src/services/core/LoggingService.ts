/**
 * Centralized logging service for the application
 * Provides structured, context-aware logging with different levels
 */
import { ErrorCode, getErrorMetadata } from '../../errors/ErrorTypes';

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

export interface LogContext {
  userId?: string;
  requestId?: string;
  service?: string;
  method?: string;
  [key: string]: unknown;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context: LogContext;
  error?: Error;
  metadata?: Record<string, unknown>;
}

export interface LoggingServiceConfig {
  minLevel: LogLevel;
  enableConsole: boolean;
  enableFile?: boolean;
  logFilePath?: string;
  format?: 'json' | 'text';
  includeTimestamp: boolean;
  includeContext: boolean;
}

/**
 * Centralized logging service
 */
export class LoggingService {
  private static instance: LoggingService;
  private config: LoggingServiceConfig;
  private isInitialized: boolean = false;

  private constructor() {
    this.config = {
      minLevel: LogLevel.INFO,
      enableConsole: true,
      enableFile: false,
      includeTimestamp: true,
      includeContext: true,
    };
  }

  /**
   * Get singleton instance of LoggingService
   */
  public static getInstance(): LoggingService {
    if (!LoggingService.instance) {
      LoggingService.instance = new LoggingService();
    }
    return LoggingService.instance;
  }

  /**
   * Initialize the logging service with configuration
   */
  public initialize(config: Partial<LoggingServiceConfig>): void {
    this.config = { ...this.config, ...config };
    this.isInitialized = true;
    
    this.info('LoggingService initialized', {
      service: 'LoggingService',
      method: 'initialize',
      config: this.config,
    });
  }

  /**
   * Log a debug message
   */
  public debug(message: string, context: LogContext = {}): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  /**
   * Log an info message
   */
  public info(message: string, context: LogContext = {}): void {
    this.log(LogLevel.INFO, message, context);
  }

  /**
   * Log a warning message
   */
  public warn(message: string, context: LogContext = {}): void {
    this.log(LogLevel.WARN, message, context);
  }

  /**
   * Log an error message
   */
  public error(message: string, error?: Error, context: LogContext = {}): void {
    this.log(LogLevel.ERROR, message, context, error);
  }

  /**
   * Log an application error with proper categorization
   */
  public logAppError(message: string, errorCode: ErrorCode, error?: Error, context: LogContext = {}): void {
    const metadata = getErrorMetadata(errorCode);
    const enhancedContext = {
      ...context,
      errorCode,
      errorCategory: metadata.category,
      errorSeverity: metadata.severity,
      retryable: metadata.retryable,
    };

    this.error(message, error, enhancedContext);
  }

  /**
   * Log performance metrics
   */
  public logPerformance(operation: string, duration: number, context: LogContext = {}): void {
    const enhancedContext = {
      ...context,
      operation,
      duration,
      unit: 'ms',
    };

    this.info(`Performance: ${operation} completed in ${duration}ms`, enhancedContext);
  }

  /**
   * Log API request/response
   */
  public logApiRequest(method: string, url: string, statusCode: number, duration: number, context: LogContext = {}): void {
    const enhancedContext = {
      ...context,
      method,
      url,
      statusCode,
      duration,
      unit: 'ms',
    };

    const level = statusCode >= 400 ? LogLevel.ERROR : LogLevel.INFO;
    const message = `API ${method} ${url} - ${statusCode} (${duration}ms)`;
    
    this.log(level, message, enhancedContext);
  }

  /**
   * Core logging method
   */
  private log(level: LogLevel, message: string, context: LogContext = {}, error?: Error): void {
    if (!this.shouldLog(level)) {
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      error,
      metadata: this.extractMetadata(error),
    };

    this.writeLog(logEntry);
  }

  /**
   * Check if the given log level should be logged
   */
  private shouldLog(level: LogLevel): boolean {
    const levelPriority = {
      [LogLevel.DEBUG]: 0,
      [LogLevel.INFO]: 1,
      [LogLevel.WARN]: 2,
      [LogLevel.ERROR]: 3,
    };

    return levelPriority[level] >= levelPriority[this.config.minLevel];
  }

  /**
   * Extract metadata from an error object
   */
  private extractMetadata(error?: Error): Record<string, unknown> | undefined {
    if (!error) return undefined;

    const errorObj = error as unknown as Record<string, unknown>;
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      ...(errorObj.details && typeof errorObj.details === 'object' ? errorObj.details : {}), // Extract custom details if they exist
    };
  }

  /**
   * Write log entry to configured outputs
   */
  private writeLog(logEntry: LogEntry): void {
    if (this.config.enableConsole) {
      this.writeToConsole(logEntry);
    }

  }

  /**
   * Write log entry to console
   */
  private writeToConsole(logEntry: LogEntry): void {
    const { level, message, context, error, metadata } = logEntry;
    
    let output = `[${level}] ${message}`;
    
    if (this.config.includeTimestamp) {
      output = `[${logEntry.timestamp}] ${output}`;
    }
    
    if (this.config.includeContext && Object.keys(context).length > 0) {
      output += ` | Context: ${JSON.stringify(context)}`;
    }
    
    if (metadata) {
      output += ` | Metadata: ${JSON.stringify(metadata)}`;
    }

    switch (level) {
      case LogLevel.DEBUG:
        console.debug(output);
        break;
      case LogLevel.INFO:
        console.info(output);
        break;
      case LogLevel.WARN:
        console.warn(output);
        break;
      case LogLevel.ERROR:
        console.error(output);
        if (error) {
          console.error('Error details:', error);
        }
        break;
    }
  }


  /**
   * Get current configuration
   */
  public getConfig(): LoggingServiceConfig {
    return { ...this.config };
  }

  /**
   * Update configuration at runtime
   */
  public updateConfig(updates: Partial<LoggingServiceConfig>): void {
    this.config = { ...this.config, ...updates };
    
    this.info('LoggingService configuration updated', {
      service: 'LoggingService',
      method: 'updateConfig',
      config: this.config,
    });
  }
}

// Export singleton instance
export const logger = LoggingService.getInstance();

// Export convenience functions for quick logging
export const logDebug = (message: string, context?: LogContext) => logger.debug(message, context);
export const logInfo = (message: string, context?: LogContext) => logger.info(message, context);
export const logWarn = (message: string, context?: LogContext) => logger.warn(message, context);
export const logError = (message: string, error?: Error, context?: LogContext) => logger.error(message, error, context);
export const logAppError = (message: string, errorCode: ErrorCode, error?: Error, context?: LogContext) => 
  logger.logAppError(message, errorCode, error, context);
export const logPerformance = (operation: string, duration: number, context?: LogContext) => 
  logger.logPerformance(operation, duration, context);
export const logApiRequest = (method: string, url: string, statusCode: number, duration: number, context?: LogContext) => 
  logger.logApiRequest(method, url, statusCode, duration, context);
