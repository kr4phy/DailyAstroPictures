<script setup lang="ts">
import { getStarredDates, isDateBrowserSaved, removeDownloadedByDate } from '../../lib/api';
import { useApodCollection } from '~/composables/use-apod-collection';

const { loading, imageSource, removeLocalImageByDate, items } = useApodCollection(getStarredDates);

const canDeleteSavedImage = (date: string): boolean => {
  return isDateBrowserSaved(date);
};

const removeSavedImage = async (date: string) => {
  await removeDownloadedByDate(date);
  removeLocalImageByDate(date);
};
</script>

<template>
  <UPage>
    <UPageHeader title="Starred Items" />
    <UPageBody>
      <ClientOnly>
        <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <USkeleton v-for="n in 4" :key="n" class="h-64 w-full" />
        </div>

        <UAlert
          v-else-if="!items.length"
          color="neutral"
          variant="soft"
          title="No starred images yet."
          description="Add items from Today or Explore using the star button."
        />

        <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <UCard v-for="item in items" :key="item.date">
            <template #header>
              <h2 class="font-semibold">{{ item.title }}</h2>
              <p class="text-xs text-gray-500 mt-1">{{ item.date }}</p>
            </template>

            <div class="w-full aspect-video bg-black rounded-lg overflow-hidden">
              <img :src="imageSource(item)" :alt="item.title" class="w-full h-full object-contain" />
            </div>

            <template #footer>
              <div class="flex justify-end gap-2">
                <UButton color="neutral" variant="outline" label="Open" :to="`/explore/${item.date}`" />
                <UButton
                  v-if="canDeleteSavedImage(item.date)"
                  color="error"
                  variant="soft"
                  icon="i-lucide-trash-2"
                  @click="removeSavedImage(item.date)"
                />
              </div>
            </template>
          </UCard>
        </div>
      </ClientOnly>
    </UPageBody>
  </UPage>
</template>
