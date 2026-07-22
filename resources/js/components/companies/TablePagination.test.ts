import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import type { PaginationMeta } from '@/types';
import TablePagination from './TablePagination.vue';

function makeMeta(overrides: Partial<PaginationMeta> = {}): PaginationMeta {
    return {
        current_page: 2,
        from: 16,
        last_page: 5,
        per_page: 15,
        to: 30,
        total: 70,
        ...overrides,
    };
}

describe('TablePagination', () => {
    it('renders the showing-range summary', () => {
        const wrapper = mount(TablePagination, {
            props: { meta: makeMeta(), perPage: 15 },
        });

        expect(wrapper.text()).toContain('Showing 16');
        expect(wrapper.text()).toContain('30');
        expect(wrapper.text()).toContain('70');
    });

    it('disables Previous on the first page and Next on the last page', () => {
        const firstPage = mount(TablePagination, {
            props: { meta: makeMeta({ current_page: 1 }), perPage: 15 },
        });
        const lastPage = mount(TablePagination, {
            props: {
                meta: makeMeta({ current_page: 5, last_page: 5 }),
                perPage: 15,
            },
        });

        expect(
            firstPage
                .findAll('button')
                .find((b) => b.text() === 'Previous')
                ?.attributes('disabled'),
        ).toBeDefined();
        expect(
            lastPage
                .findAll('button')
                .find((b) => b.text() === 'Next')
                ?.attributes('disabled'),
        ).toBeDefined();
    });

    it('emits update:page when Next is clicked', async () => {
        const wrapper = mount(TablePagination, {
            props: { meta: makeMeta(), perPage: 15 },
        });

        await wrapper
            .findAll('button')
            .find((b) => b.text() === 'Next')
            ?.trigger('click');

        expect(wrapper.emitted('update:page')?.[0]).toEqual([3]);
    });

    it('emits update:page when Previous is clicked', async () => {
        const wrapper = mount(TablePagination, {
            props: { meta: makeMeta(), perPage: 15 },
        });

        await wrapper
            .findAll('button')
            .find((b) => b.text() === 'Previous')
            ?.trigger('click');

        expect(wrapper.emitted('update:page')?.[0]).toEqual([1]);
    });
});
