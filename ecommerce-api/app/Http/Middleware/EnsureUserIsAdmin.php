<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsAdmin
{
    /**
     * Allow the request only for authenticated administrators.
     */
    public function handle(Request $request, Closure $next): Response
    {
        /** @var \App\Models\User|null $user */
        $user = $request->user();

        if (! $user || ! $user->isAdmin()) {

            return response()->json([
                'success' => false,
                'message' => 'This action is restricted to administrators.',
            ], 403);

        }

        return $next($request);
    }
}
