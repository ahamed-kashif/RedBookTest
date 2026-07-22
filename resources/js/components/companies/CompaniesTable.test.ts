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

describe('CompaniesTable', () => {
    it('renders a row per company', () => {
        const companies = [
            makeCompany({ id: 1, name: 'Acme Inc' }),
            makeCompany({
                id: 2,
                name: 'Globex Corp',
                email: 'info@globex.test',
            }),
        ];

        const wrapper = mount(CompaniesTable, {
            props: { companies, loading: false },
            global: { stubs },
        });

        expect(wrapper.text()).toContain('Acme Inc');
        expect(wrapper.text()).toContain('Globex Corp');
        expect(wrapper.text()).toContain('info@globex.test');
    });

    it('shows a loading state', () => {
        const wrapper = mount(CompaniesTable, {
            props: { companies: [], loading: true },
            global: { stubs },
        });

        expect(wrapper.text()).toContain('Loading');
    });

    it('shows an empty state when there are no companies', () => {
        const wrapper = mount(CompaniesTable, {
            props: { companies: [], loading: false },
            global: { stubs },
        });

        expect(wrapper.text()).toContain('No companies found.');
    });

    it('emits view/edit/delete with the clicked company', async () => {
        const company = makeCompany();

        const wrapper = mount(CompaniesTable, {
            props: { companies: [company], loading: false },
            global: { stubs },
        });

        const buttons = wrapper.findAll('button');
        await buttons[0]?.trigger('click');
        await buttons[1]?.trigger('click');
        await buttons[2]?.trigger('click');

        expect(wrapper.emitted('view')?.[0]).toEqual([company]);
        expect(wrapper.emitted('edit')?.[0]).toEqual([company]);
        expect(wrapper.emitted('delete')?.[0]).toEqual([company]);
    });
});
