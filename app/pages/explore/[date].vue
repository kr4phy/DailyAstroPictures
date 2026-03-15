<script setup lang="ts">
import { CalendarDate } from '@internationalized/date';
import ApodContentCard from '~/components/apod-content-card.vue';
import DownloadModal from '~/components/download-modal.vue';
import {
  getAPODData,
  getLocalImageForDate,
  isDateBrowserSaved,
  removeDownloadedByDate,
  setAPODData,
  type ApodData
} from '~/lib/api';
import { showApodLoadErrorToast, showImageRemovedToast } from '~/lib/apod-feedback';

const route = useRoute();
const targetDate = route.params.date as string;
const data = await getAPODData(targetDate);
const today = new Date();
const minDate = new CalendarDate(1995, 6, 16);
const maxDate = new CalendarDate(today.getFullYear(), today.getMonth() + 1, today.getDate());

const [yyRaw, mmRaw, ddRaw] = targetDate.split('-');
const yy = Number(yyRaw);
const mm = Number(mmRaw);
const dd = Number(ddRaw);
const initialDate =
  Number.isFinite(yy) && Number.isFinite(mm) && Number.isFinite(dd)
    ? new CalendarDate(yy, mm, dd)
    : maxDate;
const modelValue = shallowRef(initialDate);

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
} else {
  const isStarred = ref(!!data.isStarred);

  watch(isStarred, (newValue) => {
    data.isStarred = newValue;
    setAPODData(data);
  });
}

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

const toDatePath = (value: CalendarDate): string => {
  return `${value.year}-${String(value.month).padStart(2, '0')}-${String(value.day).padStart(2, '0')}`;
};

const navigateToSelectedDate = () => {
  void navigateTo(`/explore/${toDatePath(modelValue.value)}`);
};

const generateRandomDate = () => {
  const start = new Date(1995, 5, 16).getTime();
  const end = today.getTime();
  const randomTime = start + Math.random() * (end - start);
  const randomDate = new Date(randomTime);
  modelValue.value = new CalendarDate(randomDate.getFullYear(), randomDate.getMonth() + 1, randomDate.getDate());
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
  data.isStarred = !data.isStarred;
};

const apodData = computed<ApodData | null>(() => ('date' in data ? data : null));
</script>

<template>
  <UPage>
    <UPageHeader>
      <template #title>
        {{ route.params.date }}'s APOD
      </template>
    </UPageHeader>
    <UPageBody>
      <ClientOnly>
        <div class="mb-4 flex flex-wrap items-center gap-2">
          <UInputDate v-model="modelValue" :min-value="minDate" :max-value="maxDate" />
          <UButton color="neutral" variant="outline" trailing-icon="i-lucide-shuffle" @click="generateRandomDate">
            Random Date
          </UButton>
          <UButton color="primary" @click="navigateToSelectedDate">
            View
          </UButton>
        </div>

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
