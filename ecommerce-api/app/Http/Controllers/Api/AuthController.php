<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Services\AuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use App\Http\Requests\UpdateProfileRequest;
use App\Http\Requests\ChangePasswordRequest;
use App\Http\Requests\ForgotPasswordRequest;
use App\Http\Requests\ResetPasswordRequest;



class AuthController extends Controller
{
    public function __construct(
        private readonly AuthService $authService
    ) {
    }

    /**
     * Register a new user.
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        $result = $this->authService->register(
            $request->validated()
        );

        return response()->json([
            'success' => true,
            'message' => 'User registered successfully.',
            'data' => [
                'user' => new UserResource($result['user']),
                'token' => $result['token'],
            ],
        ], 201);
    }

    /**
     * Login user.
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $result = $this->authService->login(
            $request->validated()
        );

        return response()->json([
            'success' => true,
            'message' => 'User logged in successfully.',
            'data' => [
                'user' => new UserResource($result['user']),
                'token' => $result['token'],
            ],
        ]);
    }

    /**
     * Logout authenticated user.
     */
    public function logout(Request $request): JsonResponse
    {
        $this->authService->logout($request->user());

        return response()->json([
            'success' => true,
            'message' => 'User logged out successfully.',
        ]);
    }

    /**
     * Get authenticated user.
     */
    public function me(Request $request): UserResource
    {
        return new UserResource($request->user());
    }


    /**
     * Update authenticated user profile.
     */
    public function updateProfile(UpdateProfileRequest $request): JsonResponse
    {
        $user = $this->authService->updateProfile(
            $request->user(),
            $request->validated()
        );

        return response()->json([
            'success' => true,
            'message' => 'Profile updated successfully.',
            'data' => new UserResource($user),
        ]);
    }


    /**
     * Change authenticated user password.
     */
    public function changePassword(ChangePasswordRequest $request): JsonResponse
    {
        $this->authService->changePassword(
            $request->user(),
            $request->validated()
        );

        return response()->json([
            'success' => true,
            'message' => 'Password changed successfully.',
        ]);
    }


    /**
     * Send password reset link.
     */
    public function forgotPassword(
        ForgotPasswordRequest $request
    ): JsonResponse
    {
        $this->authService->forgotPassword(
            $request->validated()['email']
        );

        return response()->json([
            'success' => true,
            'message' => 'If an account exists for this email, a password reset link has been sent.',
        ]);
    }

    /**
     * Reset user password.
     */
    public function resetPassword(
        ResetPasswordRequest $request
    ): JsonResponse
    {
        $this->authService->resetPassword(
            $request->validated()
        );

        return response()->json([
            'success' => true,
            'message' => 'Password reset successfully.',
        ]);
    }


    /**
     * Verify authenticated user's email.
     */
    public function verifyEmail(Request $request): JsonResponse|RedirectResponse
    {
        $this->authService->verifyEmail($request);

        // Opened from the email in a browser: continue on the storefront.
        if (! $request->expectsJson()) {
            return redirect()->away(config('app.frontend_url') . '/account?verified=1');
        }

        return response()->json([
            'success' => true,
            'message' => 'Email verified successfully.',
        ]);
    }


    /**
     * Resend email verification link.
     */
    public function resendVerification(Request $request): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        $this->authService->resendVerification($user);

        return response()->json([
            'success' => true,
            'message' => 'Verification email sent successfully.',
        ]);
    }

}