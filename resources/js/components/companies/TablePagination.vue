<script setup lang="ts">
import { computed } from 'vue';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { PaginationMeta } from '@/types';

type Props = {
    meta: PaginationMeta | null;
    perPage: number;
};

type Emits = {
    'update:page': [page: number];
    'update:perPage': [perPage: number];
};

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const perPageOptions = [10, 15, 25, 50, 100];

const isFirstPage = computed(() => (props.meta?.current_page ?? 1) <= 1);
const isLastPage = computed(
    () => (props.meta?.current_page ?? 1) >= (props.meta?.last_page ?? 1),
);

function goToPrevious() {
    if (props.meta && !isFirstPage.value) {
        emit('update:page', props.meta.current_page - 1);
    }
}

function goToNext() {
    if (props.meta && !isLastPage.value) {
        emit('update:page', props.meta.current_page + 1);
    }
}

function handlePerPageChange(value: unknown) {
    const parsed = Number(value);

    if (!Number.isNaN(parsed)) {
        emit('update:perPage', parsed);
    }
}
</script>

<template>
    <div class="flex flex-wrap items-center justify-between gap-4">
        <p class="text-sm text-muted-foreground">
            <template v-if="meta && meta.total > 0">
                Showing {{ meta.from }}&ndash;{{ meta.to }} of
                {{ meta.total }}
            </template>
            <template v-else>No results</template>
        </p>

        <div class="flex items-center gap-4">
            <div class="flex items-center gap-2">
                <span class="text-sm text-muted-foreground">Per page</span>
                <Select
                    :model-value="String(perPage)"
                    @update:model-value="handlePerPageChange"
                >
                    <SelectTrigger class="w-20" aria-label="Per page">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem
                            v-for="option in perPageOptions"
                            :key="option"
                            :value="String(option)"
                        >
                            {{ option }}
                        </SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div class="flex items-center gap-1">
                <Button
                    variant="outline"
                    size="sm"
                    :disabled="isFirstPage"
                    @click="goToPrevious"
                >
                    Previous
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    :disabled="isLastPage"
                    @click="goToNext"
                >
                    Next
                </Button>
            </div>
        </div>
    </div>
</template>
