/**
 * An event emitter. Allows us to emit some events and allows us to listen for
 * those events wherever we’d like.
 */
export class Emitter<Event> {
  /** All of the functions which are listening subscribed to our events. */
  private readonly listeners = new Set<(event: Event) => void>();

  constructor() {}

  /**
   * Asynchronously emits an event to all of our listeners.
   *
   * We use a promise microtask to schedule calling our listeners.
   */
  public emit(event: Event): void {
    Promise.resolve().then(() => {
      this.listeners.forEach(listener => listener(event));
    });
  }

  /**
   * Listens for events from this emitter. Returns a function which when called
   * will stop us from listening for events.
   */
  public listen(listener: (event: Event) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}
