<?php

namespace Tests\Unit;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\URL;
use Tests\TestCase;

class EmailVerificationTest extends TestCase
{
    public function test_relative_verification_signature_is_valid_across_hosts(): void
    {
        $url = URL::temporarySignedRoute(
            'verification.verify',
            now()->addHour(),
            ['id' => 10, 'hash' => sha1('person@example.com')],
            false,
        );

        $request = Request::create('https://phone-tunnel.example' . $url, 'GET');

        $this->assertTrue($request->hasValidSignature(false));
    }
}
