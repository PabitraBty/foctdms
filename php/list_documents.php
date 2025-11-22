<?php
header('Content-Type: application/json');
include 'db.php';
session_start();

$username = $_SESSION['username'] ?? '';
$role = $_SESSION['role'] ?? '';

if(!$username){
  echo json_encode(['status'=>'error', 'message'=>'Not authenticated']);
  exit;
}

// For debug: print username/role to browser console if needed
// echo "<script>console.log('PHP username: ". addslashes($username) ." role: ". addslashes($role) ."');</script>";

$query = "SELECT id, filename, filepath, size, uploaded_by, doc_type, category, doc_name, uploaded_at FROM documents";
if($role === 'admin') {
    $query .= " ORDER BY uploaded_at DESC";
    $stmt = $conn->prepare($query);
} else {
    $query .= " WHERE uploaded_by = ? ORDER BY uploaded_at DESC";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("s", $username);
}

$stmt->execute();
$result = $stmt->get_result();
$documents = [];
while($row = $result->fetch_assoc()){
  $documents[] = $row;
}
echo json_encode(['status'=>'success', 'documents'=>$documents]);
$stmt->close();
$conn->close();
?>
