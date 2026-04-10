<template>
  <p
    v-if="message"
    class="mb-4 rounded-lg border border-rose-800 bg-rose-950/40 px-3 py-2 text-sm text-rose-200"
  >
    {{ message }}
  </p>
</template>

<script setup lang="ts">
defineProps<{ message: string }>();
</script>
