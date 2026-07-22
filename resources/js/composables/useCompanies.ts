import { useHttp } from '@inertiajs/vue3';
import { ref } from 'vue';
import type { Ref } from 'vue';
import { index, stats } from '@/routes/companies';
import type { Company, CompanyStats, Paginated, PaginationMeta } from '@/types';

export type UseCompaniesReturn = {
    companies: Ref<Company[]>;
    meta: Ref<PaginationMeta | null>;
    companyStats: Ref<CompanyStats | null>;
    loading: Ref<boolean>;
    fetchCompanies: (page?: number, perPage?: number) => Promise<void>;
    fetchStats: () => Promise<void>;
};

export function useCompanies(): UseCompaniesReturn {
    const http = useHttp();

    const companies = ref<Company[]>([]);
    const meta = ref<PaginationMeta | null>(null);
    const companyStats = ref<CompanyStats | null>(null);
    const loading = ref(false);

    const fetchCompanies = async (page = 1, perPage = 15): Promise<void> => {
        loading.value = true;

        try {
            const response = (await http.get(
                index.url({ query: { page, per_page: perPage } }),
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
