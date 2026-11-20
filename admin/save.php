<?php
/**
 * CMS Save Endpoint
 * POST /admin/save.php
 * Body: { "token": "<save_token>", "data": { ...portfolio JSON... } }
 *
 * Returns JSON: { "ok": true } or { "ok": false, "error": "..." }
 */

header('Content-Type: application/json');
header('X-Content-Type-Options: nosniff');

// ── Only allow POST ────────────────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
    exit;
}

// ── Rate-limit: max 20 saves per minute per IP ─────────────────────────────
$ip       = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$rl_file  = sys_get_temp_dir() . '/cms_rl_' . md5($ip) . '.json';
$now      = time();
$window   = 60;   // seconds
$max_req  = 20;

$rl = file_exists($rl_file) ? json_decode(file_get_contents($rl_file), true) : ['count' => 0, 'start' => $now];
if ($now - $rl['start'] > $window) { $rl = ['count' => 0, 'start' => $now]; }
$rl['count']++;
file_put_contents($rl_file, json_encode($rl));

if ($rl['count'] > $max_req) {
    http_response_code(429);
    echo json_encode(['ok' => false, 'error' => 'Too many requests']);
    exit;
}

// ── Read & validate body ───────────────────────────────────────────────────
$raw  = file_get_contents('php://input');
$body = json_decode($raw, true);

if (!$body || !isset($body['token'], $body['data'])) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Invalid request body']);
    exit;
}

// ── Token verification ─────────────────────────────────────────────────────
// Token = sha256( save_secret + date('Y-m-d') )
// Generated client-side the same way and stored in sessionStorage.
$save_secret_file = __DIR__ . '/save_secret.php';

if (!file_exists($save_secret_file)) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Server not configured. See setup instructions.']);
    exit;
}

require $save_secret_file; // defines $SAVE_SECRET

$expected_token = hash('sha256', $SAVE_SECRET . date('Y-m-d'));
// Also accept yesterday's token (handles midnight edge case)
$yesterday_token = hash('sha256', $SAVE_SECRET . date('Y-m-d', strtotime('-1 day')));

if (!hash_equals($expected_token, $body['token']) && !hash_equals($yesterday_token, $body['token'])) {
    http_response_code(403);
    echo json_encode(['ok' => false, 'error' => 'Invalid or expired token']);
    exit;
}

// ── Validate data is an array/object (not a string bomb) ──────────────────
$data = $body['data'];
if (!is_array($data)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'data must be a JSON object']);
    exit;
}

// Size guard: 500 KB max
$json_out = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
if (strlen($json_out) > 512000) {
    http_response_code(413);
    echo json_encode(['ok' => false, 'error' => 'Payload too large']);
    exit;
}

// ── Write atomically ──────────────────────────────────────────────────────
$target   = realpath(__DIR__ . '/..') . '/data.json';
$tmp_file = $target . '.tmp.' . uniqid();

if (file_put_contents($tmp_file, $json_out) === false) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Could not write temp file. Check folder permissions.']);
    exit;
}

if (!rename($tmp_file, $target)) {
    @unlink($tmp_file);
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Could not replace data.json. Check folder permissions.']);
    exit;
}

// ── Log the save ──────────────────────────────────────────────────────────
$log_line = date('Y-m-d H:i:s') . " | {$ip} | data.json saved (" . strlen($json_out) . " bytes)\n";
@file_put_contents(__DIR__ . '/save_log.txt', $log_line, FILE_APPEND | LOCK_EX);

echo json_encode(['ok' => true, 'saved_at' => date('c'), 'bytes' => strlen($json_out)]);
