-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Nov 15, 2025 at 07:40 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00"; 


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `newdms`
--

-- --------------------------------------------------------

--
-- Table structure for table `documents`
--

CREATE TABLE `documents` (
  `id` int(11) NOT NULL,
  `filename` varchar(255) NOT NULL,
  `filepath` varchar(255) NOT NULL,
  `size` varchar(25) NOT NULL,
  `uploaded_by` varchar(50) NOT NULL,
  `doc_type` varchar(15) NOT NULL,
  `category` varchar(50) DEFAULT NULL,
  `uploaded_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `documents`
--

INSERT INTO `documents` (`id`, `filename`, `filepath`, `size`, `uploaded_by`, `doc_type`, `category`, `uploaded_at`) VALUES
(1, 'Both.pdf', '691806718acd0_Both.pdf', '', 'pabitrabca1', '', NULL, '2025-11-15 04:49:53'),
(2, 'assignment_cover_page UI.docx', '691806858c4f0_assignment_cover_page UI.docx', '', 'pabitrabca1', '', NULL, '2025-11-15 04:50:13'),
(3, 'A document management system for faculty, based on.pdf', '69181175971b1_A_document_management_system_for_faculty__based_on.pdf', '0.6MB', 'pabitrabca1', 'PDF', NULL, '2025-11-15 05:36:53'),
(4, 'ADD Assign1.pdf', '69181181e5d6e_ADD_Assign1.pdf', '0.6MB', 'pabitrabca1', 'PDF', NULL, '2025-11-15 05:37:05'),
(5, 'P13 CC.pdf', '69181193f1c1e_P13_CC.pdf', '0.8MB', 'pabitrabca1', 'PDF', NULL, '2025-11-15 05:37:23'),
(6, 'Pabitra Basumatary (3).docx', '691815c4c12e7_Pabitra_Basumatary__3_.docx', '0.1MB', 'demo_user', 'Word', NULL, '2025-11-15 05:55:16');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `fullname` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('faculty','admin') NOT NULL DEFAULT 'faculty',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `fullname`, `email`, `username`, `password`, `role`, `created_at`) VALUES
(0, '[value-2]', '[value-3]', '[value-4]', '[value-5]', 'faculty', '0000-00-00 00:00:00'),
(2, 'Pabitra', 'pabitrabty524@gmail.com', 'pabitrabca', '$2y$10$Z8.yh2dMWA56d7f4sn1dCu5eMiTk/pqB5nW/9crXUoEdfVMKM39hi', 'faculty', '2025-11-15 03:47:05'),
(3, 'Pabitra1', 'pabitra123@gmail.com', 'pabitrabca1', '$2y$10$hricXjUi/zZrA/0moR26nO3K1V3c9LE2ZYiBvFP5oMpCtcx1h2b4.', 'admin', '2025-11-15 03:49:24');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `documents`
--
ALTER TABLE `documents`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `username` (`username`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `documents`
--
ALTER TABLE `documents`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
