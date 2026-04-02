<?php
/**
 * Cloudinary JSON Upload Proxy
 *
 * Receives JSON content from the Admin editor and uploads it to Cloudinary
 * as a raw resource. Credentials are read from environment variables:
 *
 *   CLOUDINARY_CLOUD_NAME
 *   CLOUDINARY_API_KEY
 *   CLOUDINARY_API_SECRET
 *
 * Set these in Hostinger hPanel → PHP Configuration or .htaccess.
 */

header('Content-Type: application/json');

// CORS — allow same-origin only (adjust if needed)
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowed = ['https://app.dishariboston.org', 'https://dishariboston.org', 'http://localhost:5173'];
if (in_array($origin, $allowed, true)) {
    header("Access-Control-Allow-Origin: $origin");
}
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Only allow POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// ── Read credentials from environment ──────────────────────────
$cloudName = getenv('CLOUDINARY_CLOUD_NAME');
$apiKey    = getenv('CLOUDINARY_API_KEY');
$apiSecret = getenv('CLOUDINARY_API_SECRET');

if (!$cloudName || !$apiKey || !$apiSecret) {
    http_response_code(500);
    echo json_encode(['error' => 'Cloudinary credentials not configured on server']);
    exit;
}

// ── Parse request body ─────────────────────────────────────────
$input = json_decode(file_get_contents('php://input'), true);

if (!$input || empty($input['publicId']) || empty($input['content'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing publicId or content']);
    exit;
}

$publicId = $input['publicId'];
$content  = $input['content'];

// Validate that publicId is a safe filename (alphanumeric, hyphens, underscores, dots)
if (!preg_match('/^[a-zA-Z0-9_\-][a-zA-Z0-9_\-\.]*$/', $publicId)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid publicId format']);
    exit;
}

// Validate JSON content
json_decode($content);
if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON content: ' . json_last_error_msg()]);
    exit;
}

// ── Sign and upload to Cloudinary ──────────────────────────────
$timestamp = time();
$paramsToSign = "invalidate=true&overwrite=true&public_id=$publicId&timestamp=$timestamp&type=upload";
$signature = sha1($paramsToSign . $apiSecret);

$uploadUrl = "https://api.cloudinary.com/v1_1/$cloudName/raw/upload";

$postFields = [
    'file'          => 'data:application/json;base64,' . base64_encode($content),
    'public_id'     => $publicId,
    'resource_type' => 'raw',
    'overwrite'     => 'true',
    'invalidate'    => 'true',
    'timestamp'     => (string)$timestamp,
    'api_key'       => $apiKey,
    'signature'     => $signature,
    'type'          => 'upload',
];

$ch = curl_init($uploadUrl);
curl_setopt_array($ch, [
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => $postFields,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT        => 30,
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

if ($curlError) {
    http_response_code(502);
    echo json_encode(['error' => 'Upload request failed: ' . $curlError]);
    exit;
}

$result = json_decode($response, true);

if ($httpCode >= 400 || isset($result['error'])) {
    http_response_code(502);
    $msg = $result['error']['message'] ?? ($result['error'] ?? 'Upload failed');
    echo json_encode(['error' => $msg]);
    exit;
}

echo json_encode([
    'success' => true,
    'url'     => $result['secure_url'] ?? '',
    'version' => $result['version'] ?? '',
]);
