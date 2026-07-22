<?php

namespace App\Repositories;

use App\Contracts\Repositories\CompanyRepositoryInterface;
use App\Models\Company;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class CompanyRepository extends BaseRepository implements CompanyRepositoryInterface
{
    public function __construct(Company $model)
    {
        parent::__construct($model);
    }

    /**
     * @return LengthAwarePaginator<int, Company>
     */
    public function paginateForUser(User $user, int $perPage = 15): LengthAwarePaginator
    {
        return $user->companies()->latest()->paginate($perPage);
    }

    public function findForUserOrFail(User $user, int $id): Company
    {
        /** @var Company $company */
        $company = $user->companies()->findOrFail($id);

        return $company;
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function createForUser(User $user, array $attributes): Company
    {
        /** @var Company $company */
        $company = $user->companies()->create($attributes);

        return $company;
    }

    /**
     * @return array{total: int, added_this_month: int, oldest: Company|null}
     */
    public function statsForUser(User $user): array
    {
        return [
            'total' => $user->companies()->count(),
            'added_this_month' => $user->companies()
                ->whereYear('created_at', now()->year)
                ->whereMonth('created_at', now()->month)
                ->count(),
            'oldest' => $user->companies()->orderBy('starting_date')->first(),
        ];
    }
}
