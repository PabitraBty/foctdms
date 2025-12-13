<?php
// change_password.php
header('Content-Type: application/json');
session_start();
require 'db.php';

if (!isset($_SESSION['username'])) {
    echo json_encode(['status' => 'error', 'message' => 'Not authenticated']);
    exit;
}

$username = $_SESSION['username'];

// ---- Read JSON body ----
$raw = file_get_contents('php://input');
$data = json_decode($raw, true);

if (!is_array($data)) {
    echo json_encode(['status' => 'error', 'message' => 'Invalid JSON payload']);
    exit;
}

$current = $data['current_password'] ?? '';
$new     = $data['new_password'] ?? '';
$confirm = $data['confirm_password'] ?? '';

if ($current === '' || $new === '' || $confirm === '') {
    echo json_encode(['status' => 'error', 'message' => 'All password fields are required']);
    exit;
}

if ($new !== $confirm) {
    echo json_encode(['status' => 'error', 'message' => 'New password and confirmation do not match']);
    exit;
}

if (strlen($new) < 6) {
    echo json_encode(['status' => 'error', 'message' => 'Password must be at least 6 characters']);
    exit;
}

// ---- Fetch current password from DB ----
$stmt = $conn->prepare("SELECT id, password FROM users WHERE username = ? LIMIT 1");
$stmt->bind_param("s", $username);
$stmt->execute();
$result = $stmt->get_result();
$user = $result->fetch_assoc();
$stmt->close();

if (!$user) {
    echo json_encode(['status' => 'error', 'message' => 'User not found']);
    exit;
}

$userId         = (int)$user['id'];
$storedPassword = $user['password'];

// ✅ If you currently store **hashed** passwords:
if (!password_verify($current, $storedPassword)) {
    echo json_encode(['status' => 'error', 'message' => 'Current password is incorrect']);
    exit;
}
$newHash = password_hash($new, PASSWORD_DEFAULT);

/*
 * ⚠️ If your existing system uses **plain text** passwords instead,
 * replace the 3 lines above with:
 *
 * if ($current !== $storedPassword) { ... incorrect ... }
 * $newHash = $new;
 */

// ---- Update password ----
$stmt = $conn->prepare("UPDATE users SET password = ? WHERE id = ?");
$stmt->bind_param("si", $newHash, $userId);

if (!$stmt->execute()) {
    echo json_encode(['status' => 'error', 'message' => 'DB error: ' . $stmt->error]);
    $stmt->close();
    $conn->close();
    exit;
}

$stmt->close();
$conn->close();

echo json_encode(['status' => 'success']);
