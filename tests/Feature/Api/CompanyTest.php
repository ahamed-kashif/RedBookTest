<?php

namespace Tests\Feature\Api;

use App\Models\Company;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CompanyTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_cannot_access_companies(): void
    {
        $company = Company::factory()->create();

        $this->getJson(route('companies.index'))->assertUnauthorized();
        $this->getJson(route('companies.show', $company))->assertUnauthorized();
    }

    public function test_user_can_list_only_their_own_companies(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        Company::factory()->count(2)->forUser($user)->create();
        Company::factory()->count(3)->create();

        $this->getJson(route('companies.index'))
            ->assertOk()
            ->assertJsonCount(2, 'data');
    }

    public function test_user_can_create_a_company(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $payload = [
            'name' => 'Acme Inc',
            'address' => '123 Main St',
            'email' => 'info@acme.test',
            'starting_date' => '2020-01-01',
        ];

        $this->postJson(route('companies.store'), $payload)
            ->assertCreated()
            ->assertJsonPath('data.name', 'Acme Inc')
            ->assertJsonPath('data.email', 'info@acme.test')
            ->assertJsonPath('data.starting_date', '2020-01-01');

        $this->assertDatabaseHas('companies', [
            'user_id' => $user->id,
            'name' => 'Acme Inc',
            'email' => 'info@acme.test',
        ]);
    }

    public function test_creating_company_requires_valid_data(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $this->postJson(route('companies.store'), [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['name', 'address', 'email', 'starting_date']);
    }

    public function test_company_email_must_be_unique_per_user(): void
    {
        $user = User::factory()->create();
        $existing = Company::factory()->forUser($user)->create(['email' => 'dup@acme.test']);

        Sanctum::actingAs($user);

        $this->postJson(route('companies.store'), [
            'name' => 'Another Co',
            'address' => '456 Side St',
            'email' => 'dup@acme.test',
            'starting_date' => '2021-01-01',
        ])->assertUnprocessable()->assertJsonValidationErrors(['email']);

        $otherUser = User::factory()->create();
        Sanctum::actingAs($otherUser);

        $this->postJson(route('companies.store'), [
            'name' => 'Another Co',
            'address' => '456 Side St',
            'email' => 'dup@acme.test',
            'starting_date' => '2021-01-01',
        ])->assertCreated();

        $this->assertNotNull($existing->fresh());
    }

    public function test_user_can_view_their_own_company(): void
    {
        $user = User::factory()->create();
        $company = Company::factory()->forUser($user)->create();
        Sanctum::actingAs($user);

        $this->getJson(route('companies.show', $company))
            ->assertOk()
            ->assertJsonPath('data.id', $company->id);
    }

    public function test_user_cannot_view_another_users_company(): void
    {
        $company = Company::factory()->create();
        Sanctum::actingAs(User::factory()->create());

        $this->getJson(route('companies.show', $company))->assertNotFound();
    }

    public function test_user_can_update_their_own_company(): void
    {
        $user = User::factory()->create();
        $company = Company::factory()->forUser($user)->create();
        Sanctum::actingAs($user);

        $this->putJson(route('companies.update', $company), [
            'name' => 'Updated Name',
            'address' => $company->address,
            'email' => $company->email,
            'starting_date' => $company->starting_date->toDateString(),
        ])->assertOk()->assertJsonPath('data.name', 'Updated Name');

        $this->assertDatabaseHas('companies', ['id' => $company->id, 'name' => 'Updated Name']);
    }

    public function test_updating_company_requires_valid_data(): void
    {
        $user = User::factory()->create();
        $company = Company::factory()->forUser($user)->create();
        Sanctum::actingAs($user);

        $this->putJson(route('companies.update', $company), ['name' => ''])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['name', 'address', 'email', 'starting_date']);
    }

    public function test_user_cannot_update_another_users_company(): void
    {
        $company = Company::factory()->create(['name' => 'Original']);
        Sanctum::actingAs(User::factory()->create());

        $this->putJson(route('companies.update', $company), [
            'name' => 'Hacked',
            'address' => $company->address,
            'email' => $company->email,
            'starting_date' => $company->starting_date->toDateString(),
        ])->assertNotFound();

        $this->assertDatabaseHas('companies', ['id' => $company->id, 'name' => 'Original']);
    }

    public function test_user_can_delete_their_own_company(): void
    {
        $user = User::factory()->create();
        $company = Company::factory()->forUser($user)->create();
        Sanctum::actingAs($user);

        $this->deleteJson(route('companies.destroy', $company))->assertNoContent();

        $this->assertModelMissing($company);
    }

    public function test_user_cannot_delete_another_users_company(): void
    {
        $company = Company::factory()->create();
        Sanctum::actingAs(User::factory()->create());

        $this->deleteJson(route('companies.destroy', $company))->assertNotFound();

        $this->assertDatabaseHas('companies', ['id' => $company->id]);
    }

    public function test_authenticated_request_with_real_sanctum_token_succeeds(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $this->getJson(route('companies.index'), [
            'Authorization' => "Bearer {$token}",
        ])->assertOk();
    }
}
