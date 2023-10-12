export interface Store<T> {
  get: () => Promise<T | null>;
  set: (value: T) => Promise<void>;
}
