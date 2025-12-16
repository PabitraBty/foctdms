<?php
header("Content-Type: application/json");
session_start();
require "db.php";

$data = json_decode(file_get_contents("php://input"), true);

$username = trim($data["username"] ?? "");
$password = $data["password"] ?? "";

if ($username === "" || $password === "") {
    echo json_encode(["status" => "error", "message" => "All fields required"]);
    exit;
}

$stmt = $conn->prepare(
  "SELECT * FROM users WHERE username = ? OR email = ? LIMIT 1"
);
$stmt->bind_param("ss", $username, $username);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows !== 1) {
    echo json_encode(["status" => "error", "message" => "Invalid credentials"]);
    exit;
}

$user = $result->fetch_assoc();

if (!password_verify($password, $user["password"])) {
    echo json_encode(["status" => "error", "message" => "Invalid credentials"]);
    exit;
}

/* SESSION SET */
$_SESSION["username"] = $user["username"];
$_SESSION["fullname"] = $user["fullname"];
$_SESSION["role"] = $user["role"];

echo json_encode([
    "status" => "success",
    "user" => [
        "fullname" => $user["fullname"],
        "role" => $user["role"]
    ]
]);
