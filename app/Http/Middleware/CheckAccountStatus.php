<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class CheckAccountStatus
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = Auth::user();

        if ($user) {
            if ($user->is_blocked) {
                Auth::logout();
                $message = 'Votre compte a été bloqué. ' . ($user->blocked_reason ? 'Raison : ' . $user->blocked_reason : '');

                if ($request->expectsJson()) {
                    return response()->json(['message' => $message], 403);
                }

                return redirect('/login')->withErrors(['email' => $message]);
            }

            if ($user->is_suspended) {
                Auth::logout();
                $message = 'Votre compte est actuellement suspendu. ' . ($user->suspended_reason ? 'Raison : ' . $user->suspended_reason : '');

                if ($request->expectsJson()) {
                    return response()->json(['message' => $message], 403);
                }

                return redirect('/login')->withErrors(['email' => $message]);
            }

            if ($user->is_frozen) {
                Auth::logout();
                $message = 'Votre compte est gelé. ' . ($user->frozen_reason ? 'Raison : ' . $user->frozen_reason : '');

                if ($request->expectsJson()) {
                    return response()->json(['message' => $message], 403);
                }

                return redirect('/login')->withErrors(['email' => $message]);
            }
        }

        return $next($request);
    }
}
