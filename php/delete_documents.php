<?php
header('Content-Type: application/json');
include 'db.php';
session_start();

$id = intval($_GET['id'] ?? 0);
$user = $_SESSION['username'] ?? '';
$role = $_SESSION['role'] ?? '';

if(!$id){
  echo json_encode(['status'=>'error', 'message'=>'Invalid document ID']);
  exit;
}

$stmt = $conn->prepare("SELECT filepath, uploaded_by FROM documents WHERE id=?");
$stmt->bind_param("i", $id);
$stmt->execute();
$file = $stmt->get_result()->fetch_assoc();
$stmt->close();

if (!$file || ($role != 'admin' && $file['uploaded_by'] != $user)) {
  echo json_encode(['status'=>'error', 'message'=>'No permission or file not found']);
  exit;
}

// Remove file from disk
$path = '../uploads/' . $file['filepath'];
if (file_exists($path)) unlink($path);

$stmt = $conn->prepare("DELETE FROM documents WHERE id=?");
$stmt->bind_param("i", $id);
if($stmt->execute()){
  echo json_encode(['status'=>'success', 'message'=>'Document deleted successfully']);
} else {
  echo json_encode(['status'=>'error', 'message'=>'Failed to delete document']);
}
$stmt->close();
$conn->close();
?>
