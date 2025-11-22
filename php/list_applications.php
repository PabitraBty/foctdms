<?php
header('Content-Type: application/json');
include 'db.php';
session_start();

$username = $_SESSION['username'] ?? '';
$role = $_SESSION['role'] ?? '';

if (!$username) {
  echo json_encode(['status' => 'error', 'message' => 'Not authenticated']);
  exit;
}

if ($role === 'admin') {
  // Admin sees all applications uploaded by others, exclude self if desired
  $query = "SELECT * FROM applications WHERE uploaded_by != ? ORDER BY uploaded_at DESC";
  $stmt = $conn->prepare($query);
  $stmt->bind_param("s", $username);
} else {
  // Faculty/user sees only their own applications
  $query = "SELECT * FROM applications WHERE uploaded_by = ? ORDER BY uploaded_at DESC";
  $stmt = $conn->prepare($query);
  $stmt->bind_param("s", $username);
}

$stmt->execute();
$result = $stmt->get_result();
$applications = $result->fetch_all(MYSQLI_ASSOC);

echo json_encode(['status' => 'success', 'applications' => $applications]);

$stmt->close();
$conn->close();
?>
