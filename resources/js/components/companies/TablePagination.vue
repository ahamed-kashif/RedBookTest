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
import type { PaginationLink, PaginationMeta } from '@/types';

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

// Laravel always puts the Previous link first and the Next link last in
// meta.links - and, unlike the numbered entries, those two can carry a real
// (non-null) page number whenever they're not at a boundary, so filtering by
// page !== null alone doesn't exclude them. Drop them by position instead,
// then filter out any remaining non-numbered entries (the "..." ellipsis
// marker, which doesn't even have a `page` key at all).
const numberedLinks = computed<PaginationLink[]>(() => {
    const links = props.meta?.links ?? [];

    return links.slice(1, -1).filter((link) => typeof link.page === 'number');
});

function hasGapBefore(index: number): boolean {
    if (index === 0) {
        return false;
    }

    const previous = numberedLinks.value[index - 1]?.page;
    const current = numberedLinks.value[index]?.page;

    return (
        typeof previous === 'number' &&
        typeof current === 'number' &&
        current - previous > 1
    );
}

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

function handlePageClick(link: PaginationLink) {
    if (
        typeof link.page === 'number' &&
        link.page !== props.meta?.current_page
    ) {
        emit('update:page', link.page);
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

                <template
                    v-for="(link, index) in numberedLinks"
                    :key="link.page"
                >
                    <span
                        v-if="hasGapBefore(index)"
                        class="px-2 text-muted-foreground"
                        >&hellip;</span
                    >
                    <Button
                        :variant="link.active ? 'default' : 'outline'"
                        size="sm"
                        :aria-current="link.active ? 'page' : undefined"
                        @click="handlePageClick(link)"
                    >
                        {{ link.label }}
                    </Button>
                </template>

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
