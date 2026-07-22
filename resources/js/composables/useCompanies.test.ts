import { describe, expect, it, vi } from 'vitest';
import { useCompanies } from '@/composables/useCompanies';
import type { Company, CompanyStats, Paginated } from '@/types';

const httpGetMock = vi.fn();
const indexUrlMock = vi.fn(
    (options?: unknown) => `/api/companies?${JSON.stringify(options)}`,
);

vi.mock('@inertiajs/vue3', () => ({
    useHttp: () => ({ get: httpGetMock }),
}));

vi.mock('@/routes/companies', () => ({
    index: { url: (options?: unknown) => indexUrlMock(options) },
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

function makePaginated(data: Company[]): Paginated<Company> {
    return {
        data,
        links: { first: null, last: null, prev: null, next: null },
        meta: {
            current_page: 1,
            from: data.length > 0 ? 1 : null,
            last_page: 1,
            per_page: 15,
            to: data.length > 0 ? data.length : null,
            total: data.length,
            links: [],
        },
    };
}

describe('useCompanies', () => {
    it('populates companies and meta from fetchCompanies', async () => {
        const response = makePaginated([makeCompany()]);
        httpGetMock.mockResolvedValueOnce(response);

        const { companies, meta, fetchCompanies } = useCompanies();

        await fetchCompanies({ page: 1, perPage: 15 });

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

        resolveFetch(makePaginated([]));
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

    it('only includes non-empty filter keys in the query', async () => {
        httpGetMock.mockResolvedValueOnce(makePaginated([]));

        const { fetchCompanies } = useCompanies();

        await fetchCompanies({
            page: 2,
            perPage: 25,
            search: 'acme',
            sort: 'name',
            direction: 'desc',
        });

        const query = indexUrlMock.mock.calls.at(-1)?.[0] as {
            query: Record<string, unknown>;
        };

        expect(query.query).toEqual({
            page: 2,
            per_page: 25,
            sort: 'name',
            direction: 'desc',
            search: 'acme',
        });
    });

    it('omits date filters entirely when they are not provided', async () => {
        httpGetMock.mockResolvedValueOnce(makePaginated([]));

        const { fetchCompanies } = useCompanies();

        await fetchCompanies();

        const query = indexUrlMock.mock.calls.at(-1)?.[0] as {
            query: Record<string, unknown>;
        };

        expect(query.query).not.toHaveProperty('created_from');
        expect(query.query).not.toHaveProperty('created_to');
        expect(query.query).not.toHaveProperty('starting_from');
        expect(query.query).not.toHaveProperty('starting_to');
    });
});
