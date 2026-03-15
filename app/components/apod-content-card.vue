<script setup lang="ts">
import type { ApiError, ApodData } from '~/lib/api';

const props = defineProps<{
  data: ApodData | ApiError;
  displayImageUrl: string;
  imageLoading: boolean;
  downloaded: boolean;
}>();

const emit = defineEmits<{
  'update:imageLoading': [value: boolean];
  toggleStar: [];
  openDownload: [];
  deleteSaved: [];
}>();

const onImageLoad = () => {
  emit('update:imageLoading', false);
};

const errorData = computed(() => ('error' in props.data ? props.data : null));
const apodData = computed(() => ('date' in props.data ? props.data : null));
</script>

<template>
  <UCard v-if="errorData">
    <template #header>
      <h2 class="text-xl font-semibold">Can't load image due to Error: {{ errorData.error.code }}</h2>
    </template>
    <template #default>
      <h3>Error detail:</h3>
      <br />
      <pre class="m-0 text-left text-sm text-gray-600 whitespace-pre-wrap wrap-break-word dark:text-gray-400"><code>{{ errorData.error.message }}</code></pre>
    </template>
    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton
          icon="i-lucide-settings"
          size="md"
          color="neutral"
          variant="outline"
          label="Settings"
          to="/settings"
        />
      </div>
    </template>
  </UCard>

  <UCard v-else-if="apodData">
    <template #header>
      <h2 class="text-xl font-semibold">{{ apodData.title }}</h2>
    </template>
    <div class="space-y-4">
      <div class="w-full aspect-video bg-black rounded-lg relative">
        <USkeleton v-show="imageLoading" class="w-full h-full absolute inset-0" />
        <img
          :src="displayImageUrl"
          :alt="apodData.title"
          class="w-full h-full object-contain rounded-lg"
          @load="onImageLoad"
          v-show="!imageLoading"
        />
      </div>
      <p class="text-sm text-gray-600 dark:text-gray-400">{{ apodData.explanation }}</p>
    </div>
    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton
          :icon="apodData.isStarred ? 'i-heroicons-star-solid' : 'i-heroicons-star'"
          size="md"
          color="neutral"
          variant="ghost"
          @click="emit('toggleStar')"
        />
        <UButton
          icon="i-heroicons-folder-arrow-down"
          size="md"
          color="neutral"
          variant="ghost"
          @click="emit('openDownload')"
        />
        <UButton
          v-if="downloaded"
          icon="i-lucide-trash-2"
          size="md"
          color="error"
          variant="soft"
          @click="emit('deleteSaved')"
        />
      </div>
    </template>
  </UCard>
</template>
