<?php

namespace Tests\Unit;

use App\Models\User;
use PHPUnit\Framework\TestCase;

class UserModelTest extends TestCase
{
    public function test_password_is_hidden_from_array_representation(): void
    {
        $user = new User();
        $user->setRawAttributes([
            'name' => 'Test',
            'email' => 'test@example.com',
            'password' => 'secret123',
        ], true);

        $asArray = $user->toArray();

        $this->assertArrayNotHasKey('password', $asArray);
    }

    public function test_active_casts_to_boolean(): void
    {
        $user = new User();
        $user->fill(['active' => 1]);

        $this->assertTrue($user->active);
        $this->assertIsBool($user->active);
    }
}
