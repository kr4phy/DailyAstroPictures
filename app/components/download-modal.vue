<script setup lang="ts">
import type { ApodData, DownloadDestination } from '../lib/api';
import { downloadImage, getDownloadPreferences, getLocalImageForDateByQuality, setDownloadPreferences, type ImageQuality } from '../lib/api';

const props = defineProps<{
  date: string;
  apod?: ApodData;
}>();

const emit = defineEmits<{
  complete: [payload: { dataUrl: string; quality: ImageQuality; destination: DownloadDestination }];
}>();

const open = defineModel<boolean>('open', { default: false });

const toast = useToast();
const quality = ref<ImageQuality>('hd');
const destination = ref<DownloadDestination>('browser');
const localAvailable = ref(false);
const loading = ref(false);

watch(
  open,
  async (value) => {
    if (!value) {
      return;
    }

    const prefs = getDownloadPreferences();
    quality.value = prefs.quality;
    destination.value = prefs.destination;
    const localImage = await getLocalImageForDateByQuality(props.date, quality.value);
    localAvailable.value = !!localImage;
  },
  { immediate: true }
);

watch(quality, async () => {
  const localImage = await getLocalImageForDateByQuality(props.date, quality.value);
  localAvailable.value = !!localImage;
});

const onConfirm = async () => {
  loading.value = true;
  try {
    const dataUrl = await downloadImage(props.date, quality.value, destination.value, props.apod);
    setDownloadPreferences({ quality: quality.value, destination: destination.value });
    emit('complete', { dataUrl, quality: quality.value, destination: destination.value });
    toast.add({
      title: 'Downloaded',
      description:
        destination.value === 'file'
          ? 'File download was triggered. Depending on browser policy, it may open in a new tab.'
          : 'Image was saved to Browser Cache Storage with no expiration.',
      color: 'success'
    });
    open.value = false;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An error occurred while downloading.';
    toast.add({
      title: 'Download Failed',
      description: message,
      color: 'error'
    });
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <UModal v-model:open="open" title="Download Options" description="Choose image quality and save destination.">
    <template #body>
      <div class="space-y-4">
        <UFormField label="Image Quality">
          <URadioGroup
            v-model="quality"
            :items="[
              { label: 'HD (default)', value: 'hd' },
              { label: 'Standard', value: 'standard' }
            ]"
          />
        </UFormField>

        <UFormField label="Save Destination">
          <URadioGroup
            v-model="destination"
            :items="[
              { label: 'Browser Cache (default)', value: 'browser' },
              { label: 'Download as File', value: 'file' }
            ]"
          />
        </UFormField>

        <UAlert
          v-if="localAvailable"
          color="success"
          variant="soft"
          title="A local image with this quality already exists, so no network request is needed."
        />
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2 w-full">
        <UButton color="neutral" variant="outline" label="Cancel" @click="open = false" />
        <UButton :loading="loading" color="primary" label="Download" @click="onConfirm" />
      </div>
    </template>
  </UModal>
</template>
