<?php

namespace App\Providers;

use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        ResetPassword::createUrlUsing(function ($user, string $token) {

            return config('app.frontend_url')
                . '/reset-password'
                . '?token=' . $token
                . '&email=' . urlencode($user->email);

        });

        /*
        |--------------------------------------------------------------------------
        | Public authentication rate limit
        |--------------------------------------------------------------------------
        |
        | 6 attempts per minute for each email + IP pair, so users sharing
        | an IP (office, campus) do not block each other, plus 30 per minute
        | per IP to stop one client from trying many different emails.
        |
        */

        RateLimiter::for('auth', function (Request $request) {

            $email = Str::lower((string) $request->input('email'));

            return [
                Limit::perMinute(6)->by('email:' . $email . '|' . $request->ip()),
                Limit::perMinute(30)->by('ip:' . $request->ip()),
            ];

        });
    }
}