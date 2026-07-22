<script setup lang="ts">
import type { HTMLAttributes } from 'vue';

defineOptions({
    inheritAttrs: false,
});

type Props = {
    className?: HTMLAttributes['class'];
};

defineProps<Props>();
</script>

<template>
    <img
        src="https://redbook.cloud/cover2.png"
        alt="RedBook"
        class="object-contain"
        :class="className"
        v-bind="$attrs"
    />
</template>
