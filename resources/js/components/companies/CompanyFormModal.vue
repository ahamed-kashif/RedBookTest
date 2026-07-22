<script setup lang="ts">
import { useHttp } from '@inertiajs/vue3';
import { ref, watch } from 'vue';
import { toast } from 'vue-sonner';
import InputError from '@/components/InputError.vue';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { store, update } from '@/routes/companies';
import type { Company, CompanyFormData } from '@/types';

type Mode = 'create' | 'edit' | 'view';

type Props = {
    mode: Mode;
    company?: Company | null;
};

type Emits = {
    saved: [company: Company];
};

const props = defineProps<Props>();
const emit = defineEmits<Emits>();
const isOpen = defineModel<boolean>('isOpen', { default: false });

const currentMode = ref<Mode>(props.mode);

function blankForm(): CompanyFormData {
    return { name: '', address: '', email: '', starting_date: '' };
}

function formFromCompany(company: Company): CompanyFormData {
    return {
        name: company.name,
        address: company.address,
        email: company.email,
        starting_date: company.starting_date,
    };
}

const form = useHttp<CompanyFormData>(
    props.company ? formFromCompany(props.company) : blankForm(),
);

watch(
    () => [props.company, props.mode, isOpen.value] as const,
    ([company, mode]) => {
        currentMode.value = mode;
        form.defaults(company ? formFromCompany(company) : blankForm()).reset();
        form.clearErrors();
    },
);

const isViewMode = () => currentMode.value === 'view';

function switchToEdit() {
    currentMode.value = 'edit';
}

function close() {
    isOpen.value = false;
}

async function handleSubmit() {
    const routeDefinition =
        currentMode.value === 'create'
            ? store()
            : update({ company: props.company!.id });

    await form.submit(routeDefinition, {
        onSuccess: (response) => {
            const company = (response as { data: Company }).data;

            toast.success(
                currentMode.value === 'create'
                    ? 'Company created'
                    : 'Company updated',
            );

            emit('saved', company);
            isOpen.value = false;
        },
        onError: () => {
            toast.error('Please fix the errors below');
        },
    });
}
</script>

<template>
    <Dialog :open="isOpen" @update:open="isOpen = $event">
        <DialogContent>
            <DialogHeader>
                <DialogTitle>
                    <template v-if="currentMode === 'create'">
                        Create Company
                    </template>
                    <template v-else-if="currentMode === 'edit'">
                        Edit Company
                    </template>
                    <template v-else>View Company</template>
                </DialogTitle>
            </DialogHeader>

            <form class="space-y-4" @submit.prevent="handleSubmit">
                <div class="grid gap-2">
                    <Label for="company-name">Company Name</Label>
                    <Input
                        id="company-name"
                        v-model="form.name"
                        :disabled="isViewMode()"
                    />
                    <InputError :message="form.errors.name" />
                </div>

                <div class="grid gap-2">
                    <Label for="company-address">Address</Label>
                    <Input
                        id="company-address"
                        v-model="form.address"
                        :disabled="isViewMode()"
                    />
                    <InputError :message="form.errors.address" />
                </div>

                <div class="grid gap-2">
                    <Label for="company-email">Email</Label>
                    <Input
                        id="company-email"
                        type="email"
                        v-model="form.email"
                        :disabled="isViewMode()"
                    />
                    <InputError :message="form.errors.email" />
                </div>

                <div class="grid gap-2">
                    <Label for="company-starting-date">Starting Date</Label>
                    <Input
                        id="company-starting-date"
                        type="date"
                        v-model="form.starting_date"
                        :disabled="isViewMode()"
                    />
                    <InputError :message="form.errors.starting_date" />
                </div>

                <DialogFooter class="gap-2">
                    <template v-if="isViewMode()">
                        <Button
                            type="button"
                            variant="secondary"
                            @click="close"
                        >
                            Close
                        </Button>
                        <Button type="button" @click="switchToEdit">
                            Edit
                        </Button>
                    </template>
                    <template v-else>
                        <Button
                            type="button"
                            variant="secondary"
                            :disabled="form.processing"
                            @click="close"
                        >
                            Cancel
                        </Button>
                        <Button type="submit" :disabled="form.processing">
                            Save
                        </Button>
                    </template>
                </DialogFooter>
            </form>
        </DialogContent>
    </Dialog>
</template>
