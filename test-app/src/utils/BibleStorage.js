class BibleStorage {
  constructor() {
    this.dbName = 'sba_qt_bible_db';
    this.storeName = 'bible_books';
    this.dbVersion = 1;
    this.db = null;
    this.memoryCache = new Map();
    this.useMemoryOnly = false;
    this.initPromise = this.initDB();
  }

  async initDB() {
    if (typeof window === 'undefined' || !window.indexedDB) {
      this.useMemoryOnly = true;
      return;
    }
    return new Promise((resolve) => {
      try {
        const request = window.indexedDB.open(this.dbName, this.dbVersion);
        
        request.onupgradeneeded = (event) => {
          const db = event.target.result;
          if (!db.objectStoreNames.contains(this.storeName)) {
            db.createObjectStore(this.storeName);
          }
        };

        request.onsuccess = (event) => {
          this.db = event.target.result;
          resolve();
        };

        request.onerror = (err) => {
          console.warn("IndexedDB 초기화 실패, 메모리 캐시 사용:", err);
          this.useMemoryOnly = true;
          resolve();
        };
      } catch (e) {
        console.warn("IndexedDB 지원 불가, 메모리 캐시 사용:", e);
        this.useMemoryOnly = true;
        resolve();
      }
    });
  }

  async getBook(bookAbbrev) {
    await this.initPromise;
    const abbrev = bookAbbrev.toUpperCase();

    // 1. 메모리 캐시 먼저 조회
    if (this.memoryCache.has(abbrev)) {
      return this.memoryCache.get(abbrev);
    }

    // 2. IndexedDB 조회
    if (!this.useMemoryOnly && this.db) {
      try {
        const data = await this.getFromIndexedDB(abbrev);
        if (data) {
          this.memoryCache.set(abbrev, data);
          return data;
        }
      } catch (err) {
        console.warn(`IndexedDB에서 ${abbrev} 읽기 실패, fetch 진행:`, err);
      }
    }

    // 3. 네트워크 Fetch
    try {
      const response = await fetch(`/bible/${abbrev}.json`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      // 4. 캐싱
      this.memoryCache.set(abbrev, data);
      if (!this.useMemoryOnly && this.db) {
        this.saveToIndexedDB(abbrev, data).catch(err => {
          console.warn("IndexedDB 저장 실패:", err);
        });
      }
      return data;
    } catch (error) {
      console.error(`${abbrev} 성경 로딩 오류:`, error);
      throw error;
    }
  }

  getFromIndexedDB(key) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(key);

      request.onsuccess = (event) => resolve(event.target.result);
      request.onerror = (event) => reject(event.target.error);
    });
  }

  saveToIndexedDB(key, val) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put(val, key);

      request.onsuccess = () => resolve();
      request.onerror = (event) => reject(event.target.error);
    });
  }
}

export const bibleStorage = new BibleStorage();
