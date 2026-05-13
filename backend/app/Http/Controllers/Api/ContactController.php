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
    private const PHONE_DIGITS_MIN = 9;
    private const PHONE_DIGITS_MAX = 15;

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'email' => ['required', 'email', 'max:190'],
            'company' => ['required', 'string', 'max:190'],
            'phone' => [
                'required',
                'string',
                'max:30',
                'regex:' . self::PHONE_REGEX,
                function ($attribute, $value, $fail) {
                    $digits = preg_replace('/\D+/', '', (string) $value);
                    $count = strlen($digits);
                    if ($count < self::PHONE_DIGITS_MIN || $count > self::PHONE_DIGITS_MAX) {
                        $fail('El teléfono debe tener entre 9 y 15 dígitos.');
                    }
                },
            ],
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
            Log::error('Contact message not persisted to DB', [
                'error' => $e->getMessage(),
                'exception' => get_class($e),
            ]);
        }

        $mailSent = false;

        try {
            Mail::raw(
                "Nuevo contacto web\n\n" .
                "Nombre: {$validated['name']}\n" .
                "Email: {$validated['email']}\n" .
                "Empresa: {$validated['company']}\n" .
                "Telefono: {$validated['phone']}\n\n" .
                "Mensaje:\n{$validated['message']}\n",
                function ($message) use ($validated) {
                    $mailTo = config('mail.to.address') ?: config('mail.from.address');
                    $message
                        ->to($mailTo)
                        ->subject('Nuevo contacto desde landing - Sirtly')
                        ->replyTo($validated['email'], $validated['name']);
                }
            );
            $mailSent = true;
            Log::info('Contact mail sent', [
                'contact_id' => $contactId,
                'mailer' => config('mail.default'),
                'host' => config('mail.mailers.smtp.host'),
                'port' => config('mail.mailers.smtp.port'),
            ]);
        } catch (\Throwable $e) {
            Log::error('Contact mail send failed', [
                'contact_id' => $contactId,
                'error' => $e->getMessage(),
                'exception' => get_class($e),
            ]);
        }

        if (!$mailSent) {
            return response()->json([
                'message' => 'Mensaje guardado, pero no se pudo enviar el correo. Revisa la configuración de Mailtrap.',
                'contact_id' => $contactId,
            ], 500);
        }

        return response()->json([
            'message' => 'Contact message received.',
            'contact_id' => $contactId,
        ], 201);
    }
}
