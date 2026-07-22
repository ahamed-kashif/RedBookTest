<?php

namespace App\Repositories;

use App\Contracts\Repositories\CompanyRepositoryInterface;
use App\Models\Company;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class CompanyRepository extends BaseRepository implements CompanyRepositoryInterface
{
    /**
     * @var array<int, string>
     */
    private const SORTABLE_COLUMNS = ['id', 'name', 'address', 'email', 'starting_date', 'created_at'];

    public function __construct(Company $model)
    {
        parent::__construct($model);
    }

    /**
     * Date range filters use whereDate() so bounds are inclusive on both ends,
     * for both the created_at datetime column and the starting_date date-cast column.
     *
     * @return LengthAwarePaginator<int, Company>
     */
    public function paginateForUser(
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
        $query = $user->companies();

        if ($search) {
            $query->where(function ($query) use ($search) {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('address', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($createdFrom) {
            $query->whereDate('created_at', '>=', $createdFrom);
        }

        if ($createdTo) {
            $query->whereDate('created_at', '<=', $createdTo);
        }

        if ($startingFrom) {
            $query->whereDate('starting_date', '>=', $startingFrom);
        }

        if ($startingTo) {
            $query->whereDate('starting_date', '<=', $startingTo);
        }

        $sortColumn = in_array($sort, self::SORTABLE_COLUMNS, true) ? $sort : 'created_at';
        $sortDirection = $direction === 'desc' ? 'desc' : 'asc';

        return $query->orderBy($sortColumn, $sortDirection)
            ->when($sortColumn !== 'id', fn ($query) => $query->orderBy('id', $sortDirection))
            ->paginate($perPage);
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

    /**
     * @param  array<int, int>  $ids
     */
    public function deleteManyForUser(User $user, array $ids): int
    {
        return $user->companies()->whereIn('id', $ids)->delete();
    }
}
