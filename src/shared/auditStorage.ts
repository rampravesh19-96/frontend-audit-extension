import type { AuditHistoryItem } from './types';

const STORAGE_KEY = 'auditHistory';
const MAX_HISTORY_ITEMS = 20;

const isStorageAvailable = (): boolean =>
  typeof chrome !== 'undefined' &&
  typeof chrome.storage !== 'undefined' &&
  typeof chrome.storage.local !== 'undefined';

export const getAuditHistory = async (): Promise<AuditHistoryItem[]> => {
  if (!isStorageAvailable()) {
    return [];
  }

  try {
    const stored = await chrome.storage.local.get(STORAGE_KEY);
    const history = stored[STORAGE_KEY];

    return Array.isArray(history) ? (history as AuditHistoryItem[]) : [];
  } catch (error) {
    console.error('Failed to load audit history.', error);
    return [];
  }
};

export const saveAuditHistoryItem = async (
  item: AuditHistoryItem
): Promise<void> => {
  if (!isStorageAvailable()) {
    return;
  }

  try {
    const history = await getAuditHistory();
    const nextHistory = [item, ...history].slice(0, MAX_HISTORY_ITEMS);

    await chrome.storage.local.set({
      [STORAGE_KEY]: nextHistory
    });
  } catch (error) {
    console.error('Failed to save audit history item.', error);
  }
};

export const clearAuditHistory = async (): Promise<void> => {
  if (!isStorageAvailable()) {
    return;
  }

  try {
    await chrome.storage.local.remove(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear audit history.', error);
  }
};
