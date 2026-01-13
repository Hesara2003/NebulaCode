/**
 * Simple toast notification system
 * Uses native browser APIs - no external dependencies
 */

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastOptions {
  type?: ToastType;
  duration?: number; // milliseconds
  position?: "top-right" | "top-center" | "bottom-right" | "bottom-center";
}

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  timestamp: number;
}

class ToastManager {
  private toasts: Toast[] = [];
  private container: HTMLDivElement | null = null;
  private listeners: Set<(toasts: Toast[]) => void> = new Set();

  constructor() {
    if (typeof window !== "undefined") {
      this.initContainer();
    }
  }

  private initContainer(): void {
    if (this.container) return;

    this.container = document.createElement("div");
    this.container.id = "toast-container";
    this.container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      pointer-events: none;
    `;
    document.body.appendChild(this.container);
  }

  private createToastElement(toast: Toast): HTMLDivElement {
    const element = document.createElement("div");
    element.className = `toast toast-${toast.type}`;
    
    const colors = {
      success: { bg: "#10b981", icon: "✓" },
      error: { bg: "#ef4444", icon: "✕" },
      warning: { bg: "#f59e0b", icon: "⚠" },
      info: { bg: "#3b82f6", icon: "ℹ" },
    };

    const { bg, icon } = colors[toast.type];

    element.style.cssText = `
      background: ${bg};
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 250px;
      max-width: 400px;
      pointer-events: auto;
      animation: slideIn 0.3s ease-out;
      font-size: 14px;
      font-family: system-ui, -apple-system, sans-serif;
    `;

    element.innerHTML = `
      <span style="font-weight: bold; font-size: 16px;">${icon}</span>
      <span style="flex: 1;">${this.escapeHtml(toast.message)}</span>
      <button style="background: none; border: none; color: white; cursor: pointer; font-size: 18px; padding: 0; line-height: 1; opacity: 0.8;" onclick="this.parentElement.remove()">×</button>
    `;

    return element;
  }

  private escapeHtml(text: string): string {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  show(message: string, options: ToastOptions = {}): string {
    const { type = "info", duration = 4000 } = options;
    
    const toast: Toast = {
      id: Math.random().toString(36).substr(2, 9),
      message,
      type,
      timestamp: Date.now(),
    };

    this.toasts.push(toast);
    this.notifyListeners();

    if (this.container) {
      const element = this.createToastElement(toast);
      this.container.appendChild(element);

      setTimeout(() => {
        element.style.animation = "slideOut 0.3s ease-in";
        setTimeout(() => {
          element.remove();
          this.remove(toast.id);
        }, 300);
      }, duration);
    }

    return toast.id;
  }

  success(message: string, duration?: number): string {
    return this.show(message, { type: "success", duration });
  }

  error(message: string, duration?: number): string {
    return this.show(message, { type: "error", duration });
  }

  warning(message: string, duration?: number): string {
    return this.show(message, { type: "warning", duration });
  }

  info(message: string, duration?: number): string {
    return this.show(message, { type: "info", duration });
  }

  remove(id: string): void {
    this.toasts = this.toasts.filter((t) => t.id !== id);
    this.notifyListeners();
  }

  clear(): void {
    this.toasts = [];
    if (this.container) {
      this.container.innerHTML = "";
    }
    this.notifyListeners();
  }

  subscribe(callback: (toasts: Toast[]) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners(): void {
    this.listeners.forEach((callback) => callback([...this.toasts]));
  }
}

// Add CSS animations
if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    @keyframes slideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(100%);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);
}

export const toast = new ToastManager();
