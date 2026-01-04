// frontend/lib/logger.ts

export const log = (message: string, ...args: any[]) => {
  console.log(`[FE] ${message}`, ...args);
};

export const error = (message: string, ...args: any[]) => {
  console.error(`[FE] ${message}`, ...args);
};