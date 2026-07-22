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
import { destroy, destroyMany } from '@/routes/companies';
import type { Company } from '@/types';

type Props = {
    companies: Company[];
};

type Emits = {
    deleted: [companyIds: number[]];
};

const props = defineProps<Props>();
const emit = defineEmits<Emits>();
const isOpen = defineModel<boolean>('isOpen', { default: false });

const form = useHttp<{ ids: number[] }>({ ids: [] });

async function confirmDelete() {
    if (props.companies.length === 0) {
        return;
    }

    const ids = props.companies.map((company) => company.id);
    form.ids = ids;

    const routeDefinition =
        ids.length === 1 ? destroy({ company: ids[0] }) : destroyMany();

    await form.submit(routeDefinition, {
        onSuccess: () => {
            toast.success(
                ids.length === 1
                    ? 'Company deleted'
                    : `${ids.length} companies deleted`,
            );
            emit('deleted', ids);
            isOpen.value = false;
        },
        onError: () => {
            toast.error('Failed to delete');
        },
    });
}
</script>

<template>
    <Dialog :open="isOpen" @update:open="isOpen = $event">
        <DialogContent>
            <DialogHeader>
                <DialogTitle>
                    Delete
                    {{
                        companies.length === 1
                            ? companies[0]?.name
                            : `${companies.length} companies`
                    }}?
                </DialogTitle>
                <DialogDescription>
                    This action cannot be undone. This will permanently delete
                    {{
                        companies.length === 1
                            ? 'this company'
                            : 'these companies'
                    }}.
                </DialogDescription>
            </DialogHeader>

            <DialogFooter class="gap-2">
                <DialogClose as-child>
                    <Button variant="secondary" :disabled="form.processing">
                        Cancel
                    </Button>
                </DialogClose>
                <Button
                    variant="destructive"
                    :disabled="form.processing"
                    @click="confirmDelete"
                >
                    Delete
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</template>
