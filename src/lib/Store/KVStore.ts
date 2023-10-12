import type { Store } from "./Store";
import type { KVNamespacePutOptions } from "@cloudflare/workers-types";

export default class KVStore<T> implements Store<T> {
  private name: string;
  private KV: KVNamespace;
  private options: KVNamespacePutOptions;

  constructor(
    KV: KVNamespace,
    name: string,
    options: KVNamespacePutOptions = { expirationTtl: 60},
  ) {
    this.KV = KV;
    this.name = name;
    this.options = options;
  }

  async get() {
    return await this.KV.get<T>(this.name, "json");
  }

  async set(value: T) {
    await this.KV.put(this.name, JSON.stringify(value), this.options);
  }
}
