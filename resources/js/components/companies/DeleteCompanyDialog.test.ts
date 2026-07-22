import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import type { Company } from '@/types';

const submitMock = vi.fn();
const destroyMock = vi.fn(({ company }: { company: number }) => ({
    url: `/api/companies/${company}`,
    method: 'delete',
}));
const destroyManyMock = vi.fn(() => ({
    url: '/api/companies',
    method: 'delete',
}));

const dialogStubs = {
    teleport: true,
    Dialog: { template: '<div><slot /></div>' },
    DialogContent: { template: '<div><slot /></div>' },
    DialogHeader: { template: '<div><slot /></div>' },
    DialogFooter: { template: '<div><slot /></div>' },
    DialogTitle: { template: '<div><slot /></div>' },
    DialogDescription: { template: '<div><slot /></div>' },
    DialogClose: { template: '<span><slot /></span>' },
};

let form: { ids: number[]; processing: boolean; submit: typeof submitMock };

vi.mock('@inertiajs/vue3', () => ({
    useHttp: (initialData: { ids: number[] }) => {
        form = { ...initialData, processing: false, submit: submitMock };

        return form;
    },
}));

vi.mock('@/routes/companies', () => ({
    destroy: (args: { company: number }) => destroyMock(args),
    destroyMany: () => destroyManyMock(),
}));

vi.mock('vue-sonner', () => ({
    toast: { success: vi.fn(), error: vi.fn() },
}));

import DeleteCompanyDialog from './DeleteCompanyDialog.vue';

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

beforeEach(() => {
    submitMock.mockReset();
    destroyMock.mockClear();
    destroyManyMock.mockClear();
});

describe('DeleteCompanyDialog', () => {
    it('shows the company name in the confirmation for a single company', async () => {
        const wrapper = mount(DeleteCompanyDialog, {
            props: {
                companies: [makeCompany({ name: 'Acme Inc' })],
                isOpen: true,
            },
            global: { stubs: dialogStubs },
        });
        await nextTick();

        expect(wrapper.text()).toContain('Delete Acme Inc?');
    });

    it('shows the company count in the confirmation for bulk delete', async () => {
        const wrapper = mount(DeleteCompanyDialog, {
            props: {
                companies: [
                    makeCompany({ id: 1 }),
                    makeCompany({ id: 2 }),
                    makeCompany({ id: 3 }),
                ],
                isOpen: true,
            },
            global: { stubs: dialogStubs },
        });
        await nextTick();

        expect(wrapper.text()).toContain('Delete 3 companies?');
    });

    it('calls the single destroy route and emits deleted for one company', async () => {
        submitMock.mockImplementation(
            async (_route: unknown, options: { onSuccess?: () => void }) => {
                options.onSuccess?.();
            },
        );

        const company = makeCompany({ id: 42 });
        const wrapper = mount(DeleteCompanyDialog, {
            props: { companies: [company], isOpen: true },
            global: { stubs: dialogStubs },
        });
        await nextTick();

        await wrapper
            .findAll('button')
            .find((b) => b.text() === 'Delete')
            ?.trigger('click');
        await wrapper.vm.$nextTick();

        expect(destroyMock).toHaveBeenCalledWith({ company: 42 });
        expect(destroyManyMock).not.toHaveBeenCalled();
        expect(submitMock).toHaveBeenCalledTimes(1);
        expect(wrapper.emitted('deleted')?.[0]).toEqual([[42]]);
        expect(wrapper.emitted('update:isOpen')?.at(-1)).toEqual([false]);
    });

    it('calls the bulk destroy route and emits deleted with all ids', async () => {
        submitMock.mockImplementation(
            async (_route: unknown, options: { onSuccess?: () => void }) => {
                options.onSuccess?.();
            },
        );

        const companies = [
            makeCompany({ id: 1 }),
            makeCompany({ id: 2 }),
            makeCompany({ id: 3 }),
        ];
        const wrapper = mount(DeleteCompanyDialog, {
            props: { companies, isOpen: true },
            global: { stubs: dialogStubs },
        });
        await nextTick();

        await wrapper
            .findAll('button')
            .find((b) => b.text() === 'Delete')
            ?.trigger('click');
        await wrapper.vm.$nextTick();

        expect(destroyManyMock).toHaveBeenCalledTimes(1);
        expect(destroyMock).not.toHaveBeenCalled();
        expect(form.ids).toEqual([1, 2, 3]);
        expect(wrapper.emitted('deleted')?.[0]).toEqual([[1, 2, 3]]);
    });

    it('does not call delete when Cancel is clicked', async () => {
        const wrapper = mount(DeleteCompanyDialog, {
            props: { companies: [makeCompany()], isOpen: true },
            global: { stubs: dialogStubs },
        });
        await nextTick();

        await wrapper
            .findAll('button')
            .find((b) => b.text() === 'Cancel')
            ?.trigger('click');

        expect(submitMock).not.toHaveBeenCalled();
    });
});
