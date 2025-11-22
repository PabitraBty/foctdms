<?php
$host = 'localhost';
$user = 'root';      // adjust to your setup
$pass = '';
$db = 'newdms';
$conn = new mysqli($host, $user, $pass, $db);
if ($conn->connect_error) {
    die("Connection failed: ".$conn->connect_error);
}
?>
