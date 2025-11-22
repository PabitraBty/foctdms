<?php
// Enable error reporting for debugging during development
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json');
include 'db.php';
session_start();

$username = $_SESSION['username'] ?? '';
if (!$username) {
    echo json_encode(['status' => 'error', 'message' => 'Not authenticated']);
    exit;
}

$type = $_POST['application_type'] ?? '';
$title = $_POST['application_title'] ?? '';
$details = $_POST['application_details'] ?? '';
$start_date = $_POST['start_date'] ?? '';
$end_date = $_POST['end_date'] ?? '';
$class_count = intval($_POST['class_count'] ?? 0);
$class_schedule_json = $_POST['class_schedule'] ?? '[]';

// File upload setup
$filepath = '';
if (isset($_FILES['application_document']) && $_FILES['application_document']['error'] === UPLOAD_ERR_OK) {
    $uploadDir = '../upload_applications/';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0775, true);
    }
    $originalName = basename($_FILES['application_document']['name']);
    $safeName = uniqid() . '_' . preg_replace('/[^a-zA-Z0-9._-]/', '_', $originalName);
    $target = $uploadDir . $safeName;

    if (move_uploaded_file($_FILES['application_document']['tmp_name'], $target)) {
        $filepath = $safeName; // Store only filename (DB: VARCHAR)
    } else {
        echo json_encode(['status' => 'error', 'message' => 'File upload failed']);
        exit;
    }
}

// Basic validation
if (!$type || !$title || !$details || !$start_date || !$end_date || $class_count <= 0) {
    echo json_encode(['status' => 'error', 'message' => 'Missing required fields']);
    exit;
}
// Make sure JSON is properly escaped for SQL
$class_schedule_json = addslashes($class_schedule_json);

// Prepare and execute query (add filepath if file handled)
if ($filepath) {
    $stmt = $conn->prepare("INSERT INTO applications (uploaded_by, application_type, title, details, start_date, end_date, class_count, class_schedule, file, status, uploaded_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW())");
    $stmt->bind_param("ssssssiss", $username, $type, $title, $details, $start_date, $end_date, $class_count, $class_schedule_json, $filepath);
} else {
    $stmt = $conn->prepare("INSERT INTO applications (uploaded_by, application_type, title, details, start_date, end_date, class_count, class_schedule, status, uploaded_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW())");
    $stmt->bind_param("ssssssis", $username, $type, $title, $details, $start_date, $end_date, $class_count, $class_schedule_json);
}
$status = $stmt->execute();

if ($status && $stmt->affected_rows > 0) {
    echo json_encode(['status' => 'success']);
} else {
    echo json_encode(['status' => 'error', 'message' => 'Failed to save: '.$stmt->error]);
}
$stmt->close();
$conn->close();
?>
