<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
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

    public function index(Request $request): AnonymousResourceCollection
    {
        return CompanyResource::collection(
            $this->companies->listForUser($request->user()),
        );
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
}
