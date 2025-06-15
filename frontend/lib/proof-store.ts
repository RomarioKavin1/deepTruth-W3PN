// Shared proof store for capturing Self Protocol proof data
// In production, this should be replaced with Redis or a database

interface ProofData {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  proof: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  publicSignals: any[];
  timestamp: string;
}

class ProofStore {
  private store = new Map<string, ProofData>();
  private latestKey: string | null = null;

  set(key: string, data: ProofData) {
    this.store.set(key, data);
    this.latestKey = key;
    console.log(`Stored proof data with key: ${key}`);

    // Clean up old entries (keep only last 10)
    if (this.store.size > 10) {
      const oldestKey = this.store.keys().next().value;
      if (oldestKey) {
        this.store.delete(oldestKey);
      }
    }
  }

  get(key: string): ProofData | undefined {
    return this.store.get(key);
  }

  getLatest(): ProofData | undefined {
    if (!this.latestKey) return undefined;
    return this.store.get(this.latestKey);
  }

  delete(key: string): boolean {
    const result = this.store.delete(key);
    if (key === this.latestKey) {
      // Set latest to the most recent remaining key
      const keys = Array.from(this.store.keys());
      this.latestKey = keys.length > 0 ? keys[keys.length - 1] : null;
    }
    return result;
  }

  clear() {
    this.store.clear();
    this.latestKey = null;
  }
}

// Export a singleton instance
export const proofStore = new ProofStore();
