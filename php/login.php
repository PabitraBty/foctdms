<?php
header('Content-Type: application/json');
session_start();
include 'db.php';

$data = json_decode(file_get_contents("php://input"), true);
$username = trim($data['username'] ?? '');
$password = $data['password'] ?? '';

$stmt = $conn->prepare("SELECT id, username, password, fullname, role FROM users WHERE username = ?");
$stmt->bind_param("s", $username);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 1) {
    $user = $result->fetch_assoc();
    if (password_verify($password, $user['password'])) {
        $_SESSION['username'] = $user['username'];
        $_SESSION['fullname'] = $user['fullname'];
        $_SESSION['role'] = $user['role'];
        echo json_encode(['status'=>'success','user'=>[
            'username'=>$user['username'],
            'fullname'=>$user['fullname'],
            'role'=>$user['role']
        ]]);
    } else {
        echo json_encode(['status'=>'error','message'=>'Invalid credentials']);
    }
} else {
    echo json_encode(['status'=>'error','message'=>'Invalid credentials']);
}
$stmt->close();
$conn->close();
?>
