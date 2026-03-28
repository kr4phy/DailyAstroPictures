<script setup lang="ts">
<<<<<<< HEAD
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
=======
import { getAPODData, setAPODData } from '~/lib/api';

const route = useRoute()
const data = await getAPODData(route.params.date as string)
const apiOk = ('date' in data)
const imageLoading = ref(true);

if (!apiOk) {
    if (import.meta.client) {
        const toast = useToast()
        if (data.error.code === "OVER_RATE_LIMIT") {
            toast.add({
                title: 'Error',
                description: 'API rate limit exceeded. Please add your API key on the settings page.',
                color: 'error',
                actions: [{
                    trailingIcon: 'i-lucide-arrow-right',
                    label: 'Go to Settings',
                    color: 'neutral',
                    variant: 'outline',
                    onClick: () => {
                        navigateTo('/settings')
                    }
                }]
            })
        } else {
            toast.add({
                title: 'Error',
                description: `Unknown error occurred: ${data.error.message}. Please try again later. If the problem persists, please open an issue on GitHub.`,
                color: 'error'
            })
        }
    }
} else {
    const isStarred = ref(!!data.isStarred);

    watch(isStarred, (newValue) => {
        data.isStarred = newValue;
        setAPODData(data);
    });
}

</script>
<template>
    <UPage>
        <UPageHeader>
            <template #title>
                {{ $route.params.date }}'s APOD
            </template>
        </UPageHeader>
        <UPageBody>
            <ClientOnly>
                <UCard v-if="'error' in data">
                    <template #header>
                        <h2 class="text-xl font-semibold">Can't load image due to Error: {{ data.error.code }}</h2>
                    </template>
                    <template #default>
                        <h3>Error detail:</h3>
                        <br />
                        <pre
                            class="m-0 text-left text-sm text-gray-600 whitespace-pre-wrap wrap-break-word dark:text-gray-400"><code>{{ data.error.message }}</code></pre>
                    </template>
                    <template #footer>
                        <div class="flex justify-end gap-2">
                            <UButton icon="i-lucide-message-square-warning" size="md" color="neutral" variant="ghost"
                                label="Send Feedback" to="https://github.com/kr4phy/DailyAstroPictures/issues" />
                        </div>
                    </template>
                </UCard>
                <UCard v-else>
                    <template #header>
                        <h2 class="text-xl font-semibold">{{ data.title }}</h2>
                    </template>
                    <div class="space-y-4">
                        <div class="w-full aspect-video bg-black rounded-lg relative">
                            <USkeleton v-show="imageLoading" class="w-full h-full absolute inset-0" />
                            <img :src="data.url" :alt="data.title" class="w-full h-full object-contain rounded-lg"
                                @load="imageLoading = false" v-show="!imageLoading" />
                        </div>
                        <p class="text-sm text-gray-600 dark:text-gray-400">{{ data.explanation }}</p>
                    </div>
                    <template #footer>
                        <div class="flex justify-end gap-2">
                            <UButton :icon="data.isStarred ? 'i-heroicons-star-solid' : 'i-heroicons-star'" size="md"
                                color="neutral" variant="ghost" @click="data.isStarred = !data.isStarred" />
                            <UButton icon="i-heroicons-folder-arrow-down" size="md" color="neutral" variant="ghost" />
                        </div>
                    </template>
                </UCard>
            </ClientOnly>
        </UPageBody>
    </UPage>
</template>
>>>>>>> d228d148ad0e71956667bdfd6630275818966cc1
