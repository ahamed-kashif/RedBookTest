import { useHttp } from '@inertiajs/vue3';
import { ref } from 'vue';
import type { Ref } from 'vue';
import { index, stats } from '@/routes/companies';
import type {
    Company,
    CompanyListParams,
    CompanyStats,
    Paginated,
    PaginationMeta,
} from '@/types';

export type UseCompaniesReturn = {
    companies: Ref<Company[]>;
    meta: Ref<PaginationMeta | null>;
    companyStats: Ref<CompanyStats | null>;
    loading: Ref<boolean>;
    fetchCompanies: (params?: CompanyListParams) => Promise<void>;
    fetchStats: () => Promise<void>;
};

export function useCompanies(): UseCompaniesReturn {
    const http = useHttp();

    const companies = ref<Company[]>([]);
    const meta = ref<PaginationMeta | null>(null);
    const companyStats = ref<CompanyStats | null>(null);
    const loading = ref(false);

    const fetchCompanies = async (
        params: CompanyListParams = {},
    ): Promise<void> => {
        loading.value = true;

        const query: Record<string, string | number> = {
            page: params.page ?? 1,
            per_page: params.perPage ?? 15,
        };

        if (params.sort) {
            query.sort = params.sort;
        }

        if (params.direction) {
            query.direction = params.direction;
        }

        if (params.search) {
            query.search = params.search;
        }

        if (params.createdFrom) {
            query.created_from = params.createdFrom;
        }

        if (params.createdTo) {
            query.created_to = params.createdTo;
        }

        if (params.startingFrom) {
            query.starting_from = params.startingFrom;
        }

        if (params.startingTo) {
            query.starting_to = params.startingTo;
        }

        try {
            const response = (await http.get(
                index.url({ query }),
            )) as Paginated<Company>;

            companies.value = response.data;
            meta.value = response.meta;
        } finally {
            loading.value = false;
        }
    };

    const fetchStats = async (): Promise<void> => {
        companyStats.value = (await http.get(stats.url())) as CompanyStats;
    };

    return {
        companies,
        meta,
        companyStats,
        loading,
        fetchCompanies,
        fetchStats,
    };
}
