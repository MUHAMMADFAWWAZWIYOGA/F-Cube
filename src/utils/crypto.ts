// F'Cube Monitor - Local Cryptography Utility
// Asynchronous Web Crypto API implementation for LocalStorage encryption.

const SALT_SIZE = 16;
const IV_SIZE = 12; // Standard for AES-GCM
const ITERATIONS = 100000;

// Convert string to Uint8Array
function strToBuf(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

// Convert Uint8Array to string (for base64 or plaintext)
function bufToStr(buf: ArrayBuffer): string {
  return new TextDecoder().decode(buf);
}

// Convert Uint8Array to Base64
function bufToBase64(buf: Uint8Array): string {
  let binary = '';
  const bytes = new Uint8Array(buf);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Convert Base64 to Uint8Array
function base64ToBuf(base64: string): Uint8Array {
  const binary_string = atob(base64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes;
}

// Derive a cryptographic key from the PIN using PBKDF2
async function deriveKey(pin: string, salt: Uint8Array): Promise<CryptoKey> {
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    strToBuf(pin) as BufferSource,
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts a plaintext string using the master PIN.
 * Returns Base64 encoded string containing: Salt + IV + Ciphertext
 */
export async function encrypt(plaintext: string, pin: string): Promise<string> {
  if (!pin) return plaintext;
  
  const salt = window.crypto.getRandomValues(new Uint8Array(SALT_SIZE));
  const iv = window.crypto.getRandomValues(new Uint8Array(IV_SIZE));
  const key = await deriveKey(pin, salt);
  
  const encodedText = strToBuf(plaintext);
  
  const encryptedBuf = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    encodedText as BufferSource
  );
  
  // Combine salt, iv, and ciphertext
  const ciphertextBuf = new Uint8Array(encryptedBuf);
  const combined = new Uint8Array(salt.length + iv.length + ciphertextBuf.length);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(ciphertextBuf, salt.length + iv.length);
  
  return bufToBase64(combined);
}

/**
 * Decrypts a Base64 string containing Salt + IV + Ciphertext using the master PIN.
 */
export async function decrypt(ciphertextBase64: string, pin: string): Promise<{ success: boolean; data: string }> {
  if (!pin) return { success: true, data: ciphertextBase64 };
  
  try {
    const combined = base64ToBuf(ciphertextBase64);
    
    if (combined.length < SALT_SIZE + IV_SIZE) {
      throw new Error("Invalid ciphertext structure");
    }
    
    const salt = combined.slice(0, SALT_SIZE);
    const iv = combined.slice(SALT_SIZE, SALT_SIZE + IV_SIZE);
    const ciphertext = combined.slice(SALT_SIZE + IV_SIZE);
    
    const key = await deriveKey(pin, salt);
    
    const decryptedBuf = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv as BufferSource,
      },
      key,
      ciphertext as BufferSource
    );
    
    return {
      success: true,
      data: bufToStr(decryptedBuf)
    };
  } catch (e) {
    console.warn("Decryption failed or invalid key.");
    return { success: false, data: '' };
  }
}

/**
 * Generates a SHA-256 verify hash to store locally for checking PIN correctness
 */
export async function generatePinHash(pin: string): Promise<string> {
  const data = strToBuf(pin + "FCubeSystemSalt_84bA9!");
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data as BufferSource);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
