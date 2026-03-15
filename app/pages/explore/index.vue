<script setup lang="ts">
import { CalendarDate } from '@internationalized/date'

const crtDate = new Date()
const inputDate = useTemplateRef('inputDate')
const minDate = new CalendarDate(1995, 6, 16)
const modelValue = shallowRef(new CalendarDate(crtDate.getFullYear(), crtDate.getMonth() + 1, crtDate.getDate()))

const generateRandomDate = () => {
    const start = new Date(1995, 5, 16).getTime()
    const end = crtDate.getTime()
    const randomTime = start + Math.random() * (end - start)
    const randomDate = new Date(randomTime)
    modelValue.value = new CalendarDate(randomDate.getFullYear(), randomDate.getMonth() + 1, randomDate.getDate())
}
</script>

<template>
    <UPage>
        <UPageHeader title="Explore" />
        <UPageBody>
            <ClientOnly>
                <UInputDate ref="inputDate" v-model="modelValue" :min-value="minDate">
                    <template #trailing>
                        <UPopover :reference="inputDate?.inputsRef[3]?.$el">
                            <UButton color="neutral" variant="link" size="sm" icon="i-lucide-calendar"
                                aria-label="Select a date" class="px-0" />
                            <template #content>
                                <UCalendar v-model="modelValue" class="p-2" />
                            </template>
                        </UPopover>
                    </template>
                </UInputDate>
                <UButton color="primary" @click="generateRandomDate" class="ml-4" trailing-icon="i-lucide-shuffle" variant="outline">Random Date</UButton>
                <UButton color="primary" :to="`/explore/${modelValue.year}-${String(modelValue.month).padStart(2, '0')}-${String(modelValue.day).padStart(2, '0')}`" class="ml-4">View</UButton>
            </ClientOnly>
        </UPageBody>
    </UPage>
</template>