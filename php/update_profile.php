<?php
header('Content-Type: application/json');
include 'db.php';
session_start();

if (!isset($_SESSION['username'])) {
    echo json_encode(['status' => 'error', 'message' => 'Not authenticated']);
    exit;
}

$username   = $_SESSION['username'];
$full_name  = trim($_POST['full_name'] ?? '');
$email      = trim($_POST['email'] ?? '');
$avatarPath = null;   // relative path to store in DB (e.g. "uploads/avatars/xxx.png")

if ($full_name === '' || $email === '') {
    echo json_encode(['status' => 'error', 'message' => 'Full name and email are required']);
    exit;
}

// Handle avatar upload (optional)
if (isset($_FILES['avatar']) && $_FILES['avatar']['error'] === UPLOAD_ERR_OK) {
    $uploadDirFs   = __DIR__ . '/../uploads/avatars/';  // filesystem path
    $uploadDirWeb  = 'uploads/avatars/';                // path stored in DB

    if (!is_dir($uploadDirFs)) {
        mkdir($uploadDirFs, 0775, true);
    }

    $original = basename($_FILES['avatar']['name']);
    $safeName = uniqid('ava_') . '_' . preg_replace('/[^a-zA-Z0-9._-]/', '_', $original);
    $targetFs = $uploadDirFs . $safeName;

    if (!move_uploaded_file($_FILES['avatar']['tmp_name'], $targetFs)) {
        echo json_encode(['status' => 'error', 'message' => 'Failed to upload avatar']);
        exit;
    }

    $avatarPath = $uploadDirWeb . $safeName; // this is what goes into DB
}

// Update users table
if ($avatarPath) {
    $stmt = $conn->prepare("
        UPDATE users 
        SET fullname = ?, email = ?, avatar_url = ?
        WHERE username = ?
    ");
    $stmt->bind_param("ssss", $full_name, $email, $avatarPath, $username);
} else {
    $stmt = $conn->prepare("
        UPDATE users 
        SET fullname = ?, email = ?
        WHERE username = ?
    ");
    $stmt->bind_param("sss", $full_name, $email, $username);
}

$ok = $stmt->execute();
$err = $stmt->error;
$stmt->close();

if (!$ok) {
    echo json_encode(['status' => 'error', 'message' => 'DB error: ' . $err]);
    exit;
}

// Build avatar URL for front-end
$avatarUrlFull = $avatarPath ? '../' . $avatarPath : null;

echo json_encode([
    'status'     => 'success',
    'full_name'  => $full_name,
    'email'      => $email,
    'avatar_url' => $avatarUrlFull,
]);
$conn->close();
