/**
 * Logger utility class that provides different logging levels
 * and only shows logs in development mode
 */
class Logger {
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  /**
   * Log info messages (blue color in development)
   */
  info(message: string, ...args: any[]): void {
    if (this.isDevelopment) {
      console.log(`%c[INFO] ${message}`, 'color: #3b82f6; font-weight: bold;', ...args);
    }
  }

  /**
   * Log success messages (green color in development)
   */
  success(message: string, ...args: any[]): void {
    if (this.isDevelopment) {
      console.log(`%c[SUCCESS] ${message}`, 'color: #10b981; font-weight: bold;', ...args);
    }
  }

  /**
   * Log warning messages (yellow color in development)
   */
  warn(message: string, ...args: any[]): void {
    if (this.isDevelopment) {
      console.warn(`%c[WARN] ${message}`, 'color: #f59e0b; font-weight: bold;', ...args);
    }
  }

  /**
   * Log error messages (red color in development)
   */
  error(message: string, ...args: any[]): void {
    if (this.isDevelopment) {
      console.error(`%c[ERROR] ${message}`, 'color: #ef4444; font-weight: bold;', ...args);
    }
  }

  /**
   * Log debug messages (gray color in development)
   */
  debug(message: string, ...args: any[]): void {
    if (this.isDevelopment) {
      console.log(`%c[DEBUG] ${message}`, 'color: #6b7280; font-weight: bold;', ...args);
    }
  }

  /**
   * Log trace messages (purple color in development)
   */
  trace(message: string, ...args: any[]): void {
    if (this.isDevelopment) {
      console.log(`%c[TRACE] ${message}`, 'color: #8b5cf6; font-weight: bold;', ...args);
    }
  }

  /**
   * Log with custom level and color
   */
  log(level: string, message: string, color: string = '#ffffff', ...args: any[]): void {
    if (this.isDevelopment) {
      console.log(`%c[${level.toUpperCase()}] ${message}`, `color: ${color}; font-weight: bold;`, ...args);
    }
  }

  /**
   * Log table data (only in development)
   */
  table(data: any): void {
    if (this.isDevelopment) {
      console.table(data);
    }
  }

  /**
   * Log group of related logs (only in development)
   */
  group(label: string): void {
    if (this.isDevelopment) {
      console.group(label);
    }
  }

  /**
   * End a log group (only in development)
   */
  groupEnd(): void {
    if (this.isDevelopment) {
      console.groupEnd();
    }
  }

  /**
   * Log time measurement (only in development)
   */
  time(label: string): void {
    if (this.isDevelopment) {
      console.time(label);
    }
  }

  /**
   * End time measurement (only in development)
   */
  timeEnd(label: string): void {
    if (this.isDevelopment) {
      console.timeEnd(label);
    }
  }

  /**
   * Clear console (only in development)
   */
  clear(): void {
    if (this.isDevelopment) {
      console.clear();
    }
  }

  /**
   * Check if logging is enabled
   */
  isEnabled(): boolean {
    return this.isDevelopment;
  }

  /**
   * Force log regardless of environment (useful for critical errors)
   */
  force(message: string, ...args: any[]): void {
    console.log(`%c[FORCE] ${message}`, 'color: #dc2626; font-weight: bold; background: #fee2e2; padding: 2px 4px; border-radius: 4px;', ...args);
  }
}

// Create and export a singleton instance
export const logger = new Logger();

// Export the class for custom instances if needed
export { Logger };

// Export convenience methods
export const logInfo = (message: string, ...args: any[]) => logger.info(message, ...args);
export const logSuccess = (message: string, ...args: any[]) => logger.success(message, ...args);
export const logWarn = (message: string, ...args: any[]) => logger.warn(message, ...args);
export const logError = (message: string, ...args: any[]) => logger.error(message, ...args);
export const logDebug = (message: string, ...args: any[]) => logger.debug(message, ...args);
export const logTrace = (message: string, ...args: any[]) => logger.trace(message, ...args); 