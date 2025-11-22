<?php
header('Content-Type: application/json');
include 'db.php';

$data = json_decode(file_get_contents("php://input"), true);

$fullname = trim($data['fullname'] ?? '');
$email = trim($data['email'] ?? '');
$username = trim($data['username'] ?? '');
$password = $data['password'] ?? '';
$confirmPassword = $data['confirmPassword'] ?? '';
$role = $data['role'] ?? '';

if (!$fullname || !$email || !$username || !$password || !$confirmPassword || !$role) {
    echo json_encode(['status' => 'error', 'message' => 'All fields are required.']); exit;
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['status' => 'error', 'message' => 'Invalid email format.']); exit;
}
if ($password !== $confirmPassword) {
    echo json_encode(['status' => 'error', 'message' => 'Passwords do not match.']); exit;
}
if (strlen($password) < 6) {
    echo json_encode(['status' => 'error', 'message' => 'Password too short.']); exit;
}
if (strlen($username) < 4) {
    echo json_encode(['status' => 'error', 'message' => 'Username must be at least 4 characters.']); exit;
}
if (!in_array($role, ['faculty', 'admin'])) {
    echo json_encode(['status' => 'error', 'message' => 'Invalid role selected.']); exit;
}

// Check for existing user
$stmt = $conn->prepare("SELECT id FROM users WHERE username=? OR email=?");
$stmt->bind_param("ss", $username, $email);
$stmt->execute();
$stmt->store_result();
if ($stmt->num_rows > 0) {
    echo json_encode(['status' => 'error', 'message' => 'Username or Email already exists.']); exit;
}
$stmt->close();

// Hash password and insert, now including role!
$hash = password_hash($password, PASSWORD_DEFAULT);
$stmt = $conn->prepare("INSERT INTO users (fullname, email, username, password, role) VALUES (?, ?, ?, ?, ?)");
$stmt->bind_param("sssss", $fullname, $email, $username, $hash, $role);

if ($stmt->execute()) {
    echo json_encode(['status' => 'success', 'message' => 'Registration successful!']);
} else {
    echo json_encode(['status' => 'error', 'message' => 'Registration failed: ' . $stmt->error]);
}
$stmt->close();
$conn->close();
?>
