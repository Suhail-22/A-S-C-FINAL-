
import { useState } from 'react';
import { HistoryItem } from '../types';

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      const parsed = item ? JSON.parse(item) : initialValue;
      if (key === 'calcHistory_v2' && Array.isArray(parsed) && parsed.length > 0 && !(parsed[0] as HistoryItem).id) {
          const migrated = parsed.map((histItem: any, index: number) => ({
              ...histItem,
              id: Date.now() - index,
              notes: '',
          }));
          window.localStorage.setItem(key, JSON.stringify(migrated));
          return migrated as T;
      }
      return parsed;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue];
}
