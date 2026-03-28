import { getSessionApiKey } from './byok';

type RawApodApiData = {
  date: string;
  explanation: string;
  hdurl: string;
  media_type: string;
  service_version: string;
  title: string;
  url: string;
};

export type ApodData = {
  date: string;
  explanation: string;
  hdurl: string;
  media_type: string;
  service_version: string;
  title: string;
  url: string;
  isStarred: boolean;
};

export type ErrResponse = {
  code: string;
  message: string;
};

export type ApiError = {
  error: ErrResponse;
};

export type ImageQuality = 'hd' | 'standard';
export type DownloadDestination = 'browser' | 'file';

const INDEX_KEYS = {
  viewed: 'apod-items',
  starred: 'apod-starred-items',
  downloaded: 'apod-downloaded-items',
  browserSaved: 'apod-browser-saved-items'
} as const;

const DOWNLOAD_PREFS_KEY = 'apod-download-preferences';

const CACHE_KEYS = {
  saved: 'apod-images-saved',
  manual: 'apod-images-manual'
} as const;

type DownloadPreferences = {
  quality: ImageQuality;
  destination: DownloadDestination;
};

const isApiError = (data: ApodData | ApiError): data is ApiError => 'error' in data;

const getIndex = (key: string): string[] => {
  if (!import.meta.client) {
    return [];
  }

  try {
    return JSON.parse(localStorage.getItem(key) || '[]') as string[];
  } catch {
    return [];
  }
};

const setIndex = (key: string, values: string[]): void => {
  if (!import.meta.client) {
    return;
  }

  const unique = [...new Set(values)].sort();
  localStorage.setItem(key, JSON.stringify(unique));
};

const addToIndex = (key: string, value: string): void => {
  const values = getIndex(key);
  if (!values.includes(value)) {
    values.push(value);
    setIndex(key, values);
  }
};

const removeFromIndex = (key: string, value: string): void => {
  const values = getIndex(key).filter((v) => v !== value);
  setIndex(key, values);
};

const getApiStorageKey = (date: string): string => `apod-${date}`;

const getResolvedDate = (date: string): string => {
  if (date) {
    return date;
  }
  return getCurrentDate();
};

const getPreferredApiKey = (): string => {
  const runtimeConfig = useRuntimeConfig();
  const demoKey = runtimeConfig.public.apodApiKey;

  if (!import.meta.client) {
    return demoKey;
  }

  const sessionKey = getSessionApiKey();
  if (sessionKey) {
    return sessionKey;
  }

  return demoKey;
};

const parseStoredApod = (raw: string | null): ApodData | null => {
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as ApodData;
  } catch {
    return null;
  }
};

const getStoredApodByDate = (date: string): ApodData | null => {
  if (!import.meta.client) {
    return null;
  }

  return parseStoredApod(localStorage.getItem(getApiStorageKey(date)));
};

const getImageUrlByQuality = (apod: Pick<ApodData, 'url' | 'hdurl'>, quality: ImageQuality): string => {
  if (quality === 'standard') {
    return apod.url;
  }
  return apod.hdurl || apod.url;
};

const getPossibleImageUrls = (apod: Pick<ApodData, 'url' | 'hdurl'>): string[] => {
  const urls = [apod.hdurl, apod.url].filter(Boolean);
  return [...new Set(urls)];
};

const downloadDataBlob = (blob: Blob, fileName: string): void => {
  if (!import.meta.client) {
    return;
  }

  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(objectUrl);
};

const downloadRemoteUrl = (imageUrl: string, fileName: string): void => {
  if (!import.meta.client) {
    return;
  }

  const link = document.createElement('a');
  link.href = imageUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const fetchForCache = async (imageUrl: string): Promise<Response> => {
  try {
    const corsResponse = await fetch(imageUrl, { mode: 'cors' });
    if (corsResponse.ok) {
      return corsResponse;
    }
  } catch {
    // Fallback to opaque caching.
  }

  return fetch(imageUrl, { mode: 'no-cors' });
};

const openCache = async (name: string): Promise<Cache | null> => {
  if (!import.meta.client || !('caches' in window)) {
    return null;
  }

  return caches.open(name);
};

const storeImageInCache = async (imageUrl: string, cacheName: string): Promise<void> => {
  const cache = await openCache(cacheName);
  if (!cache) {
    throw new Error('Cache Storage is not available in this browser.');
  }

  const existing = await cache.match(imageUrl);
  if (existing) {
    return;
  }

  const response = await fetchForCache(imageUrl);
  await cache.put(imageUrl, response.clone());
};

const getCachedResponse = async (imageUrl: string, cacheNames: string[]): Promise<Response | null> => {
  for (const cacheName of cacheNames) {
    const cache = await openCache(cacheName);
    if (!cache) {
      continue;
    }

    const response = await cache.match(imageUrl);
    if (response) {
      return response;
    }
  }

  return null;
};

const getCachedDisplayUrl = async (imageUrl: string, cacheNames: string[]): Promise<string | null> => {
  const response = await getCachedResponse(imageUrl, cacheNames);
  if (!response) {
    return null;
  }

  if (response.type === 'opaque') {
    return imageUrl;
  }

  const blob = await response.blob();
  return URL.createObjectURL(blob);
};

export const getAPODData = async (date = ''): Promise<ApodData | ApiError> => {
  const resolvedDate = getResolvedDate(date);

  if (import.meta.client) {
    const stored = getStoredApodByDate(resolvedDate);
    if (stored?.date === resolvedDate) {
      return stored;
    }
  }

  const apiKey = getPreferredApiKey();
  const response = await fetch(`https://api.nasa.gov/planetary/apod?api_key=${apiKey}&date=${resolvedDate}`);

  if (response.status !== 200) {
    const errorData: ApiError = await response.json();
    return errorData;
  }

  const rawData: RawApodApiData = await response.json();
  const data: ApodData = {
    ...rawData,
    isStarred: getIndex(INDEX_KEYS.starred).includes(rawData.date)
  };
  setAPODData(data);
  return data;
};

export const setAPODData = (data: ApodData): void => {
  if (!import.meta.client) {
    return;
  }

  addToIndex(INDEX_KEYS.viewed, data.date);

  if (data.isStarred) {
    addToIndex(INDEX_KEYS.starred, data.date);
  } else {
    removeFromIndex(INDEX_KEYS.starred, data.date);
  }

  localStorage.setItem(getApiStorageKey(data.date), JSON.stringify(data));
};

export const getCurrentDate = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getDownloadedDates = (): string[] => getIndex(INDEX_KEYS.downloaded);
export const getStarredDates = (): string[] => getIndex(INDEX_KEYS.starred);
export const getViewedDates = (): string[] => getIndex(INDEX_KEYS.viewed);
export const getBrowserSavedDates = (): string[] => getIndex(INDEX_KEYS.browserSaved);
export const isDateBrowserSaved = (date: string): boolean => getBrowserSavedDates().includes(date);

export const markBrowserSaved = (date: string): void => {
  addToIndex(INDEX_KEYS.browserSaved, date);
  addToIndex(INDEX_KEYS.downloaded, date);
};

export const removeBrowserSavedByDate = (date: string): void => {
  removeFromIndex(INDEX_KEYS.browserSaved, date);
  removeFromIndex(INDEX_KEYS.downloaded, date);
};

export const clearBrowserSavedState = (): void => {
  setIndex(INDEX_KEYS.browserSaved, []);
  setIndex(INDEX_KEYS.downloaded, []);
};

const removeDateFromImageCaches = async (date: string): Promise<number> => {
  const apod = getStoredApodByDate(date);
  if (!apod) {
    return 0;
  }

  const urls = getPossibleImageUrls(apod);
  if (!urls.length) {
    return 0;
  }

  let deleted = 0;
  const cacheNames = [CACHE_KEYS.saved, CACHE_KEYS.manual];

  for (const cacheName of cacheNames) {
    const cache = await openCache(cacheName);
    if (!cache) {
      continue;
    }

    for (const url of urls) {
      if (await cache.delete(url)) {
        deleted += 1;
      }
    }
  }

  return deleted;
};

export const removeDownloadedByDate = async (date: string): Promise<number> => {
  const deleted = await removeDateFromImageCaches(date);
  removeBrowserSavedByDate(date);
  return deleted;
};

export const getDownloadPreferences = (): DownloadPreferences => {
  if (!import.meta.client) {
    return { quality: 'hd', destination: 'browser' };
  }

  try {
    const parsed = JSON.parse(localStorage.getItem(DOWNLOAD_PREFS_KEY) || '{}') as Partial<
      DownloadPreferences & { destination?: DownloadDestination | 'localStorage' }
    >;

    const destination = parsed.destination === 'file' ? 'file' : 'browser';

    return {
      quality: parsed.quality === 'standard' ? 'standard' : 'hd',
      destination
    };
  } catch {
    return { quality: 'hd', destination: 'browser' };
  }
};

export const setDownloadPreferences = (preferences: DownloadPreferences): void => {
  if (!import.meta.client) {
    return;
  }

  localStorage.setItem(DOWNLOAD_PREFS_KEY, JSON.stringify(preferences));
};

const getDisplayUrlFromApod = async (apod: Pick<ApodData, 'url' | 'hdurl'>, quality: ImageQuality): Promise<string | null> => {
  const preferredUrl = getImageUrlByQuality(apod, quality);
  const preferred = await getCachedDisplayUrl(preferredUrl, [CACHE_KEYS.saved, CACHE_KEYS.manual]);
  if (preferred) {
    return preferred;
  }

  const fallbackUrls = getPossibleImageUrls(apod).filter((url) => url !== preferredUrl);
  for (const url of fallbackUrls) {
    const result = await getCachedDisplayUrl(url, [CACHE_KEYS.saved, CACHE_KEYS.manual]);
    if (result) {
      return result;
    }
  }

  return null;
};

export const getLocalImageForDate = async (date: string): Promise<string | null> => {
  if (!isDateBrowserSaved(date)) {
    return null;
  }

  const apod = getStoredApodByDate(date);
  if (!apod) {
    return null;
  }

  return getDisplayUrlFromApod(apod, 'hd');
};

export const getLocalImageForDateByQuality = async (
  date: string,
  quality: ImageQuality,
  sourceApod?: Pick<ApodData, 'url' | 'hdurl'>
): Promise<string | null> => {
  if (!isDateBrowserSaved(date)) {
    return null;
  }

  const apod = sourceApod ?? getStoredApodByDate(date);
  if (!apod) {
    return null;
  }

  return getDisplayUrlFromApod(apod, quality);
};

export const getCachedImagesByApods = async (items: ApodData[]): Promise<Record<string, string>> => {
  const result: Record<string, string> = {};

  await Promise.all(
    items.map(async (item) => {
      const local = await getLocalImageForDate(item.date);
      if (local) {
        result[item.date] = local;
      }
    })
  );

  return result;
};

export const downloadImage = async (
  date: string,
  quality: ImageQuality = 'hd',
  destination: DownloadDestination = 'browser',
  sourceApod?: ApodData
): Promise<string> => {
  const resolvedDate = getResolvedDate(date);
  const apod = sourceApod ?? (await getAPODData(resolvedDate));

  if (isApiError(apod)) {
    throw new Error(apod.error.message);
  }

  const imageUrl = getImageUrlByQuality(apod, quality);

  if (destination === 'file') {
    try {
      const buffer = await $fetch<ArrayBuffer>(imageUrl, { responseType: 'arrayBuffer' });
      const blob = new Blob([buffer], { type: 'image/jpeg' });
      downloadDataBlob(blob, `${resolvedDate}-${quality}.jpg`);
      return imageUrl;
    } catch {
      downloadRemoteUrl(imageUrl, `${resolvedDate}-${quality}.jpg`);
      return imageUrl;
    }
  }

  try {
    await storeImageInCache(imageUrl, CACHE_KEYS.saved);
    markBrowserSaved(resolvedDate);
  } catch {
    throw new Error('Could not save this image to Cache Storage. Check browser storage permissions and try again.');
  }

  const cached = await getLocalImageForDateByQuality(resolvedDate, quality, apod);
  return cached ?? imageUrl;
};

export const getManyAPODData = async (dates: string[]): Promise<ApodData[]> => {
  const unique = [...new Set(dates)].sort();
  const results = await Promise.all(unique.map((date) => getAPODData(date)));
  return results.filter((item): item is ApodData => !isApiError(item));
};

export const getStorageEstimate = async (): Promise<{ usage: number; quota: number; ratio: number }> => {
  if (!import.meta.client || !navigator.storage?.estimate) {
    return { usage: 0, quota: 0, ratio: 0 };
  }

  const estimate = await navigator.storage.estimate();
  const usage = estimate.usage ?? 0;
  const quota = estimate.quota ?? 0;
  const ratio = quota > 0 ? usage / quota : 0;
  return { usage, quota, ratio };
};
