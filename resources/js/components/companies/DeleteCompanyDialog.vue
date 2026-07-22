<script setup lang="ts">
import { useHttp } from '@inertiajs/vue3';
import { toast } from 'vue-sonner';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { destroy } from '@/routes/companies';
import type { Company } from '@/types';

type Props = {
    company: Company | null;
};

type Emits = {
    deleted: [companyId: number];
};

const props = defineProps<Props>();
const emit = defineEmits<Emits>();
const isOpen = defineModel<boolean>('isOpen', { default: false });

const http = useHttp();

async function confirmDelete() {
    if (!props.company) {
        return;
    }

    const companyId = props.company.id;

    await http.submit(destroy({ company: companyId }), {
        onSuccess: () => {
            toast.success('Company deleted');
            emit('deleted', companyId);
            isOpen.value = false;
        },
        onError: () => {
            toast.error('Failed to delete company');
        },
    });
}
</script>

<template>
    <Dialog :open="isOpen" @update:open="isOpen = $event">
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Delete {{ company?.name }}?</DialogTitle>
                <DialogDescription>
                    This action cannot be undone. This will permanently delete
                    this company.
                </DialogDescription>
            </DialogHeader>

            <DialogFooter class="gap-2">
                <DialogClose as-child>
                    <Button variant="secondary" :disabled="http.processing">
                        Cancel
                    </Button>
                </DialogClose>
                <Button
                    variant="destructive"
                    :disabled="http.processing"
                    @click="confirmDelete"
                >
                    Delete
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</template>
