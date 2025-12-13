<?php
include 'db.php';
session_start();

$id   = intval($_GET['id'] ?? 0);
$user = $_SESSION['username'] ?? '';
$role = $_SESSION['role'] ?? '';

if (!$id) {
    header('HTTP/1.1 400 Bad Request');
    exit('Invalid document id');
}

// Fetch document record
$stmt = $conn->prepare(
    "SELECT filename, filepath, uploaded_by 
     FROM documents 
     WHERE id = ?"
);
$stmt->bind_param("i", $id);
$stmt->execute();
$result = $stmt->get_result();
$doc = $result->fetch_assoc();
$stmt->close();

if (!$doc) {
    header('HTTP/1.1 404 Not Found');
    exit('Document not found');
}

// Permission: only uploader or admin
if ($role !== 'admin' && $doc['uploaded_by'] !== $user) {
    header('HTTP/1.1 403 Forbidden');
    exit('Access denied');
}

// IMPORTANT: use the correct folder name
// If your files are stored in /upload/, not /uploads/, use this:
$path = '../upload/' . $doc['filepath'];

if (!file_exists($path)) {
    header('HTTP/1.1 404 Not Found');
    exit('File not found on server');
}

// Send file to browser
$downloadName = $doc['filename'] ?: basename($doc['filepath']);

header('Content-Description: File Transfer');
header('Content-Type: application/octet-stream');
header('Content-Disposition: attachment; filename="' . basename($downloadName) . '"');
header('Content-Length: ' . filesize($path));
header('Cache-Control: must-revalidate');
header('Pragma: public');

readfile($path);
exit;
?>
