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

    public function test_authenticated_session_user_can_access_companies_without_sanctum_token(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->getJson(route('companies.index'))
            ->assertOk();
    }

    public function test_index_respects_per_page_query_parameter(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        Company::factory()->count(5)->forUser($user)->create();

        $this->getJson(route('companies.index', ['per_page' => 2]))
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('meta.per_page', 2);
    }

    public function test_index_clamps_per_page_to_maximum(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        Company::factory()->count(3)->forUser($user)->create();

        $this->getJson(route('companies.index', ['per_page' => 1000]))
            ->assertOk()
            ->assertJsonPath('meta.per_page', 100);
    }

    public function test_index_clamps_per_page_to_minimum(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        Company::factory()->count(3)->forUser($user)->create();

        $this->getJson(route('companies.index', ['per_page' => 0]))
            ->assertOk()
            ->assertJsonPath('meta.per_page', 1);
    }

    public function test_guest_cannot_access_stats(): void
    {
        $this->getJson(route('companies.stats'))->assertUnauthorized();
    }

    public function test_stats_returns_totals_for_only_the_authenticated_users_companies(): void
    {
        $user = User::factory()->create();
        Company::factory()->count(2)->forUser($user)->create();
        Company::factory()->count(3)->create();

        Sanctum::actingAs($user);

        $this->getJson(route('companies.stats'))
            ->assertOk()
            ->assertJsonPath('total', 2);
    }

    public function test_stats_reports_companies_added_this_month(): void
    {
        $user = User::factory()->create();
        Company::factory()->forUser($user)->create(['created_at' => now()]);
        Company::factory()->forUser($user)->create(['created_at' => now()->subMonths(2)]);

        Sanctum::actingAs($user);

        $this->getJson(route('companies.stats'))
            ->assertOk()
            ->assertJsonPath('added_this_month', 1);
    }

    public function test_stats_reports_oldest_company_by_starting_date(): void
    {
        $user = User::factory()->create();
        Company::factory()->forUser($user)->create(['name' => 'Newer Co', 'starting_date' => '2022-01-01']);
        $oldest = Company::factory()->forUser($user)->create(['name' => 'Oldest Co', 'starting_date' => '2010-01-01']);

        Sanctum::actingAs($user);

        $this->getJson(route('companies.stats'))
            ->assertOk()
            ->assertJsonPath('oldest.name', $oldest->name)
            ->assertJsonPath('oldest.starting_date', '2010-01-01');
    }

    public function test_stats_returns_null_oldest_when_user_has_no_companies(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $this->getJson(route('companies.stats'))
            ->assertOk()
            ->assertJsonPath('total', 0)
            ->assertJsonPath('oldest', null);
    }

    public function test_index_sorts_by_name_ascending_and_descending(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        Company::factory()->forUser($user)->create(['name' => 'Charlie Co']);
        Company::factory()->forUser($user)->create(['name' => 'Alpha Co']);
        Company::factory()->forUser($user)->create(['name' => 'Bravo Co']);

        $this->getJson(route('companies.index', ['sort' => 'name', 'direction' => 'asc']))
            ->assertOk()
            ->assertJsonPath('data.0.name', 'Alpha Co')
            ->assertJsonPath('data.2.name', 'Charlie Co');

        $this->getJson(route('companies.index', ['sort' => 'name', 'direction' => 'desc']))
            ->assertOk()
            ->assertJsonPath('data.0.name', 'Charlie Co')
            ->assertJsonPath('data.2.name', 'Alpha Co');
    }

    public function test_index_sorts_by_id_ascending_and_descending(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $first = Company::factory()->forUser($user)->create();
        $second = Company::factory()->forUser($user)->create();

        $this->getJson(route('companies.index', ['sort' => 'id', 'direction' => 'asc']))
            ->assertOk()
            ->assertJsonPath('data.0.id', $first->id)
            ->assertJsonPath('data.1.id', $second->id);

        $this->getJson(route('companies.index', ['sort' => 'id', 'direction' => 'desc']))
            ->assertOk()
            ->assertJsonPath('data.0.id', $second->id)
            ->assertJsonPath('data.1.id', $first->id);
    }

    public function test_index_sorts_by_address_ascending_and_descending(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        Company::factory()->forUser($user)->create(['address' => '2 Beta St']);
        Company::factory()->forUser($user)->create(['address' => '1 Alpha St']);

        $this->getJson(route('companies.index', ['sort' => 'address', 'direction' => 'asc']))
            ->assertOk()
            ->assertJsonPath('data.0.address', '1 Alpha St');

        $this->getJson(route('companies.index', ['sort' => 'address', 'direction' => 'desc']))
            ->assertOk()
            ->assertJsonPath('data.0.address', '2 Beta St');
    }

    public function test_index_sorts_by_email_ascending_and_descending(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        Company::factory()->forUser($user)->create(['email' => 'zeta@acme.test']);
        Company::factory()->forUser($user)->create(['email' => 'alpha@acme.test']);

        $this->getJson(route('companies.index', ['sort' => 'email', 'direction' => 'asc']))
            ->assertOk()
            ->assertJsonPath('data.0.email', 'alpha@acme.test');

        $this->getJson(route('companies.index', ['sort' => 'email', 'direction' => 'desc']))
            ->assertOk()
            ->assertJsonPath('data.0.email', 'zeta@acme.test');
    }

    public function test_index_sorts_by_starting_date_ascending_and_descending(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        Company::factory()->forUser($user)->create(['starting_date' => '2020-01-01']);
        Company::factory()->forUser($user)->create(['starting_date' => '2010-01-01']);

        $this->getJson(route('companies.index', ['sort' => 'starting_date', 'direction' => 'asc']))
            ->assertOk()
            ->assertJsonPath('data.0.starting_date', '2010-01-01');

        $this->getJson(route('companies.index', ['sort' => 'starting_date', 'direction' => 'desc']))
            ->assertOk()
            ->assertJsonPath('data.0.starting_date', '2020-01-01');
    }

    public function test_index_sorts_by_created_at_ascending_and_descending(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $older = Company::factory()->forUser($user)->create(['created_at' => now()->subDays(2)]);
        $newer = Company::factory()->forUser($user)->create(['created_at' => now()]);

        $this->getJson(route('companies.index', ['sort' => 'created_at', 'direction' => 'asc']))
            ->assertOk()
            ->assertJsonPath('data.0.id', $older->id);

        $this->getJson(route('companies.index', ['sort' => 'created_at', 'direction' => 'desc']))
            ->assertOk()
            ->assertJsonPath('data.0.id', $newer->id);
    }

    public function test_index_rejects_invalid_sort_column(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $this->getJson(route('companies.index', ['sort' => 'user_id']))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['sort']);
    }

    public function test_index_rejects_invalid_direction(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $this->getJson(route('companies.index', ['direction' => 'sideways']))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['direction']);
    }

    public function test_index_searches_name_address_and_email(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $matchesName = Company::factory()->forUser($user)->create(['name' => 'Acme Rockets']);
        $matchesAddress = Company::factory()->forUser($user)->create(['address' => '1 Acme Lane']);
        $matchesEmail = Company::factory()->forUser($user)->create(['email' => 'hello@acme.test']);
        Company::factory()->forUser($user)->create(['name' => 'Globex', 'address' => '2 Other Rd', 'email' => 'hi@globex.test']);

        $response = $this->getJson(route('companies.index', ['search' => 'acme']))
            ->assertOk()
            ->assertJsonCount(3, 'data');

        $ids = collect($response->json('data'))->pluck('id')->all();

        $this->assertContains($matchesName->id, $ids);
        $this->assertContains($matchesAddress->id, $ids);
        $this->assertContains($matchesEmail->id, $ids);
    }

    public function test_index_filters_by_created_at_range_inclusive(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $inRange = Company::factory()->forUser($user)->create(['created_at' => '2024-06-15 10:00:00']);
        Company::factory()->forUser($user)->create(['created_at' => '2024-06-01 10:00:00']);
        Company::factory()->forUser($user)->create(['created_at' => '2024-06-30 10:00:00']);

        $response = $this->getJson(route('companies.index', [
            'created_from' => '2024-06-10',
            'created_to' => '2024-06-20',
        ]))->assertOk()->assertJsonCount(1, 'data');

        $this->assertSame($inRange->id, $response->json('data.0.id'));
    }

    public function test_index_filters_by_starting_date_range_inclusive(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $inRange = Company::factory()->forUser($user)->create(['starting_date' => '2020-06-15']);
        Company::factory()->forUser($user)->create(['starting_date' => '2019-01-01']);
        Company::factory()->forUser($user)->create(['starting_date' => '2021-01-01']);

        $response = $this->getJson(route('companies.index', [
            'starting_from' => '2020-06-15',
            'starting_to' => '2020-06-15',
        ]))->assertOk()->assertJsonCount(1, 'data');

        $this->assertSame($inRange->id, $response->json('data.0.id'));
    }

    public function test_index_rejects_inverted_date_range(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $this->getJson(route('companies.index', [
            'created_from' => '2024-06-20',
            'created_to' => '2024-06-10',
        ]))->assertUnprocessable()->assertJsonValidationErrors(['created_to']);
    }

    public function test_user_can_bulk_delete_their_own_companies(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $keep = Company::factory()->forUser($user)->create();
        $delete1 = Company::factory()->forUser($user)->create();
        $delete2 = Company::factory()->forUser($user)->create();

        $this->deleteJson(route('companies.destroyMany'), ['ids' => [$delete1->id, $delete2->id]])
            ->assertNoContent();

        $this->assertModelMissing($delete1);
        $this->assertModelMissing($delete2);
        $this->assertNotNull($keep->fresh());
    }

    public function test_bulk_delete_ignores_ids_belonging_to_other_users(): void
    {
        $user = User::factory()->create();
        $own = Company::factory()->forUser($user)->create();
        $other = Company::factory()->create();

        Sanctum::actingAs($user);

        $this->deleteJson(route('companies.destroyMany'), ['ids' => [$own->id, $other->id]])
            ->assertNoContent();

        $this->assertModelMissing($own);
        $this->assertNotNull($other->fresh());
    }

    public function test_bulk_delete_ignores_nonexistent_ids(): void
    {
        $user = User::factory()->create();
        $own = Company::factory()->forUser($user)->create();

        Sanctum::actingAs($user);

        $this->deleteJson(route('companies.destroyMany'), ['ids' => [$own->id, 999999]])
            ->assertNoContent();

        $this->assertModelMissing($own);
    }

    public function test_bulk_delete_requires_ids_array(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $this->deleteJson(route('companies.destroyMany'), [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['ids']);
    }

    public function test_bulk_delete_requires_integer_ids(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $this->deleteJson(route('companies.destroyMany'), ['ids' => ['abc']])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['ids.0']);
    }

    public function test_guest_cannot_bulk_delete(): void
    {
        $this->deleteJson(route('companies.destroyMany'), ['ids' => [1]])
            ->assertUnauthorized();
    }
}
