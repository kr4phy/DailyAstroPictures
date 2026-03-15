<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const route = useRoute()

const items = computed<NavigationMenuItem[]>(() => [
  {
    label: 'Today',
    to: '/',
    active: route.path === '/'
  },
  {
    label: 'Explore',
    to: '/explore',
    active: route.path.startsWith('/explore')
  },
  {
    label: 'Starred Items',
    to: '/starreditems',
    active: route.path.startsWith('/starreditems')
  },
  {
    label: 'My Gallery',
    to: '/mygallery',
    active: route.path.startsWith('/mygallery')
  },
  {
    label: 'Settings',
    to: '/settings',
    active: route.path.startsWith('/settings')
  }
])
</script>

<template>
  <UHeader>
    <template #title>
      <h1>Daily Astro Pictures</h1>
    </template>

    <UNavigationMenu :items="items" />

    <template #right>
      <UColorModeButton />

      <UTooltip text="Open on GitHub" :kbds="['meta', 'G']">
        <UButton
          color="neutral"
          variant="ghost"
          to="https://github.com/kr4phy/DailyAstroPictures"
          target="_blank"
          icon="i-simple-icons-github"
          aria-label="GitHub"
        />
      </UTooltip>
    </template>
    <template #body>
      <UNavigationMenu :items="items" orientation="vertical" />
    </template>
  </UHeader>
</template>
