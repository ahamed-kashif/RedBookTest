import { describe, expect, it, vi } from 'vitest';
import { useCompanies } from '@/composables/useCompanies';
import type { Company, CompanyStats, Paginated } from '@/types';

const httpGetMock = vi.fn();

vi.mock('@inertiajs/vue3', () => ({
    useHttp: () => ({ get: httpGetMock }),
}));

vi.mock('@/routes/companies', () => ({
    index: {
        url: (options?: unknown) => `/api/companies?${JSON.stringify(options)}`,
    },
    stats: { url: () => '/api/companies/stats' },
}));

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

describe('useCompanies', () => {
    it('populates companies and meta from fetchCompanies', async () => {
        const response: Paginated<Company> = {
            data: [makeCompany()],
            links: { first: null, last: null, prev: null, next: null },
            meta: {
                current_page: 1,
                from: 1,
                last_page: 1,
                per_page: 15,
                to: 1,
                total: 1,
            },
        };
        httpGetMock.mockResolvedValueOnce(response);

        const { companies, meta, fetchCompanies } = useCompanies();

        await fetchCompanies(1, 15);

        expect(companies.value).toEqual(response.data);
        expect(meta.value).toEqual(response.meta);
    });

    it('toggles loading state while fetching companies', async () => {
        let resolveFetch: (value: Paginated<Company>) => void = () => {};
        httpGetMock.mockReturnValueOnce(
            new Promise((resolve) => {
                resolveFetch = resolve;
            }),
        );

        const { loading, fetchCompanies } = useCompanies();

        const promise = fetchCompanies();
        expect(loading.value).toBe(true);

        resolveFetch({
            data: [],
            links: { first: null, last: null, prev: null, next: null },
            meta: {
                current_page: 1,
                from: null,
                last_page: 1,
                per_page: 15,
                to: null,
                total: 0,
            },
        });
        await promise;

        expect(loading.value).toBe(false);
    });

    it('populates companyStats from fetchStats', async () => {
        const stats: CompanyStats = {
            total: 3,
            added_this_month: 1,
            oldest: { name: 'Acme Inc', starting_date: '2010-01-01' },
        };
        httpGetMock.mockResolvedValueOnce(stats);

        const { companyStats, fetchStats } = useCompanies();

        await fetchStats();

        expect(companyStats.value).toEqual(stats);
    });
});
