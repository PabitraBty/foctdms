<?php
include 'db.php';
session_start();

$id = intval($_GET['id'] ?? 0);
$user = $_SESSION['username'] ?? '';
$role = $_SESSION['role'] ?? '';

$stmt = $conn->prepare("SELECT filename, filepath, uploaded_by FROM documents WHERE id=?");
$stmt->bind_param("i", $id);
$stmt->execute();
$doc = $stmt->get_result()->fetch_assoc();
$stmt->close();

if (!$doc || ($role != 'admin' && $doc['uploaded_by'] != $user)) {
  header('HTTP/1.1 403 Forbidden');
  exit('Access denied');
}

$path = '../uploads/' . $doc['filepath'];
if (!file_exists($path)) {
  header('HTTP/1.1 404 Not Found');
  exit('File not found');
}

header('Content-Description: File Transfer');
header('Content-Type: application/octet-stream');
header('Content-Disposition: attachment; filename="'.basename($doc['filename']).'"');
header('Content-Length: ' . filesize($path));
readfile($path);
exit;
?>
