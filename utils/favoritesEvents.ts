// React Native compatible event emitter without Node.js dependencies
type EventCallback = () => void;

class FavoritesEventEmitter {
  private listeners: Map<string, EventCallback[]> = new Map();

  on(event: string, callback: EventCallback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback: EventCallback) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(callback);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    }
  }

  emit(event: string) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => callback());
    }
  }
}

// Create a global event emitter for favorites changes
export const favoritesEvents = new FavoritesEventEmitter();

// Event name for favorites changes
export const FAVORITES_CHANGED_EVENT = 'favorites-changed';
