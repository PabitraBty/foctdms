<?php
// For API: don't echo PHP warnings/notices in the response
ini_set('display_errors', 0);
ini_set('display_startup_errors', 0);
ini_set('log_errors', 1);      // errors will go to the PHP error log
error_reporting(E_ALL);

header('Content-Type: application/json; charset=utf-8');

include 'db.php';
session_start();

// ---------- Auth check ----------
$username = $_SESSION['username'] ?? '';
if (!$username) {
    echo json_encode(['status' => 'error', 'message' => 'Not authenticated']);
    exit;
}

// ---------- Read POST data ----------
$type        = isset($_POST['application_type'])    ? trim($_POST['application_type'])    : '';
$title       = isset($_POST['application_title'])   ? trim($_POST['application_title'])   : '';
$details     = isset($_POST['application_details']) ? trim($_POST['application_details']) : '';
$start_date  = $_POST['start_date'] ?? '';
$end_date    = $_POST['end_date']   ?? '';
$class_count = isset($_POST['class_count']) ? (int)$_POST['class_count'] : 0;
$class_schedule_json = $_POST['class_schedule'] ?? '[]';

// Normalise type check – anything containing "leave" is treated as leave
$isLeave = stripos($type, 'leave') !== false;

// ---------- File upload ----------
$filepath = '';
if (isset($_FILES['application_document']) &&
    $_FILES['application_document']['error'] === UPLOAD_ERR_OK
) {
    $uploadDir = '../upload_applications/';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0775, true);
    }

    $originalName = basename($_FILES['application_document']['name']);
    $safeName = uniqid() . '_' . preg_replace('/[^a-zA-Z0-9._-]/', '_', $originalName);
    $target   = $uploadDir . $safeName;

    if (move_uploaded_file($_FILES['application_document']['tmp_name'], $target)) {
        $filepath = $safeName; // store only filename in DB
    } else {
        echo json_encode(['status' => 'error', 'message' => 'File upload failed']);
        exit;
    }
}

// ---------- Validation ----------

// Always required
if ($type === '' || $title === '' || $details === '') {
    echo json_encode(['status' => 'error', 'message' => 'Missing required fields']);
    exit;
}

if ($isLeave) {
    // Extra rules only for leave applications
    if ($start_date === '' || $end_date === '' || $class_count <= 0) {
        echo json_encode([
            'status'  => 'error',
            'message' => 'Missing required leave details (dates / class count)'
        ]);
        exit;
    }

    $scheduleArr = json_decode($class_schedule_json, true);
    if (!is_array($scheduleArr) || count($scheduleArr) === 0) {
        echo json_encode([
            'status'  => 'error',
            'message' => 'Class schedule is required for leave applications'
        ]);
        exit;
    }
} else {
    // For Job / Internship / Other:
    // start/end/classes are optional – store safe defaults
    if ($start_date === null) $start_date = '';
    if ($end_date === null)   $end_date   = '';
    if ($class_count < 0)     $class_count = 0;

    if (!strlen(trim($class_schedule_json))) {
        $class_schedule_json = '[]';
    }
}

// No need for addslashes when using prepared statements
// $class_schedule_json will be bound as a normal string

// ---------- INSERT into DB ----------
if ($filepath) {
    $stmt = $conn->prepare(
        "INSERT INTO applications
         (uploaded_by, application_type, title, details, start_date, end_date,
          class_count, class_schedule, file, status, uploaded_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW())"
    );
    if (!$stmt) {
        echo json_encode([
            'status'  => 'error',
            'message' => 'DB prepare failed (file): ' . $conn->error
        ]);
        exit;
    }

    $stmt->bind_param(
        "ssssssiss",
        $username,
        $type,
        $title,
        $details,
        $start_date,
        $end_date,
        $class_count,
        $class_schedule_json,
        $filepath
    );
} else {
    $stmt = $conn->prepare(
        "INSERT INTO applications
         (uploaded_by, application_type, title, details, start_date, end_date,
          class_count, class_schedule, status, uploaded_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW())"
    );
    if (!$stmt) {
        echo json_encode([
            'status'  => 'error',
            'message' => 'DB prepare failed: ' . $conn->error
        ]);
        exit;
    }

    $stmt->bind_param(
        "ssssssis",
        $username,
        $type,
        $title,
        $details,
        $start_date,
        $end_date,
        $class_count,
        $class_schedule_json
    );
}

$ok = $stmt->execute();

if ($ok && $stmt->affected_rows > 0) {
    echo json_encode(['status' => 'success']);
} else {
    echo json_encode([
        'status'  => 'error',
        'message' => 'Failed to save: ' . $stmt->error
    ]);
}

$stmt->close();
$conn->close();
