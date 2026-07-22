<script setup lang="ts">
import { Head } from '@inertiajs/vue3';
import { Plus } from '@lucide/vue';
import { onMounted, ref } from 'vue';
import CompaniesTable from '@/components/companies/CompaniesTable.vue';
import CompanyFormModal from '@/components/companies/CompanyFormModal.vue';
import DeleteCompanyDialog from '@/components/companies/DeleteCompanyDialog.vue';
import StatCard from '@/components/companies/StatCard.vue';
import TablePagination from '@/components/companies/TablePagination.vue';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardAction,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { useCompanies } from '@/composables/useCompanies';
import { dashboard } from '@/routes';
import type { Company } from '@/types';

defineOptions({
    layout: {
        breadcrumbs: [{ title: 'Dashboard', href: dashboard() }],
    },
});

const { companies, meta, companyStats, loading, fetchCompanies, fetchStats } =
    useCompanies();

const page = ref(1);
const perPage = ref(15);

const formModalOpen = ref(false);
const formModalMode = ref<'create' | 'edit' | 'view'>('create');
const activeCompany = ref<Company | null>(null);

const deleteDialogOpen = ref(false);
const companyPendingDelete = ref<Company | null>(null);

function loadCompanies() {
    fetchCompanies(page.value, perPage.value);
}

onMounted(() => {
    fetchStats();
    loadCompanies();
});

function handlePageChange(newPage: number) {
    page.value = newPage;
    loadCompanies();
}

function handlePerPageChange(newPerPage: number) {
    perPage.value = newPerPage;
    page.value = 1;
    loadCompanies();
}

function openCreateModal() {
    activeCompany.value = null;
    formModalMode.value = 'create';
    formModalOpen.value = true;
}

function openViewModal(company: Company) {
    activeCompany.value = company;
    formModalMode.value = 'view';
    formModalOpen.value = true;
}

function openEditModal(company: Company) {
    activeCompany.value = company;
    formModalMode.value = 'edit';
    formModalOpen.value = true;
}

function openDeleteDialog(company: Company) {
    companyPendingDelete.value = company;
    deleteDialogOpen.value = true;
}

function handleSaved() {
    loadCompanies();
    fetchStats();
}

function handleDeleted() {
    loadCompanies();
    fetchStats();
}
</script>

<template>
    <Head title="Dashboard" />

    <div
        class="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4"
    >
        <div class="grid auto-rows-min gap-4 md:grid-cols-3">
            <StatCard
                title="Total Companies"
                :value="companyStats?.total ?? '—'"
            />
            <StatCard
                title="Added This Month"
                :value="companyStats?.added_this_month ?? '—'"
            />
            <StatCard
                title="Oldest Company"
                :value="companyStats?.oldest?.name ?? '—'"
                :description="companyStats?.oldest?.starting_date"
            />
        </div>

        <Card class="flex-1">
            <CardHeader>
                <CardTitle>Companies</CardTitle>
                <CardAction>
                    <Button @click="openCreateModal">
                        <Plus class="size-4" />
                        Create Company
                    </Button>
                </CardAction>
            </CardHeader>
            <CardContent>
                <CompaniesTable
                    :companies="companies"
                    :loading="loading"
                    @view="openViewModal"
                    @edit="openEditModal"
                    @delete="openDeleteDialog"
                />
            </CardContent>
            <CardFooter>
                <TablePagination
                    :meta="meta"
                    :per-page="perPage"
                    @update:page="handlePageChange"
                    @update:per-page="handlePerPageChange"
                />
            </CardFooter>
        </Card>
    </div>

    <CompanyFormModal
        v-model:is-open="formModalOpen"
        :mode="formModalMode"
        :company="activeCompany"
        @saved="handleSaved"
    />

    <DeleteCompanyDialog
        v-model:is-open="deleteDialogOpen"
        :company="companyPendingDelete"
        @deleted="handleDeleted"
    />
</template>
