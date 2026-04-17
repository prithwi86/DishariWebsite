<?php
/**
 * Google Sheets Report Proxy
 *
 * Fetches registration data from Google Sheets and returns it as JSON.
 * The service-account key file must be stored OUTSIDE the web root:
 *
 *   /home/<user>/credentials/google-service-account.json
 *
 * Configure the spreadsheet ID and tab/column mappings below.
 */

// ── Configuration ──────────────────────────────────────────────
define('SPREADSHEET_ID', '1Q7G7hg-J-l8RuRYi1qMlNGBn-KTbpYNM-3jDfilw_nc');
define('KEY_FILE_PATH', dirname($_SERVER['DOCUMENT_ROOT']) . '/credentials/google-service-account.json');

// Tabs to fetch and the columns to keep from each tab.
// Column names must match the header row (case-insensitive match).
$TAB_CONFIGS = [
    [
        'tab'  => 'Picnic',
        'cols' => ['eventTitle', 'ticketQty', 'firstname', 'lastname', 'totalAmount', 'createdAtUtc'],
    ],
];

// Cache lifetime in seconds (avoid hammering the Sheets API on every page load)
define('CACHE_TTL', 300); // 5 minutes
define('CACHE_DIR', sys_get_temp_dir());
// ───────────────────────────────────────────────────────────────

header('Content-Type: application/json');

// CORS
$origin  = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowed = ['https://app.dishariboston.org', 'https://dishariboston.org', 'http://localhost:5173'];
if (in_array($origin, $allowed, true)) {
    header("Access-Control-Allow-Origin: $origin");
}
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// ── Serve from cache if fresh ──────────────────────────────────
$cacheFile = CACHE_DIR . '/dishari_sheets_report_' . md5(SPREADSHEET_ID) . '.json';
if (file_exists($cacheFile) && (time() - filemtime($cacheFile)) < CACHE_TTL) {
    readfile($cacheFile);
    exit;
}

// ── Load service-account key ───────────────────────────────────
if (!file_exists(KEY_FILE_PATH)) {
    http_response_code(500);
    echo json_encode(['error' => 'Service account key not found on server']);
    exit;
}

$sa = json_decode(file_get_contents(KEY_FILE_PATH), true);
if (!$sa || empty($sa['client_email']) || empty($sa['private_key'])) {
    http_response_code(500);
    echo json_encode(['error' => 'Invalid service account key']);
    exit;
}

// ── Get OAuth2 access token via JWT ────────────────────────────
$accessToken = getAccessToken($sa);
if (!$accessToken) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to obtain access token']);
    exit;
}

// ── Fetch each tab ─────────────────────────────────────────────
$result = [];

foreach ($TAB_CONFIGS as $cfg) {
    $tab  = $cfg['tab'];
    $cols = $cfg['cols'];

    $range = urlencode("{$tab}!A1:Z");
    $url   = "https://sheets.googleapis.com/v4/spreadsheets/" . SPREADSHEET_ID
           . "/values/{$range}?key=&access_token=" . urlencode($accessToken);

    $resp = curlGet($url);
    if ($resp === false) {
        $result[$tab] = [];
        continue;
    }

    $json = json_decode($resp, true);
    $rows = $json['values'] ?? [];

    if (count($rows) < 2) {
        $result[$tab] = [];
        continue;
    }

    $header = $rows[0];
    // Map desired column names to their indices (case-insensitive)
    $colMap = [];
    foreach ($cols as $col) {
        $colLower = strtolower($col);
        foreach ($header as $i => $h) {
            if (strtolower(trim($h)) === $colLower) {
                $colMap[$col] = $i;
                break;
            }
        }
    }

    $dataRows = [];
    for ($r = 1; $r < count($rows); $r++) {
        $row = $rows[$r];
        $obj = [];
        foreach ($cols as $col) {
            $idx = $colMap[$col] ?? -1;
            $obj[$col] = ($idx >= 0 && isset($row[$idx])) ? $row[$idx] : '';
        }
        $dataRows[] = $obj;
    }

    $result[$tab] = $dataRows;
}

$output = json_encode([
    'tabs'     => $result,
    'metadata' => [
        'source'       => 'Google Sheets (live)',
        'generated_at' => gmdate('Y-m-d\TH:i:s\Z'),
    ],
], JSON_UNESCAPED_UNICODE);

// Write to cache
file_put_contents($cacheFile, $output, LOCK_EX);

echo $output;
exit;

// ── Helper: obtain access token from service account ───────────
function getAccessToken(array $sa): ?string {
    $now    = time();
    $header = base64url_encode(json_encode(['alg' => 'RS256', 'typ' => 'JWT']));
    $claims = base64url_encode(json_encode([
        'iss'   => $sa['client_email'],
        'scope' => 'https://www.googleapis.com/auth/spreadsheets.readonly',
        'aud'   => 'https://oauth2.googleapis.com/token',
        'iat'   => $now,
        'exp'   => $now + 3600,
    ]));

    $unsigned = "{$header}.{$claims}";
    $signature = '';
    $key = openssl_pkey_get_private($sa['private_key']);
    if (!$key) return null;
    if (!openssl_sign($unsigned, $signature, $key, OPENSSL_ALGO_SHA256)) return null;

    $jwt = $unsigned . '.' . base64url_encode($signature);

    $ch = curl_init('https://oauth2.googleapis.com/token');
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => http_build_query([
            'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            'assertion'  => $jwt,
        ]),
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 10,
    ]);
    $resp = curl_exec($ch);
    curl_close($ch);

    if (!$resp) return null;
    $data = json_decode($resp, true);
    return $data['access_token'] ?? null;
}

function base64url_encode(string $data): string {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function curlGet(string $url): string|false {
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 15,
        CURLOPT_FOLLOWLOCATION => true,
    ]);
    $resp = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return ($code >= 200 && $code < 300) ? $resp : false;
}
