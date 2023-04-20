import { SpeedyStorage } from "./index";
// Bogus in-memory, just for one-off testing, disposable/volatile
// Swap out with a proper database
export class InMemoryStorage implements SpeedyStorage {
  private storage: { [key: string]: any };
  constructor() {
    this.storage = {};
  }
  async get(storageKey: string, key: string): Promise<any> {
    return this.storage[storageKey]?.[key];
  }

  async save(storageKey: string, key: string, value: any): Promise<void> {
    if (!this.storage[storageKey]) {
      this.storage[storageKey] = {};
    }
    this.storage[storageKey][key] = value;
  }

  async deleteData(storageKey: string, key: string): Promise<void> {
    if (this.storage[storageKey]) {
      delete this.storage[storageKey][key];
    }
  }

  async listKeys(storageKey: string): Promise<string[]> {
    return this.storage[storageKey]
      ? Object.keys(this.storage[storageKey])
      : [];
  }
}
