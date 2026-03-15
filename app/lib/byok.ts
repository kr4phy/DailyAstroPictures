const BYOK_STORAGE_KEY = 'apod-byok-key';
const BYOK_SESSION_KEY = 'apod-session-api-key';
const BYOK_VERSION = 1;
const PBKDF2_ITERATIONS = 210_000;

type EncryptedApiKeyPayload = {
  version: number;
  algorithm: 'AES-GCM';
  iterations: number;
  salt: string;
  iv: string;
  cipherText: string;
  updatedAt: string;
};

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

const toArrayBuffer = (bytes: Uint8Array): ArrayBuffer => {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
};

const bytesToBase64 = (bytes: Uint8Array): string => {
  let binary = '';
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary);
};

const base64ToBytes = (base64: string): Uint8Array => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

const deriveKey = async (passphrase: string, salt: Uint8Array, iterations: number): Promise<CryptoKey> => {
  const baseKey = await crypto.subtle.importKey(
    'raw',
    textEncoder.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: toArrayBuffer(salt),
      iterations,
      hash: 'SHA-256'
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
};

export const hasStoredEncryptedApiKey = (): boolean => {
  if (!import.meta.client) {
    return false;
  }
  return !!localStorage.getItem(BYOK_STORAGE_KEY);
};

export const clearStoredEncryptedApiKey = (): void => {
  if (!import.meta.client) {
    return;
  }
  localStorage.removeItem(BYOK_STORAGE_KEY);
};

export const saveSessionApiKey = (apiKey: string): void => {
  const state = useState<string | null>(BYOK_SESSION_KEY, () => null);
  state.value = apiKey;
};

export const clearSessionApiKey = (): void => {
  const state = useState<string | null>(BYOK_SESSION_KEY, () => null);
  state.value = null;
};

export const getSessionApiKey = (): string | null => {
  const state = useState<string | null>(BYOK_SESSION_KEY, () => null);
  return state.value;
};

export const encryptAndStoreApiKey = async (apiKey: string, passphrase: string): Promise<void> => {
  if (!import.meta.client) {
    return;
  }

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt, PBKDF2_ITERATIONS);
  const cipherBuffer = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: toArrayBuffer(iv)
    },
    key,
    textEncoder.encode(apiKey)
  );

  const payload: EncryptedApiKeyPayload = {
    version: BYOK_VERSION,
    algorithm: 'AES-GCM',
    iterations: PBKDF2_ITERATIONS,
    salt: bytesToBase64(salt),
    iv: bytesToBase64(iv),
    cipherText: bytesToBase64(new Uint8Array(cipherBuffer)),
    updatedAt: new Date().toISOString()
  };

  localStorage.setItem(BYOK_STORAGE_KEY, JSON.stringify(payload));
};

export const decryptStoredApiKey = async (passphrase: string): Promise<string> => {
  if (!import.meta.client) {
    throw new Error('Client-side only');
  }

  const rawPayload = localStorage.getItem(BYOK_STORAGE_KEY);
  if (!rawPayload) {
    throw new Error('No encrypted API key found');
  }

  const payload = JSON.parse(rawPayload) as EncryptedApiKeyPayload;
  const salt = base64ToBytes(payload.salt);
  const iv = base64ToBytes(payload.iv);
  const cipherText = base64ToBytes(payload.cipherText);
  const key = await deriveKey(passphrase, salt, payload.iterations ?? PBKDF2_ITERATIONS);

  try {
    const plainBuffer = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: toArrayBuffer(iv)
      },
      key,
      toArrayBuffer(cipherText)
    );
    return textDecoder.decode(plainBuffer);
  } catch {
    throw new Error('Invalid passphrase');
  }
};

export const getStoredByokMetadata = (): { updatedAt: string | null } => {
  if (!import.meta.client) {
    return { updatedAt: null };
  }

  const rawPayload = localStorage.getItem(BYOK_STORAGE_KEY);
  if (!rawPayload) {
    return { updatedAt: null };
  }

  try {
    const payload = JSON.parse(rawPayload) as EncryptedApiKeyPayload;
    return { updatedAt: payload.updatedAt ?? null };
  } catch {
    return { updatedAt: null };
  }
};
