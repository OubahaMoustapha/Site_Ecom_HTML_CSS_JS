<?php

namespace App\Services;

use App\Models\User;

use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Throwable;




class AuthService
{
    /**
     * Register a new user and generate an API token.
     */
    public function register(array $data): array
    {
        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => $data['password'],           
        ]);

        // A mail outage must not fail the sign-up: the link can be re-sent later.
        try {
            $user->sendEmailVerificationNotification();
        } catch (Throwable $exception) {
            report($exception);
        }

        $token = $user
            ->createToken($data['device_name'])
            ->plainTextToken;

        return [
            'user' => $user,
            'token' => $token,
        ];
    }


    /**
     * Authenticate a user and generate an API token.
     */
    public function login(array $data): array
    {
        $user = User::where('email', $data['email'])->first();

        if (!$user || !Hash::check($data['password'], $user->password)) {

            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        $token = $user
            ->createToken($data['device_name'])
            ->plainTextToken;

        return [
            'user' => $user,
            'token' => $token,
        ];
    }


    /**
     * Logout the authenticated user.
     */
    public function logout(User $user): void
    {
        /** @var \Laravel\Sanctum\PersonalAccessToken|null $token */
        $token = $user->currentAccessToken();

        if ($token) {
            $token->delete();
        }
    }
    
    /**
     * Get authenticated user profile.
     */
    public function profile(User $user): User
    {
        return $user;
    }

    /**
     * Update authenticated user profile.
     */
    public function updateProfile(User $user, array $data): User
    {
        $emailChanged = $user->email !== $data['email'];

        $user->update([
            'name' => $data['name'],
            'email' => $data['email'],
        ]);

        // A new email address must be verified again.
        if ($emailChanged) {

            $user->forceFill([
                'email_verified_at' => null,
            ])->save();

            $user->sendEmailVerificationNotification();

        }

        return $user->fresh();
    }

    /**
     * Change authenticated user password.
     */
    public function changePassword(User $user, array $data): void
    {
        if (!Hash::check($data['current_password'], $user->password)) {

            throw ValidationException::withMessages([
                'current_password' => [
                    'The current password is incorrect.',
                ],
            ]);
        }

        $user->update([
            'password' => $data['password'],
        ]);
    }

    /**
     * Send password reset link.
     */
    public function forgotPassword(string $email): void
    {
        // The reply is identical whether or not the email is registered (or was
        // just sent a link), so this endpoint cannot be used to discover accounts.
        Password::sendResetLink([
            'email' => $email,
        ]);
    }


    /**
     * Reset user password.
     */
    public function resetPassword(array $data): void
    {
        $status = Password::reset(           
            [
                'email' => $data['email'],
                'password' => $data['password'],
                'token' => $data['token'],
            ],
            

            function (User $user, string $password) {

                $user->forceFill([
                    'password' => $password,
                    'remember_token' => Str::random(60),
                ])->save();

                event(new PasswordReset($user));
            }

        );

        if ($status !== Password::PASSWORD_RESET) {

            throw ValidationException::withMessages([
                'email' => [__($status)],
            ]);

        }
    }

    /**
     * Verify user email.
     */
    public function verifyEmail(Request $request): void
    {
        $user = User::findOrFail($request->route('id'));

        if (! hash_equals(
            sha1($user->getEmailForVerification()),
            (string) $request->route('hash')
        )) {
            throw ValidationException::withMessages([
                'email' => ['Invalid verification link.'],
            ]);
        }

        if (! $user->hasVerifiedEmail()) {
            $user->markEmailAsVerified();
        }
    }

    /**
     * Resend email verification notification.
     */
    public function resendVerification(User $user): void
    {
        if ($user->hasVerifiedEmail()) {

            throw ValidationException::withMessages([
                'email' => [
                    'Email is already verified.',
                ],
            ]);

        }

        $user->sendEmailVerificationNotification();
    }
}