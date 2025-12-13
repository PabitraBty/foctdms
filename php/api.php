<?php
header('Content-Type: application/json');
include 'db.php';
session_start();

// ✅ Step 1: Check session
if (!isset($_SESSION['username'])) {
    echo json_encode([
        'status'  => 'error',
        'message' => 'Not authenticated'
    ]);
    exit;
}

$username = $_SESSION['username'];

// ✅ Step 2: Fetch user details safely
$stmt = $conn->prepare("
    SELECT 
        id,
        fullname,
        email,
        username,
        avatar_url,
        role
    FROM users
    WHERE username = ?
    LIMIT 1
");
$stmt->bind_param("s", $username);
$stmt->execute();
$result = $stmt->get_result();
$user = $result->fetch_assoc();
$stmt->close();

// ✅ Step 3: If not found, still return username from session
if (!$user) {
    echo json_encode([
        'status'   => 'success',
        'username' => $username,
        'role'     => $_SESSION['role'] ?? 'faculty',
        'full_name'=> $username,
        'email'    => '',
        'avatar_url'=> null
    ]);
    exit;
}

// ✅ Step 4: Ensure full_name and avatar_url have proper defaults
$fullName = $user['fullname'] ?: $user['username'];
$email = $user['email'] ?: '';
$role = $user['role'] ?: ($_SESSION['role'] ?? 'faculty');

// handle avatar URL (make relative to your dashboard.html)
$avatarUrl = '';
if (!empty($user['avatar_url'])) {
    // if it already starts with http or https, leave it
    if (preg_match('/^https?:\/\//i', $user['avatar_url'])) {
        $avatarUrl = $user['avatar_url'];
    } else {
        // make sure the path works from your HTML file
        $avatarUrl = '../' . ltrim($user['avatar_url'], '/');
    }
}

// ✅ Step 5: Return JSON
echo json_encode([
    'status'     => 'success',
    'username'   => $user['username'],
    'role'       => $role,
    'full_name'  => $fullName,
    'email'      => $email,
    'avatar_url' => $avatarUrl
]);

$conn->close();
