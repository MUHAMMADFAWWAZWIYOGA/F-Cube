import { useState, useEffect, useCallback } from 'react';
import { encrypt, decrypt } from '../utils/crypto';

export function useLocalStorage<T>(key: string, initialValue: T, pin?: string): [T, (value: T | ((val: T) => T)) => void, boolean] {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isReady, setIsReady] = useState<boolean>(!pin);

  // Load from local storage asynchronously
  useEffect(() => {
    let isMounted = true;
    
    async function loadValue() {
      if (typeof window === 'undefined') return;
      
      try {
        const item = window.localStorage.getItem(key);
        if (!item) {
          if (isMounted) {
            setStoredValue(initialValue);
            setIsReady(true);
          }
          return;
        }

        if (pin) {
          const { success, data } = await decrypt(item, pin);
          if (isMounted) {
            if (success) {
              setStoredValue(JSON.parse(data));
            } else {
              setStoredValue(initialValue);
            }
            setIsReady(true);
          }
        } else {
          if (isMounted) {
            setStoredValue(JSON.parse(item));
            setIsReady(true);
          }
        }
      } catch (error) {
        if (isMounted) {
          setStoredValue(initialValue);
          setIsReady(true);
        }
      }
    }
    
    loadValue();
    
    return () => {
      isMounted = false;
    };
  }, [key, pin]); // Note: initialValue omitted to avoid constant re-fetching if object changes

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    setStoredValue((previousValue) => {
      const valueToStore = value instanceof Function ? value(previousValue) : value;

      if (typeof window !== 'undefined') {
        void (async () => {
          try {
            const serialized = JSON.stringify(valueToStore);
            const toStore = pin ? await encrypt(serialized, pin) : serialized;
            window.localStorage.setItem(key, toStore);
            window.dispatchEvent(new Event('local-storage-update'));
          } catch (error) {
            console.warn(`Error setting localStorage key "${key}":`, error);
          }
        })();
      }

      return valueToStore;
    });
  }, [key, pin]);

  // Handle cross-tab sync
  useEffect(() => {
    let isMounted = true;
    const handleStorageChange = async (e: StorageEvent) => {
      if (e.key === key) {
        if (!e.newValue) {
          if (isMounted) setStoredValue(initialValue);
          return;
        }
        if (pin) {
          const { success, data } = await decrypt(e.newValue, pin);
          if (isMounted && success) {
            setStoredValue(JSON.parse(data));
          }
        } else {
          if (isMounted) setStoredValue(JSON.parse(e.newValue));
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      isMounted = false;
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key, pin]);

  return [storedValue, setValue, isReady];
}
