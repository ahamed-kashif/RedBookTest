<?php

namespace Database\Seeders;

use App\Models\Company;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class CompanySeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $user = User::firstWhere('email', 'sahkashif@gmail.com');

        if (! $user) {
            return;
        }

        Company::factory()->count(100)->forUser($user)->create();
    }
}
