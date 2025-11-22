<?php
header('Content-Type: application/json');
ini_set('display_errors', 1);
error_reporting(E_ALL);
include 'db.php';
session_start();

$user = $_SESSION['username'] ?? 'demo_user';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!isset($_FILES['document'])) {
        echo json_encode(['status'=>'error', 'message'=>'No file uploaded']);
        exit;
    }
    $file = $_FILES['document'];

    $docName = $_POST['doc_name'] ?? '';
    $category = $_POST['category'] ?? ''; // Get category (document type) from form

    $fileType = mime_content_type($file['tmp_name']);
    $allowedTypes = [
        'application/pdf' => 'PDF',
        'application/msword' => 'Word',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document' => 'Word',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' => 'Excel',
        'image/jpeg' => 'Image',
        'image/png' => 'Image',
        'image/gif' => 'Image',
        'image/webp' => 'Image',
        'image/bmp' => 'Image'
    ];

    if (!array_key_exists($fileType, $allowedTypes)) {
        echo json_encode(['status'=>'error', 'message'=>'Unsupported file type ('.$fileType.')']);
        exit;
    }
    if ($file['size'] > 50*1024*1024) { // 50MB max for demo
        echo json_encode(['status'=>'error', 'message'=>'File size exceeds 50MB']);
        exit;
    }

    $uploadDir = '../upload/';
    if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);
    $uniqueName = uniqid() . '_' . preg_replace('/[^a-zA-Z0-9._-]/', '_', $file['name']);
    $target = $uploadDir . $uniqueName;

    if (move_uploaded_file($file['tmp_name'], $target)) {
        $sizeKB = round($file['size']/1024, 1); // Save size in KB

        // Store ALL columns in database
        $stmt = $conn->prepare("INSERT INTO documents (filename, filepath, size, uploaded_by, doc_type, category, doc_name) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $docType = $allowedTypes[$fileType];
        $stmt->bind_param(
            "ssdssss",
            $file['name'],
            $uniqueName,
            $sizeKB, // as DOUBLE
            $user,
            $docType,
            $category,
            $docName
        );
        $stmt->execute();
        $stmt->close();
        echo json_encode(['status'=>'success']);
    } else {
        echo json_encode(['status'=>'error', 'message'=>'Upload failed']);
    }
    $conn->close();
} else {
    echo json_encode(['status'=>'error', 'message'=>'Invalid request']);
}
?>

