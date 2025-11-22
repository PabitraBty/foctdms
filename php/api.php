<?php
session_start();
header('Content-Type: application/json');
include 'db.php';

// ------ 1. File Preview (for document modal) -------
if (isset($_GET['preview_id'])) {
    $fileId = intval($_GET['preview_id']);
    $stmt = $conn->prepare("SELECT filepath, filename FROM documents WHERE id=? LIMIT 1");
    $stmt->bind_param("i", $fileId);
    $stmt->execute();
    $res = $stmt->get_result();
    if ($row = $res->fetch_assoc()) {
        $filePath = '../upload/' . $row['filepath'];
        $fileType = @mime_content_type($filePath);
        $fileUrl = $filePath; // use relative path for <img src> or <iframe src>
        if (!file_exists($filePath)) {
            echo json_encode(['status' => 'error', 'message' => 'File not found']);
            exit;
        }
        echo json_encode([
            'status' => 'success',
            'filetype' => $fileType,
            'url' => $fileUrl,
            'filename' => $row['filename']
        ]);
        exit;
    } else {
        echo json_encode(['status' => 'error', 'message' => 'File record not found.']);
        exit;
    }
}

// ------ 2. Return user session info (role, name, etc) -------
if (isset($_SESSION['username'])) {
    // Safely get all expected fields, ensure role is present
    $response = [
        'status' => 'success',
        'username' => $_SESSION['username'],
        'fullname' => $_SESSION['fullname'] ?? '',
        'role' => $_SESSION['role'] ?? ''
    ];
    // Debug safety: You can log this for debugging if needed
    // file_put_contents('/tmp/apidebug.txt', print_r($response, true));
    echo json_encode($response);
    exit;
} else {
    echo json_encode(['status' => 'error', 'message' => 'Not logged in']);
    exit;
}
?>
