import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import type { PaginationLink, PaginationMeta } from '@/types';
import TablePagination from './TablePagination.vue';

// Mirrors Laravel's actual paginator output: Previous/Next carry a real page
// number whenever they're not at a boundary (only null at the very first/last
// page) - this is what caused the original scrambled-pagination bug, so the
// fixture must reflect it rather than always using page: null.
function makeLinks(currentPage: number, lastPage: number): PaginationLink[] {
    const links: PaginationLink[] = [
        {
            url: null,
            label: '&laquo; Previous',
            page: currentPage > 1 ? currentPage - 1 : null,
            active: false,
        },
    ];

    for (let page = 1; page <= lastPage; page++) {
        links.push({
            url: `/api/companies?page=${page}`,
            label: String(page),
            page,
            active: page === currentPage,
        });
    }

    links.push({
        url: null,
        label: 'Next &raquo;',
        page: currentPage < lastPage ? currentPage + 1 : null,
        active: false,
    });

    return links;
}

function makeMeta(overrides: Partial<PaginationMeta> = {}): PaginationMeta {
    const current_page = overrides.current_page ?? 2;
    const last_page = overrides.last_page ?? 5;

    return {
        current_page,
        from: 16,
        last_page,
        per_page: 15,
        to: 30,
        total: 70,
        links: makeLinks(current_page, last_page),
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

    it('renders exactly one button per numbered page, with no duplicates', () => {
        const wrapper = mount(TablePagination, {
            props: {
                meta: makeMeta({ current_page: 2, last_page: 5 }),
                perPage: 15,
            },
        });

        const numberedTexts = wrapper
            .findAll('button')
            .map((b) => b.text())
            .filter((text) => /^\d+$/.test(text));

        expect(numberedTexts).toEqual(['1', '2', '3', '4', '5']);
    });

    it('does not duplicate a numbered page even when Previous/Next share its page number', () => {
        // Regression test: at current_page=2/last_page=5, Previous.page === 1
        // and Next.page === 3, both of which also appear as real numbered
        // entries. Previously this caused "1 2 3 2 2 ... 3 4 3 2 3 2 1 2 3 4 5"
        // style scrambled rendering instead of a clean "1 2 3 4 5".
        const wrapper = mount(TablePagination, {
            props: {
                meta: makeMeta({ current_page: 2, last_page: 5 }),
                perPage: 15,
            },
        });

        // Exclude the per-page Select's own trigger button (empty text).
        const allButtonTexts = wrapper
            .findAll('button')
            .map((b) => b.text())
            .filter((text) => text !== '');

        expect(allButtonTexts).toEqual([
            'Previous',
            '1',
            '2',
            '3',
            '4',
            '5',
            'Next',
        ]);
    });

    it('emits update:page with the clicked page number', async () => {
        const wrapper = mount(TablePagination, {
            props: {
                meta: makeMeta({ current_page: 2, last_page: 5 }),
                perPage: 15,
            },
        });

        await wrapper
            .findAll('button')
            .find((b) => b.text() === '4')
            ?.trigger('click');

        expect(wrapper.emitted('update:page')?.[0]).toEqual([4]);
    });

    it('marks the active page with aria-current', () => {
        const wrapper = mount(TablePagination, {
            props: {
                meta: makeMeta({ current_page: 2, last_page: 5 }),
                perPage: 15,
            },
        });

        const activeButton = wrapper
            .findAll('button')
            .find((b) => b.text() === '2');

        expect(activeButton?.attributes('aria-current')).toBe('page');
    });

    it('does not render the raw Previous/Next/ellipsis labels as numbered buttons', () => {
        const wrapper = mount(TablePagination, {
            props: {
                meta: makeMeta({ current_page: 2, last_page: 5 }),
                perPage: 15,
            },
        });

        expect(wrapper.text()).not.toContain('&laquo;');
        expect(wrapper.text()).not.toContain('&raquo;');
    });

    it('renders an ellipsis when page numbers are non-consecutive', () => {
        const links: PaginationLink[] = [
            { url: null, label: '&laquo; Previous', page: 1, active: false },
            { url: '?page=1', label: '1', page: 1, active: false },
            { url: '?page=2', label: '2', page: 2, active: true },
            { url: null, label: '...', active: false },
            { url: '?page=9', label: '9', page: 9, active: false },
            { url: '?page=10', label: '10', page: 10, active: false },
            { url: null, label: 'Next &raquo;', page: 3, active: false },
        ];

        const wrapper = mount(TablePagination, {
            props: {
                meta: {
                    current_page: 2,
                    from: 16,
                    last_page: 10,
                    per_page: 15,
                    to: 30,
                    total: 150,
                    links,
                },
                perPage: 15,
            },
        });

        expect(wrapper.text()).toContain('…');

        const numberedTexts = wrapper
            .findAll('button')
            .map((b) => b.text())
            .filter((text) => /^\d+$/.test(text));

        expect(numberedTexts).toEqual(['1', '2', '9', '10']);
    });
});
