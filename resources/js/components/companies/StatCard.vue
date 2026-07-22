<script setup lang="ts">
type Props = {
    title: string;
    value: string | number;
    description?: string;
};

defineProps<Props>();
</script>

<template>
    <div
        class="relative flex flex-col justify-center gap-1 overflow-hidden rounded-xl border border-sidebar-border/70 p-4 dark:border-sidebar-border"
    >
        <span class="text-sm text-muted-foreground">{{ title }}</span>
        <span class="text-2xl font-semibold">{{ value }}</span>
        <span v-if="description" class="text-xs text-muted-foreground">
            {{ description }}
        </span>
    </div>
</template>
