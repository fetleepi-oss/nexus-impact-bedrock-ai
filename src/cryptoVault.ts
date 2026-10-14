/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Web Crypto AES-GCM (256-bit) encryption utility for local on-device vault storage.
 * Works seamlessly in both browser and Node.js environments.
 */

// Cross-environment Web Crypto subtle resolver
function getSubtleCrypto(): SubtleCrypto {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    return window.crypto.subtle;
  }
  // Node.js 18+ globalThis.crypto or crypto.webcrypto
  if (typeof globalThis !== 'undefined' && globalThis.crypto && globalThis.crypto.subtle) {
    return globalThis.crypto.subtle;
  }
  throw new Error('Web Crypto API (crypto.subtle) is not available in this environment');
}

function getRandomValues(array: Uint8Array): Uint8Array {
  if (typeof window !== 'undefined' && window.crypto) {
    return window.crypto.getRandomValues(array as any) as any;
  }
  if (typeof globalThis !== 'undefined' && globalThis.crypto) {
    return globalThis.crypto.getRandomValues(array as any) as any;
  }
  throw new Error('Web Crypto getRandomValues is not available');
}

export interface EncryptedPayload {
  algorithm: 'AES-GCM-256';
  salt: string; // base64
  iv: string;   // base64
  ciphertext: string; // base64
  timestamp: number;
}

// Memory-only session passphrase
let sessionPassphrase: string | null = null;

export function setSessionPassphrase(passphrase: string | null): void {
  sessionPassphrase = passphrase;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('nexus_vault_passphrase_changed', {
      detail: { hasPassphrase: Boolean(passphrase) }
    }));
  }
}

export function getSessionPassphrase(): string | null {
  return sessionPassphrase;
}

export function hasActivePassphrase(): boolean {
  return Boolean(sessionPassphrase && sessionPassphrase.length > 0);
}

// Convert ArrayBuffer to Base64
function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  if (typeof btoa === 'function') {
    return btoa(binary);
  }
  return Buffer.from(binary, 'binary').toString('base64');
}

// Convert Base64 to Uint8Array
function base64ToBuffer(base64: string): Uint8Array {
  if (typeof atob === 'function') {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
  return new Uint8Array(Buffer.from(base64, 'base64'));
}

/**
 * Derives an AES-GCM 256-bit CryptoKey from a user passphrase and salt using PBKDF2 (100,000 iterations).
 */
async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const subtle = getSubtleCrypto();
  const enc = new TextEncoder();
  const rawKey = await subtle.importKey(
    'raw',
    enc.encode(passphrase) as unknown as BufferSource,
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as unknown as BufferSource,
      iterations: 100000,
      hash: 'SHA-256'
    },
    rawKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts a plaintext string with AES-GCM (256-bit).
 */
export async function encryptWithPassphrase(plaintext: string, passphrase: string): Promise<EncryptedPayload> {
  const subtle = getSubtleCrypto();
  const enc = new TextEncoder();
  const salt = getRandomValues(new Uint8Array(16));
  const iv = getRandomValues(new Uint8Array(12));

  const key = await deriveKey(passphrase, salt);
  const encodedText = enc.encode(plaintext);

  const encryptedBuffer = await subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv as unknown as BufferSource
    },
    key,
    encodedText as unknown as BufferSource
  );

  return {
    algorithm: 'AES-GCM-256',
    salt: bufferToBase64(salt),
    iv: bufferToBase64(iv),
    ciphertext: bufferToBase64(encryptedBuffer),
    timestamp: Date.now()
  };
}

/**
 * Decrypts an encrypted payload with AES-GCM (256-bit).
 */
export async function decryptWithPassphrase(payload: EncryptedPayload, passphrase: string): Promise<string> {
  const subtle = getSubtleCrypto();
  const dec = new TextDecoder();
  const salt = base64ToBuffer(payload.salt);
  const iv = base64ToBuffer(payload.iv);
  const ciphertext = base64ToBuffer(payload.ciphertext);

  const key = await deriveKey(passphrase, salt);

  const decryptedBuffer = await subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv as unknown as BufferSource
    },
    key,
    ciphertext as unknown as BufferSource
  );

  return dec.decode(decryptedBuffer);
}
