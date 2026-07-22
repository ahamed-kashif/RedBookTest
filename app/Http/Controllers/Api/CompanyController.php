<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\DestroyManyCompaniesRequest;
use App\Http\Requests\Api\IndexCompanyRequest;
use App\Http\Requests\Api\StoreCompanyRequest;
use App\Http\Requests\Api\UpdateCompanyRequest;
use App\Http\Resources\CompanyResource;
use App\Services\CompanyService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class CompanyController extends Controller
{
    public function __construct(private readonly CompanyService $companies) {}

    public function index(IndexCompanyRequest $request): AnonymousResourceCollection
    {
        $perPage = min(max((int) $request->integer('per_page', 15), 1), 100);

        return CompanyResource::collection($this->companies->listForUser(
            $request->user(),
            $perPage,
            $request->string('sort')->value() ?: null,
            $request->string('direction', 'asc')->value(),
            $request->string('search')->value() ?: null,
            $request->string('created_from')->value() ?: null,
            $request->string('created_to')->value() ?: null,
            $request->string('starting_from')->value() ?: null,
            $request->string('starting_to')->value() ?: null,
        ));
    }

    public function stats(Request $request): JsonResponse
    {
        $stats = $this->companies->stats($request->user());

        return response()->json([
            'total' => $stats['total'],
            'added_this_month' => $stats['added_this_month'],
            'oldest' => $stats['oldest'] ? [
                'name' => $stats['oldest']->name,
                'starting_date' => $stats['oldest']->starting_date->toDateString(),
            ] : null,
        ]);
    }

    public function store(StoreCompanyRequest $request): JsonResponse
    {
        $company = $this->companies->create($request->user(), $request->validated());

        return CompanyResource::make($company)
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    public function show(Request $request, int $company): CompanyResource
    {
        return CompanyResource::make($this->companies->find($request->user(), $company));
    }

    public function update(UpdateCompanyRequest $request, int $company): CompanyResource
    {
        return CompanyResource::make(
            $this->companies->update($request->user(), $company, $request->validated()),
        );
    }

    public function destroy(Request $request, int $company): Response
    {
        $this->companies->delete($request->user(), $company);

        return response()->noContent();
    }

    public function destroyMany(DestroyManyCompaniesRequest $request): Response
    {
        $this->companies->deleteMany($request->user(), $request->validated('ids'));

        return response()->noContent();
    }
}
