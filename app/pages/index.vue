<script setup lang="ts">
import { getAPODData, getCurrentDate, setAPODData } from '~/lib/api';

const data = await getAPODData(getCurrentDate())

const isStarred = ref(!!data.isStarred);
const imageLoading = ref(true);

watch(isStarred, (newValue) => {
    data.isStarred = newValue;
    setAPODData(data);
});

</script>
<template>
    <UPage>
        <UPageHeader title="Today's APOD" />
        <UPageBody>
            <ClientOnly>
                <UCard>
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
                            <UButton :icon="isStarred ? 'i-heroicons-star-solid' : 'i-heroicons-star'" size="md"
                                color="neutral" variant="ghost" @click="isStarred = !isStarred" />
                            <UButton icon="i-heroicons-folder-arrow-down" size="md" color="neutral" variant="ghost" />
                        </div>
                    </template>
                </UCard>
            </ClientOnly>
        </UPageBody>
    </UPage>
</template>