<?php

namespace App\Services;

use App\Contracts\Repositories\CompanyRepositoryInterface;
use App\Models\Company;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class CompanyService
{
    public function __construct(private readonly CompanyRepositoryInterface $companies) {}

    /**
     * @return LengthAwarePaginator<int, Company>
     */
    public function listForUser(
        User $user,
        int $perPage = 15,
        ?string $sort = null,
        string $direction = 'asc',
        ?string $search = null,
        ?string $createdFrom = null,
        ?string $createdTo = null,
        ?string $startingFrom = null,
        ?string $startingTo = null,
    ): LengthAwarePaginator {
        return $this->companies->paginateForUser(
            $user,
            $perPage,
            $sort,
            $direction,
            $search,
            $createdFrom,
            $createdTo,
            $startingFrom,
            $startingTo,
        );
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function create(User $user, array $attributes): Company
    {
        return $this->companies->createForUser($user, $attributes);
    }

    public function find(User $user, int $id): Company
    {
        return $this->companies->findForUserOrFail($user, $id);
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function update(User $user, int $id, array $attributes): Company
    {
        $company = $this->companies->findForUserOrFail($user, $id);

        /** @var Company $company */
        $company = $this->companies->update($company, $attributes);

        return $company;
    }

    public function delete(User $user, int $id): bool
    {
        return $this->companies->delete(
            $this->companies->findForUserOrFail($user, $id),
        );
    }

    /**
     * @return array{total: int, added_this_month: int, oldest: Company|null}
     */
    public function stats(User $user): array
    {
        return $this->companies->statsForUser($user);
    }

    /**
     * @param  array<int, int>  $ids
     */
    public function deleteMany(User $user, array $ids): int
    {
        return $this->companies->deleteManyForUser($user, $ids);
    }
}
