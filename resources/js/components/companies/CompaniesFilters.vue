<script setup lang="ts">
import { Trash2 } from '@lucide/vue';
import { refDebounced } from '@vueuse/core';
import { ref, watch } from 'vue';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Props = {
    search: string;
    createdFrom: string;
    createdTo: string;
    startingFrom: string;
    startingTo: string;
    selectedCount: number;
};

type Emits = {
    'update:search': [value: string];
    'update:createdFrom': [value: string];
    'update:createdTo': [value: string];
    'update:startingFrom': [value: string];
    'update:startingTo': [value: string];
    deleteSelected: [];
};

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const localSearch = ref(props.search);
const debouncedSearch = refDebounced(localSearch, 300);

watch(debouncedSearch, (value) => emit('update:search', value));
watch(
    () => props.search,
    (value) => {
        localSearch.value = value;
    },
);
</script>

<template>
    <div class="flex flex-wrap items-end gap-3">
        <div class="grid gap-1.5">
            <Label for="company-search">Search</Label>
            <Input
                id="company-search"
                v-model="localSearch"
                placeholder="Name, address, or email"
                class="w-56"
            />
        </div>

        <div class="grid gap-1.5">
            <Label for="created-from">Created From</Label>
            <Input
                id="created-from"
                type="date"
                :model-value="createdFrom"
                class="w-40"
                @update:model-value="
                    $emit('update:createdFrom', String($event))
                "
            />
        </div>

        <div class="grid gap-1.5">
            <Label for="created-to">Created To</Label>
            <Input
                id="created-to"
                type="date"
                :model-value="createdTo"
                class="w-40"
                @update:model-value="$emit('update:createdTo', String($event))"
            />
        </div>

        <div class="grid gap-1.5">
            <Label for="starting-from">Starting From</Label>
            <Input
                id="starting-from"
                type="date"
                :model-value="startingFrom"
                class="w-40"
                @update:model-value="
                    $emit('update:startingFrom', String($event))
                "
            />
        </div>

        <div class="grid gap-1.5">
            <Label for="starting-to">Starting To</Label>
            <Input
                id="starting-to"
                type="date"
                :model-value="startingTo"
                class="w-40"
                @update:model-value="$emit('update:startingTo', String($event))"
            />
        </div>

        <Button
            v-if="selectedCount > 0"
            variant="destructive"
            @click="$emit('deleteSelected')"
        >
            <Trash2 class="size-4" />
            Delete selected ({{ selectedCount }})
        </Button>
    </div>
</template>
