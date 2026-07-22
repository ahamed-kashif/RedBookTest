import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import CompaniesFilters from './CompaniesFilters.vue';

const baseProps = {
    search: '',
    createdFrom: '',
    createdTo: '',
    startingFrom: '',
    startingTo: '',
    selectedCount: 0,
};

describe('CompaniesFilters', () => {
    it('renders a search input and four date inputs', () => {
        const wrapper = mount(CompaniesFilters, { props: baseProps });

        expect(wrapper.find('#company-search').exists()).toBe(true);
        expect(wrapper.find('#created-from').exists()).toBe(true);
        expect(wrapper.find('#created-to').exists()).toBe(true);
        expect(wrapper.find('#starting-from').exists()).toBe(true);
        expect(wrapper.find('#starting-to').exists()).toBe(true);
    });

    it('debounces the search input before emitting update:search', async () => {
        vi.useFakeTimers();

        const wrapper = mount(CompaniesFilters, { props: baseProps });

        await wrapper.find('#company-search').setValue('acme');
        expect(wrapper.emitted('update:search')).toBeUndefined();

        vi.advanceTimersByTime(300);
        await wrapper.vm.$nextTick();

        expect(wrapper.emitted('update:search')?.at(-1)).toEqual(['acme']);

        vi.useRealTimers();
    });

    it('emits date filter updates immediately without debouncing', async () => {
        const wrapper = mount(CompaniesFilters, { props: baseProps });

        await wrapper.find('#created-from').setValue('2024-01-01');

        expect(wrapper.emitted('update:createdFrom')?.[0]).toEqual([
            '2024-01-01',
        ]);
    });

    it('shows the delete-selected button only when rows are selected', async () => {
        const none = mount(CompaniesFilters, { props: baseProps });
        expect(none.text()).not.toContain('Delete selected');

        const some = mount(CompaniesFilters, {
            props: { ...baseProps, selectedCount: 3 },
        });
        expect(some.text()).toContain('Delete selected (3)');

        await some.find('button').trigger('click');
        expect(some.emitted('deleteSelected')).toHaveLength(1);
    });
});
