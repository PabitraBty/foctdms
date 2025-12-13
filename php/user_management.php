<?php
header('Content-Type: application/json');
include 'db.php';
session_start();

// Only admin can use this
if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
    echo json_encode(['status' => 'error', 'message' => 'Forbidden']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? $_POST['action'] ?? '';

/**
 * Helper to read JSON body
 */
function read_json_body() {
    $raw = file_get_contents('php://input');
    if (!$raw) return [];
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

if ($action === 'list' && $method === 'GET') {
    // LIST USERS
    $res = $conn->query("SELECT id, username, fullname, email, role FROM users ORDER BY id DESC");
    $users = [];
    while ($row = $res->fetch_assoc()) {
        $users[] = $row;
    }
    echo json_encode(['status' => 'success', 'users' => $users]);
    exit;
}

if ($action === 'save' && $method === 'POST') {
    // ADD / UPDATE USER
    $data = read_json_body();

    $id       = isset($data['id']) ? (int)$data['id'] : 0;
    $fullname = trim($data['fullname'] ?? '');
    $username = trim($data['username'] ?? '');
    $email    = trim($data['email'] ?? '');
    $role     = trim($data['role'] ?? 'faculty');
    $password = trim($data['password'] ?? '');

    if ($fullname === '' || $username === '' || $email === '' || $role === '') {
        echo json_encode(['status' => 'error', 'message' => 'All fields except password are required']);
        exit;
    }

    // check duplicate username/email (basic)
    if ($id > 0) {
        $stmt = $conn->prepare("SELECT id FROM users WHERE (username = ? OR email = ?) AND id != ?");
        $stmt->bind_param("ssi", $username, $email, $id);
    } else {
        $stmt = $conn->prepare("SELECT id FROM users WHERE username = ? OR email = ?");
        $stmt->bind_param("ss", $username, $email);
    }
    $stmt->execute();
    $stmt->store_result();
    if ($stmt->num_rows > 0) {
        $stmt->close();
        echo json_encode(['status' => 'error', 'message' => 'Username or email already exists']);
        exit;
    }
    $stmt->close();

    if ($id > 0) {
        // UPDATE
        if ($password !== '') {
            $hash = password_hash($password, PASSWORD_BCRYPT);
            $stmt = $conn->prepare("UPDATE users SET fullname = ?, username = ?, email = ?, role = ?, password = ? WHERE id = ?");
            $stmt->bind_param("sssssi", $fullname, $username, $email, $role, $hash, $id);
        } else {
            $stmt = $conn->prepare("UPDATE users SET fullname = ?, username = ?, email = ?, role = ? WHERE id = ?");
            $stmt->bind_param("ssssi", $fullname, $username, $email, $role, $id);
        }
        if (!$stmt->execute()) {
            $msg = $stmt->error ?: 'DB error';
            $stmt->close();
            echo json_encode(['status' => 'error', 'message' => $msg]);
            exit;
        }
        $stmt->close();
        echo json_encode(['status' => 'success', 'message' => 'User updated']);
        exit;
    } else {
        // INSERT
        if ($password === '') {
            echo json_encode(['status' => 'error', 'message' => 'Password required for new user']);
            exit;
        }
        $hash = password_hash($password, PASSWORD_BCRYPT);
        $stmt = $conn->prepare("INSERT INTO users (fullname, username, email, role, password) VALUES (?, ?, ?, ?, ?)");
        $stmt->bind_param("sssss", $fullname, $username, $email, $role, $hash);
        if (!$stmt->execute()) {
            $msg = $stmt->error ?: 'DB error';
            $stmt->close();
            echo json_encode(['status' => 'error', 'message' => $msg]);
            exit;
        }
        $stmt->close();
        echo json_encode(['status' => 'success', 'message' => 'User created']);
        exit;
    }
}

if ($action === 'delete' && $method === 'POST') {
    // DELETE USER
    $data = read_json_body();
    $id = isset($data['id']) ? (int)$data['id'] : 0;
    if ($id <= 0) {
        echo json_encode(['status' => 'error', 'message' => 'Invalid user id']);
        exit;
    }

    // prevent admin from deleting himself (optional)
    if (isset($_SESSION['user_id']) && (int)$_SESSION['user_id'] === $id) {
        echo json_encode(['status' => 'error', 'message' => 'You cannot delete your own account']);
        exit;
    }

    $stmt = $conn->prepare("DELETE FROM users WHERE id = ?");
    $stmt->bind_param("i", $id);
    if (!$stmt->execute()) {
        $msg = $stmt->error ?: 'DB error';
        $stmt->close();
        echo json_encode(['status' => 'error', 'message' => $msg]);
        exit;
    }
    $stmt->close();
    echo json_encode(['status' => 'success', 'message' => 'User deleted']);
    exit;
}

// fallback
echo json_encode(['status' => 'error', 'message' => 'Invalid request']);
