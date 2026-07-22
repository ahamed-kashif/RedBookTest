<script setup lang="ts">
import { Eye, Pencil, Trash2 } from '@lucide/vue';
import { computed } from 'vue';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import type { Company, CompanySortColumn, SortDirection } from '@/types';
import SortableTableHead from './SortableTableHead.vue';

type Props = {
    companies: Company[];
    loading: boolean;
    selectedIds: number[];
    sortColumn: CompanySortColumn | null;
    sortDirection: SortDirection;
};

type Emits = {
    view: [company: Company];
    edit: [company: Company];
    delete: [company: Company];
    'update:selectedIds': [ids: number[]];
    sort: [column: CompanySortColumn];
};

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const columnCount = 8; // checkbox, id, name, address, email, starting date, created, actions

const headerCheckboxState = computed<boolean | 'indeterminate'>(() => {
    if (props.companies.length === 0) {
        return false;
    }

    const selectedOnPage = props.companies.filter((company) =>
        props.selectedIds.includes(company.id),
    ).length;

    if (selectedOnPage === 0) {
        return false;
    }

    return selectedOnPage === props.companies.length ? true : 'indeterminate';
});

function toggleSelectAll(value: boolean | 'indeterminate') {
    if (value === true) {
        emit(
            'update:selectedIds',
            props.companies.map((company) => company.id),
        );
    } else {
        emit('update:selectedIds', []);
    }
}

function toggleRow(companyId: number, value: boolean | 'indeterminate') {
    if (value === true) {
        emit('update:selectedIds', [...props.selectedIds, companyId]);
    } else {
        emit(
            'update:selectedIds',
            props.selectedIds.filter((id) => id !== companyId),
        );
    }
}

function isSelected(companyId: number): boolean {
    return props.selectedIds.includes(companyId);
}
</script>

<template>
    <Table>
        <TableHeader>
            <TableRow>
                <TableHead class="w-10">
                    <Checkbox
                        :model-value="headerCheckboxState"
                        aria-label="Select all on this page"
                        @update:model-value="toggleSelectAll"
                    />
                </TableHead>
                <SortableTableHead
                    column="id"
                    :sort-column="sortColumn"
                    :sort-direction="sortDirection"
                    @sort="$emit('sort', $event)"
                >
                    ID
                </SortableTableHead>
                <SortableTableHead
                    column="name"
                    :sort-column="sortColumn"
                    :sort-direction="sortDirection"
                    @sort="$emit('sort', $event)"
                >
                    Name
                </SortableTableHead>
                <SortableTableHead
                    column="address"
                    :sort-column="sortColumn"
                    :sort-direction="sortDirection"
                    @sort="$emit('sort', $event)"
                >
                    Address
                </SortableTableHead>
                <SortableTableHead
                    column="email"
                    :sort-column="sortColumn"
                    :sort-direction="sortDirection"
                    @sort="$emit('sort', $event)"
                >
                    Email
                </SortableTableHead>
                <SortableTableHead
                    column="starting_date"
                    :sort-column="sortColumn"
                    :sort-direction="sortDirection"
                    @sort="$emit('sort', $event)"
                >
                    Starting Date
                </SortableTableHead>
                <SortableTableHead
                    column="created_at"
                    :sort-column="sortColumn"
                    :sort-direction="sortDirection"
                    @sort="$emit('sort', $event)"
                >
                    Created
                </SortableTableHead>
                <TableHead class="text-right">Actions</TableHead>
            </TableRow>
        </TableHeader>
        <TableBody>
            <TableRow v-if="loading">
                <TableCell
                    :colspan="columnCount"
                    class="text-center text-muted-foreground"
                >
                    Loading&hellip;
                </TableCell>
            </TableRow>
            <TableRow v-else-if="companies.length === 0">
                <TableCell
                    :colspan="columnCount"
                    class="text-center text-muted-foreground"
                >
                    No companies found.
                </TableCell>
            </TableRow>
            <TableRow v-for="company in companies" v-else :key="company.id">
                <TableCell>
                    <Checkbox
                        :model-value="isSelected(company.id)"
                        :aria-label="`Select ${company.name}`"
                        @update:model-value="
                            (value) => toggleRow(company.id, value)
                        "
                    />
                </TableCell>
                <TableCell>{{ company.id }}</TableCell>
                <TableCell class="font-medium">{{ company.name }}</TableCell>
                <TableCell>{{ company.address }}</TableCell>
                <TableCell>{{ company.email }}</TableCell>
                <TableCell>{{ company.starting_date }}</TableCell>
                <TableCell>{{ company.created_at }}</TableCell>
                <TableCell class="text-right">
                    <div class="flex justify-end gap-1">
                        <Tooltip>
                            <TooltipTrigger as-child>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    aria-label="View"
                                    @click="$emit('view', company)"
                                >
                                    <Eye class="size-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>View</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger as-child>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    aria-label="Edit"
                                    @click="$emit('edit', company)"
                                >
                                    <Pencil class="size-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Edit</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger as-child>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    aria-label="Delete"
                                    @click="$emit('delete', company)"
                                >
                                    <Trash2 class="size-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Delete</TooltipContent>
                        </Tooltip>
                    </div>
                </TableCell>
            </TableRow>
        </TableBody>
    </Table>
</template>
