import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import type { Company } from '@/types';
import CompaniesTable from './CompaniesTable.vue';

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

const stubs = {
    Tooltip: { template: '<div><slot /></div>' },
    TooltipTrigger: { template: '<div><slot /></div>' },
    TooltipContent: { template: '<div><slot /></div>' },
};

const baseProps = {
    selectedIds: [] as number[],
    sortColumn: null,
    sortDirection: 'asc' as const,
};

describe('CompaniesTable', () => {
    it('renders a row per company, including the id column', () => {
        const companies = [
            makeCompany({ id: 1, name: 'Acme Inc' }),
            makeCompany({
                id: 2,
                name: 'Globex Corp',
                email: 'info@globex.test',
            }),
        ];

        const wrapper = mount(CompaniesTable, {
            props: { ...baseProps, companies, loading: false },
            global: { stubs },
        });

        expect(wrapper.text()).toContain('Acme Inc');
        expect(wrapper.text()).toContain('Globex Corp');
        expect(wrapper.text()).toContain('info@globex.test');
        expect(wrapper.text()).toContain('1');
        expect(wrapper.text()).toContain('2');
    });

    it('shows a loading state', () => {
        const wrapper = mount(CompaniesTable, {
            props: { ...baseProps, companies: [], loading: true },
            global: { stubs },
        });

        expect(wrapper.text()).toContain('Loading');
    });

    it('shows an empty state when there are no companies', () => {
        const wrapper = mount(CompaniesTable, {
            props: { ...baseProps, companies: [], loading: false },
            global: { stubs },
        });

        expect(wrapper.text()).toContain('No companies found.');
    });

    it('emits view/edit/delete with the clicked company', async () => {
        const company = makeCompany();

        const wrapper = mount(CompaniesTable, {
            props: { ...baseProps, companies: [company], loading: false },
            global: { stubs },
        });

        await wrapper.find('[aria-label="View"]').trigger('click');
        await wrapper.find('[aria-label="Edit"]').trigger('click');
        await wrapper.find('[aria-label="Delete"]').trigger('click');

        expect(wrapper.emitted('view')?.[0]).toEqual([company]);
        expect(wrapper.emitted('edit')?.[0]).toEqual([company]);
        expect(wrapper.emitted('delete')?.[0]).toEqual([company]);
    });

    it('emits sort with the clicked column', async () => {
        const wrapper = mount(CompaniesTable, {
            props: { ...baseProps, companies: [makeCompany()], loading: false },
            global: { stubs },
        });

        const nameHeaderButton = wrapper
            .findAll('button')
            .find((button) => button.text().includes('Name'));

        await nameHeaderButton?.trigger('click');

        expect(wrapper.emitted('sort')?.[0]).toEqual(['name']);
    });

    it('selecting a row checkbox emits update:selectedIds with that id added', async () => {
        const company = makeCompany({ id: 5 });

        const wrapper = mount(CompaniesTable, {
            props: { ...baseProps, companies: [company], loading: false },
            global: { stubs },
        });

        await wrapper.find('[aria-label="Select Acme Inc"]').trigger('click');

        expect(wrapper.emitted('update:selectedIds')?.[0]).toEqual([[5]]);
    });

    it('the header checkbox selects all rows on the page', async () => {
        const companies = [makeCompany({ id: 1 }), makeCompany({ id: 2 })];

        const wrapper = mount(CompaniesTable, {
            props: { ...baseProps, companies, loading: false },
            global: { stubs },
        });

        await wrapper
            .find('[aria-label="Select all on this page"]')
            .trigger('click');

        expect(wrapper.emitted('update:selectedIds')?.[0]).toEqual([[1, 2]]);
    });

    it('the header checkbox deselects all rows when already fully selected', async () => {
        const companies = [makeCompany({ id: 1 }), makeCompany({ id: 2 })];

        const wrapper = mount(CompaniesTable, {
            props: {
                ...baseProps,
                selectedIds: [1, 2],
                companies,
                loading: false,
            },
            global: { stubs },
        });

        await wrapper
            .find('[aria-label="Select all on this page"]')
            .trigger('click');

        expect(wrapper.emitted('update:selectedIds')?.[0]).toEqual([[]]);
    });
});
