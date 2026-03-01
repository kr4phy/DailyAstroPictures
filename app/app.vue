<script setup lang="ts">
import Header from './components/header.vue';

</script>

<template>
  <UApp>
    <Header />
    <NuxtRouteAnnouncer />
    <UMain>
      <NuxtLayout>
        <UContainer>
          <NuxtPage />
        </UContainer>
      </NuxtLayout>
    </UMain>
  </UApp>
</template>
