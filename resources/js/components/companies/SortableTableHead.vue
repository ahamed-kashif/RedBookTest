<script setup lang="ts">
import { ArrowDown, ArrowUp, ChevronsUpDown } from '@lucide/vue';
import { TableHead } from '@/components/ui/table';
import type { CompanySortColumn, SortDirection } from '@/types';

type Props = {
    column: CompanySortColumn;
    sortColumn: CompanySortColumn | null;
    sortDirection: SortDirection;
    class?: string;
};

type Emits = {
    sort: [column: CompanySortColumn];
};

const props = defineProps<Props>();
const emit = defineEmits<Emits>();
</script>

<template>
    <TableHead :class="props.class">
        <button
            type="button"
            class="flex items-center gap-1"
            @click="emit('sort', column)"
        >
            <slot />
            <ArrowUp
                v-if="sortColumn === column && sortDirection === 'asc'"
                class="size-3.5"
            />
            <ArrowDown v-else-if="sortColumn === column" class="size-3.5" />
            <ChevronsUpDown v-else class="size-3.5 text-muted-foreground" />
        </button>
    </TableHead>
</template>
