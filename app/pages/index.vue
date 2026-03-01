<script setup lang="ts">
const data = {
    "date": "2026-02-22",
    "explanation": "What if you saw your shadow on Mars and it wasn't human?  Then you might be the Opportunity rover exploring Mars.  Opportunity explored the Red Planet from 2004 to 2018, finding evidence of ancient water, and sending breathtaking images across the inner Solar System.  Pictured here in 2004, Opportunity looks opposite the Sun into Endurance Crater and sees its own shadow.  Two wheels are visible on the lower left and right, while the floor and walls of the unusual crater are visible in the background.  Caught in a dust storm in 2018, Opportunity stopped responding, and NASA stopped trying to contact it in 2019 and declared the ground-breaking mission, originally planned for only 92 days, complete.",
    "hdurl": "https://apod.nasa.gov/apod/image/2602/marsshadow_opportunity_1024.jpg",
    "media_type": "image",
    "service_version": "v1",
    "title": "Shadow of a Martian Robot",
    "url": "https://apod.nasa.gov/apod/image/2602/marsshadow_opportunity_960.jpg"
}
const isStarred = ref(false)
</script>
<template>
    <UPage>
        <UPageHeader title="Today's APOD" />
        <UPageBody>
            <UPageCard orientation="vertical" reverse>
                <template #title>{{ data.title }}</template>
                <template #description class="">{{ data.explanation }}</template>
                <img :src="data.url" :alt="data.title" class="w-full rounded-lg" />
                <template #footer>
                    <div class="flex justify-end gap-2">
                        <div>
                            <UButton :icon="isStarred ? 'i-heroicons-star-solid' : 'i-heroicons-star'" size="md"
                                color="neutral" variant="ghost" @click="isStarred = !isStarred" />
                        </div>
                        <div>
                            <UButton icon="i-heroicons-folder-arrow-down" size="md" color="neutral" variant="ghost" />
                        </div>
                    </div>
                </template>
            </UPageCard>
        </UPageBody>
    </UPage>
</template>