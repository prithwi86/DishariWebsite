<?php
/**
 * SMTP2GO Email Proxy
 * 
 * Place your SMTP2GO credentials below. This file runs server-side on Hostinger
 * so the API key is never exposed to the browser.
 */

// ── Configuration ──────────────────────────────────────────────
define('SMTP2GO_API_KEY', 'api-A2E20C2043564C2E87AEB58BC454A111');   // Replace with your real key
define('SMTP2GO_SENDER',  'web.admin@dishariboston.org');     // Must be verified in SMTP2GO
define('RECIPIENT_EMAIL',  'support@dishariboston.org');     // Where messages are delivered
// ───────────────────────────────────────────────────────────────

header('Content-Type: application/json');

// Only allow POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

// Parse JSON body
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid request body']);
    exit;
}

$name    = trim($input['name'] ?? '');
$email   = trim($input['email'] ?? '');
$message = trim($input['message'] ?? '');

// Validate
if ($name === '' || $email === '' || $message === '') {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'All fields are required']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid email address']);
    exit;
}

// Rate limiting: max 5 submissions per IP per hour (simple file-based)
$rateLimitDir = sys_get_temp_dir() . '/dishari_ratelimit';
if (!is_dir($rateLimitDir)) {
    mkdir($rateLimitDir, 0700, true);
}
$clientIp = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$rateFile = $rateLimitDir . '/' . md5($clientIp) . '.json';
$now = time();
$window = 3600; // 1 hour
$maxRequests = 5;

$attempts = [];
if (file_exists($rateFile)) {
    $attempts = json_decode(file_get_contents($rateFile), true) ?: [];
    $attempts = array_filter($attempts, fn($t) => $t > $now - $window);
}

if (count($attempts) >= $maxRequests) {
    http_response_code(429);
    echo json_encode(['success' => false, 'error' => 'Too many requests. Please try again later.']);
    exit;
}

// Sanitize for HTML output
$safeName    = htmlspecialchars($name, ENT_QUOTES, 'UTF-8');
$safeEmail   = htmlspecialchars($email, ENT_QUOTES, 'UTF-8');
$safeMessage = nl2br(htmlspecialchars($message, ENT_QUOTES, 'UTF-8'));

// Build SMTP2GO request
$payload = json_encode([
    'api_key'   => SMTP2GO_API_KEY,
    'to'        => [RECIPIENT_EMAIL],
    'sender'    => SMTP2GO_SENDER,
    'subject'   => 'Message from Dishari Website',
    'text_body' => "Name: {$name}\nEmail: {$email}\n\nMessage:\n{$message}",
    'html_body' => "<h3>New message from Dishari Website</h3>"
                 . "<p><strong>Name:</strong> {$safeName}</p>"
                 . "<p><strong>Email:</strong> <a href=\"mailto:{$safeEmail}\">{$safeEmail}</a></p>"
                 . "<hr/><p>{$safeMessage}</p>",
]);

$ch = curl_init('https://api.smtp2go.com/v3/email/send');
curl_setopt_array($ch, [
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => $payload,
    CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT        => 15,
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

if ($curlError || $httpCode < 200 || $httpCode >= 300) {
    http_response_code(502);
    echo json_encode(['success' => false, 'error' => 'Failed to send email']);
    exit;
}

$result = json_decode($response, true);

if (isset($result['data']['succeeded']) && $result['data']['succeeded'] > 0) {
    // Record successful attempt for rate limiting
    $attempts[] = $now;
    file_put_contents($rateFile, json_encode(array_values($attempts)));

    echo json_encode(['success' => true]);
} else {
    http_response_code(502);
    echo json_encode(['success' => false, 'error' => 'Failed to send email']);
}
