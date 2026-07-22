import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import type { Company } from '@/types';

const submitMock = vi.fn();

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

vi.mock('@inertiajs/vue3', () => ({
    useHttp: () => ({ submit: submitMock, processing: false }),
}));

vi.mock('@/routes/companies', () => ({
    destroy: ({ company }: { company: number }) => ({
        url: `/api/companies/${company}`,
        method: 'delete',
    }),
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
});

describe('DeleteCompanyDialog', () => {
    it('shows the company name in the confirmation', async () => {
        const wrapper = mount(DeleteCompanyDialog, {
            props: { company: makeCompany({ name: 'Acme Inc' }), isOpen: true },
            global: { stubs: dialogStubs },
        });
        await nextTick();

        expect(wrapper.text()).toContain('Delete Acme Inc?');
    });

    it('calls delete and emits deleted on confirm', async () => {
        submitMock.mockImplementation(
            async (_route: unknown, options: { onSuccess?: () => void }) => {
                options.onSuccess?.();
            },
        );

        const company = makeCompany({ id: 42 });
        const wrapper = mount(DeleteCompanyDialog, {
            props: { company, isOpen: true },
            global: { stubs: dialogStubs },
        });
        await nextTick();

        await wrapper
            .findAll('button')
            .find((b) => b.text() === 'Delete')
            ?.trigger('click');
        await wrapper.vm.$nextTick();

        expect(submitMock).toHaveBeenCalledTimes(1);
        expect(wrapper.emitted('deleted')?.[0]).toEqual([42]);
        expect(wrapper.emitted('update:isOpen')?.at(-1)).toEqual([false]);
    });

    it('does not call delete when Cancel is clicked', async () => {
        const wrapper = mount(DeleteCompanyDialog, {
            props: { company: makeCompany(), isOpen: true },
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
