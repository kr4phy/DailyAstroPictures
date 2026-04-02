<script setup lang="ts">
import ApodContentCard from '~/components/apod-content-card.vue';
import DownloadModal from '~/components/download-modal.vue';
import {
  getAPODData,
  getCurrentDate,
  getLocalImageForDate,
  isDateBrowserSaved,
  removeDownloadedByDate,
  setAPODData,
  type ApodData
} from '~/lib/api';
import { showApodLoadErrorToast, showImageRemovedToast } from '~/lib/apod-feedback';

const data = reactive(await getAPODData());
const imageLoading = ref(true);
const downloadModalOpen = ref(false);
const localImageUrl = ref<string | null>(null);
const downloaded = ref(false);

if ('date' in data && import.meta.client) {
  localImageUrl.value = await getLocalImageForDate(data.date);
  downloaded.value = isDateBrowserSaved(data.date);
}

const displayImageUrl = computed(() => {
  if (!('date' in data)) {
    return '';
  }
  return localImageUrl.value || data.url;
});

if ('error' in data) {
  if (import.meta.client) {
    const toast = useToast();
    showApodLoadErrorToast(toast, data);
  }
}

const updateStarred = (next: boolean) => {
  if (!('date' in data)) {
    return;
  }

  data.isStarred = next;
  setAPODData(data);
};

const handleDownloadComplete = ({
  dataUrl,
  destination
}: {
  dataUrl: string;
  destination: 'browser' | 'file';
}) => {
  if (destination === 'browser') {
    localImageUrl.value = dataUrl;
    downloaded.value = true;
  }
};

const openDownloadModal = () => {
  if (!('date' in data)) {
    return;
  }
  downloadModalOpen.value = true;
};

const deleteDownloadedImage = async () => {
  if (!('date' in data)) {
    return;
  }

  await removeDownloadedByDate(data.date);
  localImageUrl.value = null;
  downloaded.value = false;
  const toast = useToast();
  showImageRemovedToast(toast);
};

const toggleStar = () => {
  if (!('date' in data)) {
    return;
  }

  updateStarred(!data.isStarred);
};

const apodData = computed<ApodData | null>(() => ('date' in data ? data : null));
</script>

<template>
  <UPage>
    <UPageHeader>
      <template #title>
        Today's APOD ({{ getCurrentDate() }})
      </template>
    </UPageHeader>
    <UPageBody>
      <ClientOnly>
        <ApodContentCard
          :data="data"
          :display-image-url="displayImageUrl"
          :image-loading="imageLoading"
          :downloaded="downloaded"
          @update:image-loading="imageLoading = $event"
          @toggle-star="toggleStar"
          @open-download="openDownloadModal"
          @delete-saved="deleteDownloadedImage"
        />

        <DownloadModal
          v-if="apodData"
          v-model:open="downloadModalOpen"
          :date="apodData.date"
          :apod="apodData"
          @complete="handleDownloadComplete"
        />
      </ClientOnly>
    </UPageBody>
  </UPage>
</template>
