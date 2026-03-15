<script setup lang="ts">
import {
  clearSessionApiKey,
  clearStoredEncryptedApiKey,
  decryptStoredApiKey,
  encryptAndStoreApiKey,
  getSessionApiKey,
  getStoredByokMetadata,
  hasStoredEncryptedApiKey,
  saveSessionApiKey
} from '~/lib/byok';
import { clearBrowserSavedState, getDownloadPreferences, getStorageEstimate, setDownloadPreferences } from '../../lib/api';

const toast = useToast();

const apiKey = ref('');
const passphrase = ref('');
const confirmPassphrase = ref('');
const unlockPassphrase = ref('');
const sessionKey = ref<string | null>(null);
const hasStoredKey = ref(false);
const updatedAt = ref<string | null>(null);
const loading = ref(false);
const estimate = ref({ usage: 0, quota: 0, ratio: 0 });

const qualityDefault = ref<'hd' | 'standard'>('hd');
const destinationDefault = ref<'browser' | 'file'>('browser');

const refreshByokState = () => {
  hasStoredKey.value = hasStoredEncryptedApiKey();
  sessionKey.value = getSessionApiKey();
  updatedAt.value = getStoredByokMetadata().updatedAt;
};

const refreshStorageEstimate = async () => {
  estimate.value = await getStorageEstimate();
};

const usagePercent = computed(() => {
  if (!estimate.value.quota) {
    return 0;
  }
  return Math.round((estimate.value.usage / estimate.value.quota) * 100);
});

const usageBadgeColor = computed(() => {
  if (usagePercent.value >= 75) {
    return 'error';
  }
  if (usagePercent.value >= 50) {
    return 'warning';
  }
  return 'success';
});

const formatBytes = (bytes: number): string => {
  if (!bytes) {
    return '0 B';
  }

  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value.toFixed(value < 10 && unitIndex > 0 ? 1 : 0)} ${units[unitIndex]}`;
};

const saveEncryptedKey = async () => {
  if (!apiKey.value.trim()) {
    toast.add({ title: 'Validation Error', description: 'API key is required.', color: 'error' });
    return;
  }

  if (passphrase.value.length < 8) {
    toast.add({ title: 'Validation Error', description: 'Passphrase must be at least 8 characters.', color: 'error' });
    return;
  }

  if (passphrase.value !== confirmPassphrase.value) {
    toast.add({ title: 'Validation Error', description: 'Passphrase confirmation does not match.', color: 'error' });
    return;
  }

  loading.value = true;
  try {
    await encryptAndStoreApiKey(apiKey.value.trim(), passphrase.value);
    saveSessionApiKey(apiKey.value.trim());
    apiKey.value = '';
    passphrase.value = '';
    confirmPassphrase.value = '';
    refreshByokState();
    toast.add({ title: 'Saved', description: 'API key was encrypted and stored.', color: 'success' });
  } catch (error) {
    toast.add({
      title: 'Save Failed',
      description: error instanceof Error ? error.message : 'Could not save API key.',
      color: 'error'
    });
  } finally {
    loading.value = false;
  }
};

const unlockStoredKey = async () => {
  if (!unlockPassphrase.value) {
    toast.add({ title: 'Validation Error', description: 'Passphrase is required.', color: 'error' });
    return;
  }

  loading.value = true;
  try {
    const decrypted = await decryptStoredApiKey(unlockPassphrase.value);
    saveSessionApiKey(decrypted);
    unlockPassphrase.value = '';
    refreshByokState();
    toast.add({ title: 'Unlocked', description: 'Stored API key is active for this session.', color: 'success' });
  } catch (error) {
    toast.add({
      title: 'Unlock Failed',
      description: error instanceof Error ? error.message : 'Invalid passphrase.',
      color: 'error'
    });
  } finally {
    loading.value = false;
  }
};

const clearStoredKey = () => {
  clearStoredEncryptedApiKey();
  refreshByokState();
  toast.add({ title: 'Deleted', description: 'Stored encrypted API key was removed.', color: 'warning' });
};

const deactivateSessionKey = () => {
  clearSessionApiKey();
  refreshByokState();
  toast.add({ title: 'Session Cleared', description: 'Using DEMO_KEY until you unlock or save a key again.', color: 'neutral' });
};

const cleanupStorage = async () => {
  loading.value = true;
  try {
    const cacheKeys = await caches.keys();
    const imageCacheKeys = cacheKeys.filter((key) => key.includes('apod-images') || key.includes('pwa'));
    await Promise.all(imageCacheKeys.map((key) => caches.delete(key)));
    clearBrowserSavedState();

    await refreshStorageEstimate();

    toast.add({
      title: 'Cleanup Complete',
      description: 'Cleanup finished: image caches were removed and browser-saved markers were reset.',
      color: 'success'
    });
  } catch (error) {
    toast.add({
      title: 'Cleanup Failed',
      description: error instanceof Error ? error.message : 'Could not clean storage.',
      color: 'error'
    });
  } finally {
    loading.value = false;
  }
};

const saveDownloadDefaults = () => {
  setDownloadPreferences({ quality: qualityDefault.value, destination: destinationDefault.value });
  toast.add({ title: 'Saved', description: 'Download defaults were updated.', color: 'success' });
};

onMounted(async () => {
  refreshByokState();
  await refreshStorageEstimate();

  const prefs = getDownloadPreferences();
  qualityDefault.value = prefs.quality;
  destinationDefault.value = prefs.destination;
});
</script>

<template>
  <UPage>
    <UPageHeader title="Settings" />
    <UPageBody>
      <ClientOnly>
        <div class="space-y-6">
          <UCard>
            <template #header>
              <h2 class="text-lg font-semibold">API Key Status</h2>
            </template>
            <div class="space-y-2 text-sm">
              <p>Session key: <strong>{{ sessionKey ? 'Active' : 'Not active (DEMO_KEY)' }}</strong></p>
              <p>Stored encrypted key: <strong>{{ hasStoredKey ? 'Saved' : 'Not saved' }}</strong></p>
              <p v-if="updatedAt">Last updated: {{ new Date(updatedAt).toLocaleString() }}</p>
            </div>
            <template #footer>
              <div class="flex gap-2 justify-end">
                <UButton color="neutral" variant="outline" label="Clear Session Key" @click="deactivateSessionKey" />
                <UButton color="error" variant="soft" label="Delete Stored Key" @click="clearStoredKey" />
              </div>
            </template>
          </UCard>

          <UCard>
            <template #header>
              <h2 class="text-lg font-semibold">Save New API Key (BYOK)</h2>
            </template>
            <div class="space-y-4">
              <UFormField label="NASA API Key">
                <UInput v-model="apiKey" placeholder="Enter your NASA API key" />
              </UFormField>
              <UFormField label="Passphrase">
                <UInput v-model="passphrase" type="password" placeholder="At least 8 characters" />
              </UFormField>
              <UFormField label="Confirm Passphrase">
                <UInput v-model="confirmPassphrase" type="password" placeholder="Repeat passphrase" />
              </UFormField>
            </div>
            <template #footer>
              <div class="flex justify-end">
                <UButton :loading="loading" color="primary" label="Encrypt and Save" @click="saveEncryptedKey" />
              </div>
            </template>
          </UCard>

          <UCard v-if="hasStoredKey">
            <template #header>
              <h2 class="text-lg font-semibold">Unlock Stored API Key</h2>
            </template>
            <div class="space-y-4">
              <UFormField label="Passphrase">
                <UInput v-model="unlockPassphrase" type="password" placeholder="Enter passphrase to unlock" />
              </UFormField>
            </div>
            <template #footer>
              <div class="flex justify-end">
                <UButton :loading="loading" color="primary" label="Unlock" @click="unlockStoredKey" />
              </div>
            </template>
          </UCard>

          <UCard>
            <template #header>
              <h2 class="text-lg font-semibold">Download Defaults</h2>
            </template>
            <div class="space-y-4">
              <UFormField label="Default Quality">
                <URadioGroup
                  v-model="qualityDefault"
                  :items="[
                    { label: 'HD', value: 'hd' },
                    { label: 'Standard', value: 'standard' }
                  ]"
                />
              </UFormField>
              <UFormField label="Default Destination">
                <URadioGroup
                  v-model="destinationDefault"
                  :items="[
                    { label: 'Browser Cache', value: 'browser' },
                    { label: 'Download as File', value: 'file' }
                  ]"
                />
              </UFormField>
            </div>
            <template #footer>
              <div class="flex justify-end">
                <UButton color="primary" label="Save Defaults" @click="saveDownloadDefaults" />
              </div>
            </template>
          </UCard>

          <UCard>
            <template #header>
              <div class="flex items-center justify-between">
                <h2 class="text-lg font-semibold">Storage Usage</h2>
                <UBadge :color="usageBadgeColor">{{ usagePercent }}%</UBadge>
              </div>
            </template>
            <div class="space-y-2 text-sm">
              <p>Used: {{ formatBytes(estimate.usage) }}</p>
              <p>Quota: {{ formatBytes(estimate.quota) }}</p>
              <p v-if="usagePercent >= 75" class="text-red-500">Storage usage is above 75%. Consider running cleanup.</p>
              <p v-else-if="usagePercent >= 50" class="text-yellow-500">Storage usage is above 50%. Monitor usage.</p>
            </div>
            <template #footer>
              <div class="flex gap-2 justify-end">
                <UButton color="neutral" variant="outline" label="Refresh" @click="refreshStorageEstimate" />
                <UButton :loading="loading" color="warning" label="Cleanup" @click="cleanupStorage" />
              </div>
            </template>
          </UCard>
        </div>
      </ClientOnly>
    </UPageBody>
  </UPage>
</template>
