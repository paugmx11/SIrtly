<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ContactMessage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class ContactController extends Controller
{
    private const PHONE_REGEX = '/^\+?[0-9\s()\-]{7,20}$/';

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'email' => ['required', 'email', 'max:190'],
            'company' => ['required', 'string', 'max:190'],
            'phone' => ['required', 'string', 'max:30', 'regex:' . self::PHONE_REGEX],
            'message' => ['required', 'string', 'min:5', 'max:4000'],
        ]);

        $contactId = null;

        try {
            $contact = ContactMessage::create([
                ...$validated,
                'meta' => [
                    'ip' => $request->ip(),
                    'user_agent' => (string) $request->userAgent(),
                ],
            ]);
            $contactId = $contact->id;
        } catch (\Throwable $e) {
            Log::warning('Contact message not persisted to DB', ['error' => $e->getMessage()]);
        }

        try {
            Mail::raw(
                "Nuevo contacto web\n\n" .
                "Nombre: {$validated['name']}\n" .
                "Email: {$validated['email']}\n" .
                "Empresa: {$validated['company']}\n" .
                "Telefono: {$validated['phone']}\n\n" .
                "Mensaje:\n{$validated['message']}\n",
                function ($message) use ($validated) {
                    $message
                        ->to('SirtlyDev@gmail.com')
                        ->subject('Nuevo contacto desde landing - Sirtly')
                        ->replyTo($validated['email'], $validated['name']);
                }
            );
        } catch (\Throwable $e) {
            Log::error('Contact mail send failed', [
                'contact_id' => $contactId,
                'error' => $e->getMessage(),
            ]);
        }

        return response()->json([
            'message' => 'Contact message received.',
            'contact_id' => $contactId,
        ], 201);
    }
}
