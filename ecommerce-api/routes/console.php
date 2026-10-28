<?php

use App\Models\User;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

/*
|--------------------------------------------------------------------------
| Promote an existing user to administrator
|--------------------------------------------------------------------------
|
| Usage: php artisan user:make-admin someone@example.com
|
*/

Artisan::command('user:make-admin {email}', function (string $email) {

    $user = User::where('email', $email)->first();

    if (! $user) {
        $this->error("No user found with email {$email}.");

        return 1;
    }

    // role is not mass assignable, so it is set explicitly.
    $user->forceFill(['role' => User::ROLE_ADMIN])->save();

    $this->info("{$user->email} is now an administrator.");

    return 0;

})->purpose('Grant the administrator role to a user');

/*
|--------------------------------------------------------------------------
| Housekeeping
|--------------------------------------------------------------------------
|
| Expired API tokens are deleted daily (run `php artisan schedule:work`
| locally or a cron entry for `schedule:run` in production).
|
*/

Schedule::command('sanctum:prune-expired --hours=24')->daily();
