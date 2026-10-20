<?php

use App\Models\User;
use Illuminate\Support\Facades\Artisan;

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
