<?php
header('Content-Type: application/json');
include 'db.php';
session_start();

$username = $_SESSION['username'] ?? '';
$role = $_SESSION['role'] ?? '';
if ($role !== 'admin') {
  echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
  exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$id = intval($data['id'] ?? 0);
$status = $data['status'] ?? '';

if (!$id || !in_array($status, ['accepted', 'rejected'])) {
  echo json_encode(['status' => 'error', 'message' => 'Invalid input']);
  exit;
}

$stmt = $conn->prepare("UPDATE applications SET status=? WHERE id=?");
$stmt->bind_param("si", $status, $id);
$stmt->execute();

if ($stmt->affected_rows > 0) {
  echo json_encode(['status' => 'success']);
} else {
  echo json_encode(['status' => 'error', 'message' => 'Failed to update']);
}
$stmt->close();
$conn->close();
?>
