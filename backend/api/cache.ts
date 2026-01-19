interface CacheEntry<T> {
    data: T;
    expiresAt: number;
}

class SimpleCache {
    private cache = new Map<string, CacheEntry<any>>();

    set<T>(key: string, data: T, ttlSeconds: number): void {
        const expiresAt = Date.now() + ttlSeconds * 1000;
        this.cache.set(key, { data, expiresAt });
    }

    get<T>(key: string): T | null {
        const entry = this.cache.get(key);
        if (!entry) {
            return null;
        }
        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            return null;
        }
        return entry.data as T;
    }

    clear(): void {
        this.cache.clear();
    }

    size(): number {
        return this.cache.size;
    }
}

export const cache = new SimpleCache();