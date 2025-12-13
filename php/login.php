<?php
// login.php
header('Content-Type: application/json');
session_start();
require 'db.php';

// Read JSON body from fetch()
$data = json_decode(file_get_contents("php://input"), true);

$login    = trim($data['username'] ?? '');   // username or email from form
$password = $data['password'] ?? '';

if ($login === '' || $password === '') {
    echo json_encode([
        'status'  => 'error',
        'message' => 'Username/email and password are required.'
    ]);
    exit;
}

// Look up by username OR email
$stmt = $conn->prepare("
    SELECT id, username, email, password, fullname, role
    FROM users
    WHERE username = ? OR email = ?
    LIMIT 1
");
$stmt->bind_param("ss", $login, $login);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows !== 1) {
    echo json_encode([
        'status'  => 'error',
        'message' => 'Invalid credentials'
    ]);
    $stmt->close();
    $conn->close();
    exit;
}

$user = $result->fetch_assoc();
$stmt->close();

$storedPassword = $user['password'];
$isValid = false;

// ---- 1) Normal case: hashed password (bcrypt, etc.) ----
if (!empty($storedPassword) && password_verify($password, $storedPassword)) {
    $isValid = true;

    // Optional: rehash if algorithm/cost changed
    if (password_needs_rehash($storedPassword, PASSWORD_DEFAULT)) {
        $newHash = password_hash($password, PASSWORD_DEFAULT);
        $u = $conn->prepare("UPDATE users SET password = ? WHERE id = ?");
        $u->bind_param("si", $newHash, $user['id']);
        $u->execute();
        $u->close();
    }

} else {
    // ---- 2) Fallback: plain-text password in DB (for rows created manually) ----
    // If it does NOT look like a bcrypt hash AND matches exactly, accept once and upgrade.
    if (strpos($storedPassword, '$2y$') !== 0 && hash_equals($storedPassword, $password)) {
        $isValid = true;

        // Upgrade this password to a secure hash
        $newHash = password_hash($password, PASSWORD_DEFAULT);
        $u = $conn->prepare("UPDATE users SET password = ? WHERE id = ?");
        $u->bind_param("si", $newHash, $user['id']);
        $u->execute();
        $u->close();
    }
}

if (!$isValid) {
    echo json_encode([
        'status'  => 'error',
        'message' => 'Invalid credentials'
    ]);
    $conn->close();
    exit;
}

// ---- Successful login: set session and return user info ----
$_SESSION['username'] = $user['username'];
$_SESSION['fullname'] = $user['fullname'];
$_SESSION['role']     = $user['role'];

echo json_encode([
    'status' => 'success',
    'user'   => [
        'id'       => $user['id'],
        'username' => $user['username'],
        'fullname' => $user['fullname'],
        'email'    => $user['email'],
        'role'     => $user['role']
    ]
]);

$conn->close();
?>
