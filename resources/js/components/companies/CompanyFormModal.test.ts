import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick, reactive } from 'vue';
import type { Company } from '@/types';

type MockForm = Record<string, unknown> & {
    errors: Record<string, string>;
    processing: boolean;
    defaults: (fields?: Record<string, unknown>) => MockForm;
    reset: () => MockForm;
    clearErrors: () => MockForm;
    submit: ReturnType<typeof vi.fn>;
};

let latestForm: MockForm | null = null;

function createMockForm(initialData: Record<string, unknown>): MockForm {
    let defaultValues = { ...initialData };

    const form = reactive({
        ...initialData,
        errors: {},
        processing: false,
        defaults(fields?: Record<string, unknown>) {
            if (fields) {
                defaultValues = { ...fields };
            }

            return form;
        },
        reset() {
            Object.assign(form, defaultValues);

            return form;
        },
        clearErrors() {
            form.errors = {};

            return form;
        },
        submit: vi.fn(),
    }) as MockForm;

    latestForm = form;

    return form;
}

vi.mock('@inertiajs/vue3', () => ({
    useHttp: (initialData: Record<string, unknown>) =>
        createMockForm(initialData),
}));

vi.mock('@/routes/companies', () => ({
    store: () => ({ url: '/api/companies', method: 'post' }),
    update: ({ company }: { company: number }) => ({
        url: `/api/companies/${company}`,
        method: 'put',
    }),
}));

vi.mock('vue-sonner', () => ({
    toast: { success: vi.fn(), error: vi.fn() },
}));

import CompanyFormModal from './CompanyFormModal.vue';

function makeCompany(overrides: Partial<Company> = {}): Company {
    return {
        id: 1,
        name: 'Acme Inc',
        address: '123 Main St',
        email: 'info@acme.test',
        starting_date: '2020-01-01',
        created_at: '2020-01-01T00:00:00Z',
        updated_at: '2020-01-01T00:00:00Z',
        ...overrides,
    };
}

type MountProps = {
    mode: 'create' | 'edit' | 'view';
    company: Company | null;
    isOpen: boolean;
};

const dialogStubs = {
    teleport: true,
    Dialog: { template: '<div><slot /></div>' },
    DialogContent: { template: '<div><slot /></div>' },
    DialogHeader: { template: '<div><slot /></div>' },
    DialogFooter: { template: '<div><slot /></div>' },
    DialogTitle: { template: '<div><slot /></div>' },
};

function mountModal(props: MountProps) {
    return mount(CompanyFormModal, {
        props,
        global: { stubs: dialogStubs },
    });
}

beforeEach(() => {
    latestForm = null;
});

describe('CompanyFormModal', () => {
    it('renders blank, enabled inputs in create mode', async () => {
        const wrapper = mountModal({
            mode: 'create',
            company: null,
            isOpen: true,
        });
        await nextTick();

        const nameInput = wrapper.find('#company-name')
            .element as HTMLInputElement;

        expect(nameInput.value).toBe('');
        expect(nameInput.disabled).toBe(false);
        expect(wrapper.text()).toContain('Create Company');
    });

    it('pre-fills fields from the company prop in edit mode', async () => {
        const company = makeCompany();

        const wrapper = mountModal({ mode: 'edit', company, isOpen: true });
        await nextTick();

        const nameInput = wrapper.find('#company-name')
            .element as HTMLInputElement;

        expect(nameInput.value).toBe('Acme Inc');
        expect(nameInput.disabled).toBe(false);
        expect(wrapper.text()).toContain('Edit Company');
    });

    it('renders disabled fields and no submit button in view mode', async () => {
        const company = makeCompany();

        const wrapper = mountModal({ mode: 'view', company, isOpen: true });
        await nextTick();

        const nameInput = wrapper.find('#company-name')
            .element as HTMLInputElement;

        expect(nameInput.value).toBe('Acme Inc');
        expect(nameInput.disabled).toBe(true);
        expect(wrapper.find('button[type="submit"]').exists()).toBe(false);
        expect(wrapper.text()).toContain('Close');
        expect(wrapper.text()).toContain('Edit');
    });

    it('renders field validation errors after a failed submit', async () => {
        const wrapper = mountModal({
            mode: 'create',
            company: null,
            isOpen: true,
        });
        await nextTick();

        latestForm!.submit.mockImplementation(
            async (_route: unknown, options: { onError?: () => void }) => {
                latestForm!.errors = { name: 'The name field is required.' };
                options.onError?.();
            },
        );

        await wrapper.find('form').trigger('submit.prevent');
        await wrapper.vm.$nextTick();

        expect(wrapper.text()).toContain('The name field is required.');
    });

    it('emits saved and closes on a successful submit', async () => {
        const wrapper = mountModal({
            mode: 'create',
            company: null,
            isOpen: true,
        });
        await nextTick();

        const created = makeCompany({ id: 99, name: 'New Co' });

        latestForm!.submit.mockImplementation(
            async (
                _route: unknown,
                options: { onSuccess?: (response: unknown) => void },
            ) => {
                options.onSuccess?.({ data: created });
            },
        );

        await wrapper.find('form').trigger('submit.prevent');
        await wrapper.vm.$nextTick();

        expect(wrapper.emitted('saved')?.[0]).toEqual([created]);
        expect(wrapper.emitted('update:isOpen')?.at(-1)).toEqual([false]);
    });
});
