<?php

require __DIR__ . '/../vendor/autoload.php';

$app = require __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$user = App\Models\User::query()->where('role', 'super_admin')->first()
    ?? App\Models\User::query()->first();

if (!$user) {
    fwrite(STDERR, "No user found for auth test.\n");
    exit(1);
}

$token = $user->createToken('work-checklist-test')->plainTextToken;

$request = Illuminate\Http\Request::create(
    '/api/work-checklist/structure?type=planning',
    'GET',
    [],
    [],
    [],
    ['HTTP_ACCEPT' => 'application/json', 'HTTP_AUTHORIZATION' => 'Bearer ' . $token]
);

$response = $app->handle($request);

echo 'HTTP ' . $response->getStatusCode() . PHP_EOL;
echo substr($response->getContent(), 0, 500) . PHP_EOL;

$user->tokens()->where('name', 'work-checklist-test')->delete();
