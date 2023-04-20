export abstract class SpeedyStorage {
  abstract get(storageKey: string, key: string): Promise<any>;
  abstract save(storageKey: string, key: string, value: any): Promise<void>;
  abstract deleteData(storageKey: string, key: string): Promise<void>;
  abstract listKeys(storageKey: string): Promise<string[]>;
}
export { InMemoryStorage } from "./default";
import { Speedybot, Config } from "speedybot-mini";
import { InMemoryStorage } from "./default";
export class SpeedyBotWithStorage<
  T extends string = never
> extends Speedybot<T> {
  private storage: SpeedyStorage = new InMemoryStorage();
  constructor(config?: string | Config | undefined) {
    super(config);
  }
  setStorage<T extends SpeedyStorage>(StorageClass: new () => T) {
    this.storage = new StorageClass();
  }
  async save(storageKey: string, key: string, value: any): Promise<void> {
    return this.storage.save(storageKey, key, value);
  }
  async get(storageKey: string, key: string): Promise<any> {
    return this.storage.get(storageKey, key);
  }
  async deleteData(storageKey: string, key: string): Promise<void> {
    return this.storage.deleteData(storageKey, key);
  }
  async listKeys(storageKey: string): Promise<string[]> {
    return this.storage.listKeys(storageKey);
  }
}
