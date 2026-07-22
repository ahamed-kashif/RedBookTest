<script setup lang="ts">
import { Eye, Pencil, Trash2 } from '@lucide/vue';
import { Button } from '@/components/ui/button';
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
import type { Company } from '@/types';

type Props = {
    companies: Company[];
    loading: boolean;
};

type Emits = {
    view: [company: Company];
    edit: [company: Company];
    delete: [company: Company];
};

defineProps<Props>();
defineEmits<Emits>();
</script>

<template>
    <Table>
        <TableHeader>
            <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Starting Date</TableHead>
                <TableHead class="text-right">Actions</TableHead>
            </TableRow>
        </TableHeader>
        <TableBody>
            <TableRow v-if="loading">
                <TableCell
                    colspan="5"
                    class="text-center text-muted-foreground"
                >
                    Loading&hellip;
                </TableCell>
            </TableRow>
            <TableRow v-else-if="companies.length === 0">
                <TableCell
                    colspan="5"
                    class="text-center text-muted-foreground"
                >
                    No companies found.
                </TableCell>
            </TableRow>
            <TableRow v-for="company in companies" v-else :key="company.id">
                <TableCell class="font-medium">{{ company.name }}</TableCell>
                <TableCell>{{ company.address }}</TableCell>
                <TableCell>{{ company.email }}</TableCell>
                <TableCell>{{ company.starting_date }}</TableCell>
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
