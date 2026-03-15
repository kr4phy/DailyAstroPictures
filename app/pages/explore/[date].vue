<script setup lang="ts">
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