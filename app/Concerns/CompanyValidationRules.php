<?php

namespace App\Concerns;

use App\Models\Company;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Validation\Rule;

trait CompanyValidationRules
{
    /**
     * Get the validation rules used to validate companies.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    protected function companyRules(int $userId, ?int $companyId = null): array
    {
        return [
            'name' => $this->nameRules(),
            'address' => $this->addressRules(),
            'email' => $this->emailRules($userId, $companyId),
            'starting_date' => $this->startingDateRules(),
        ];
    }

    /**
     * Get the validation rules used to validate company names.
     *
     * @return array<int, ValidationRule|array<mixed>|string>
     */
    protected function nameRules(): array
    {
        return ['required', 'string', 'max:255'];
    }

    /**
     * Get the validation rules used to validate company addresses.
     *
     * @return array<int, ValidationRule|array<mixed>|string>
     */
    protected function addressRules(): array
    {
        return ['required', 'string', 'max:255'];
    }

    /**
     * Get the validation rules used to validate company emails.
     *
     * @return array<int, ValidationRule|array<mixed>|string>
     */
    protected function emailRules(int $userId, ?int $companyId = null): array
    {
        $unique = Rule::unique(Company::class)->where(
            fn ($query) => $query->where('user_id', $userId),
        );

        return [
            'required',
            'string',
            'email',
            'max:255',
            $companyId === null ? $unique : $unique->ignore($companyId),
        ];
    }

    /**
     * Get the validation rules used to validate company starting dates.
     *
     * @return array<int, ValidationRule|array<mixed>|string>
     */
    protected function startingDateRules(): array
    {
        return ['required', 'date'];
    }
}
