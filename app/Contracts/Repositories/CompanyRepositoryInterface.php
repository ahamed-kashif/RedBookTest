<?php

namespace App\Contracts\Repositories;

use App\Models\Company;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface CompanyRepositoryInterface extends RepositoryInterface
{
    /**
     * @return LengthAwarePaginator<int, Company>
     */
    public function paginateForUser(User $user, int $perPage = 15): LengthAwarePaginator;

    public function findForUserOrFail(User $user, int $id): Company;

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function createForUser(User $user, array $attributes): Company;

    /**
     * @return array{total: int, added_this_month: int, oldest: Company|null}
     */
    public function statsForUser(User $user): array;
}
