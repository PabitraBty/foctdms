<?php
session_start();

if (!isset($_SESSION["username"])) {
    header("Location: login.html");
    exit;
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>DMS Dashboard</title>
  <link rel="stylesheet" href="../css/dashboard.css" />
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap" rel="stylesheet">
</head>
<body>
  <!-- Sidebar -->
  <aside class="sidebar">
    <div class="logo">
    <span class="logo-icon">📁</span>
    <span class="logo-text">DMS</span>
  </div>
    <nav>
      <a data-section="dashboardSection" class="active">Dashboard</a>
      <a data-section="analyticsSection">Analytics</a>
      <a data-section="filesSection">My Documents</a>
      <a data-section="applicationSection">Application</a>
      <a data-section="userManagementSection">User Management</a>
      <a data-section="settingsSection">Settings</a>
    </nav>
  </aside>

  <div class="main-area">
    <header class="dashboard-header">
  <div>
    <!-- Username will be filled by JS -->
    <h2 id="helloUser">Hello</h2>
  </div>
  <div class="user-profile">
    <img src="https://randomuser.me/api/portraits/women/44.jpg" alt="User" class="user-avatar" />
    <button id="logoutBtn">Logout</button>
  </div>
</header>

  <script>
    // helper: make avatar path safe
    function resolveAvatarUrl(raw) {
      if (!raw) return null;

      // already full URL
      if (/^https?:\/\//i.test(raw)) return raw;

      // already relative like "./upload/..." or "../upload/..."
      if (raw.startsWith('/') || raw.startsWith('.')) return raw;

      // plain path from DB, e.g. "upload/avatars/img.jpg"
      return '../' + raw.replace(/^\/+/, '');
    }

    // Fetch user info (full_name, username, avatar)
    fetch('../php/api.php')
      .then(res => res.json())
      .then(data => {
        const helloEl = document.getElementById('helloUser');
        const badgeNameEl = document.querySelector('.user-name');
        const badgeAvatarEl = document.querySelector('.user-avatar');

        if (data.status === 'success') {
          // Prefer full_name, fallback to username, then "User"
          const displayName =
            (data.full_name && data.full_name.trim() !== '')
              ? data.full_name
              : (data.username || 'User');

          if (helloEl) helloEl.textContent = 'Hello ' + displayName;
          if (badgeNameEl) badgeNameEl.textContent = displayName;

          // Try multiple possible avatar keys from API
          const avatarRaw = data.avatar_url || data.avatar || data.profile_pic;
          const resolved = resolveAvatarUrl(avatarRaw);

          if (badgeAvatarEl && resolved) {
            badgeAvatarEl.src = resolved;
          }
        } else {
          if (helloEl) helloEl.textContent = 'Hello User';
        }
      })
      .catch(() => {
        const helloEl = document.getElementById('helloUser');
        if (helloEl) helloEl.textContent = 'Hello User';
      });
  </script>


    <!-- Dashboard Section (Default, visible on page load) -->
    <section id="dashboardSection">
      <div class="upload-card small">
        <form id="uploadForm" class="upload-form small">
          <h3 class="upload-title"><span style="font-size:1.3em;vertical-align:middle;">📤</span> Upload Document</h3>
          <div class="upload-row">
            <label for="fileInput" class="file-label file-label-compact">
              <input type="file" id="fileInput" class="file-input" required />
              <div class="file-input-wrapper-compact">
                <span class="file-icon">📁</span>
                <span class="file-text">Choose file</span>
                <span class="file-hint">(PDF, Word, etc.)</span>
              </div>
              <div id="filePreviewArea" class="file-preview-area" style="margin-top: 10px;"></div>
            </label>
            <input type="text" id="docNameInput" placeholder="Document Name" required style="max-width: 180px;" />
            <select id="docUploadTypeInput" required style="max-width: 150px;">
              <option value="">Type</option>
              <option value="Research Paper">Research Paper</option>
              <option value="Assignment">Assignment</option>
              <option value="Leave Application">Leave Application</option>
              <option value="Exam Paper">Exam Paper</option>
              <option value="Project">Project</option>
              <option value="Notes">Notes</option>
              <option value="Others">Others</option>
            </select>
            <button type="submit" class="upload-btn">Upload</button>
          </div>
        </form>
      </div>

      <!-- Combined Search + Filter Row -->
<div class="search-filter-row">
  <div class="search-row">
    <input type="text" placeholder="Search documents" class="input-small" />
    <button class="search-btn">Search</button>
  </div>

  <div class="filter-group">
    <button class="filter active" data-filter="all">All documents</button>

    <div class="doctype-wrapper">
      <button id="docTypeBtn" type="button" class="doctype-btn">Document Type ▼</button>
      <div id="docTypeMenu" style="display:none">
        <div class="doc-menu-item" data-type="All">All</div>
        <div class="doc-menu-item" data-type="Research Paper">Research Paper</div>
        <div class="doc-menu-item" data-type="Assignment">Assignment</div>
        <div class="doc-menu-item" data-type="Leave Application">Leave Application</div>
        <div class="doc-menu-item" data-type="Exam Paper">Exam Paper</div>
        <div class="doc-menu-item" data-type="Project">Project</div>
        <div class="doc-menu-item" data-type="Notes">Notes</div>
        <div class="doc-menu-item" data-type="Others">Others</div>
      </div>
    </div>

    <button class="filter" data-filter="Others">Others</button>
    <button class="filter" data-filter="Pre-categorized">Pre-categorized <span class="count">7</span></button>

    <select id="periodSelect" class="input-small period-select">
      <option value="all">Period: All</option>
      <option value="7days">Last 7 days</option>
      <option value="month">This Month</option>
    </select>
  </div>
</div>

      <!-- Documents Table -->
      <section class="documents-table-area">
        <h2>All Documents</h2>
        <table class="documents-table">
          <thead>
            <tr>
              <th></th>
              <th>Document Name</th>
              <th>Type</th>
              <th>Size</th>
              <th>User</th>
              <th>Category</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="docs-tbody">
            <!-- Filled dynamically -->
          </tbody>
        </table>
      </section>
    </section>

    <!-- Analytics Section -->
    <section id="analyticsSection" style="display:none;">
  <h2>Analytics</h2>

  <!-- KPI cards -->
  <div class="analytics-kpi-row">
    <div class="analytics-kpi-card">
      <div class="kpi-label">Total documents</div>
      <div class="kpi-value" id="kpiTotalDocs">0</div>
      <div class="kpi-sub">All time</div>
    </div>

    <div class="analytics-kpi-card">
      <div class="kpi-label">This month</div>
      <div class="kpi-value" id="kpiThisMonth">0</div>
      <div class="kpi-sub">Uploaded in current month</div>
    </div>

    <div class="analytics-kpi-card">
      <div class="kpi-label">Top category</div>
      <div class="kpi-value kpi-small" id="kpiTopCategory">—</div>
      <div class="kpi-sub" id="kpiTopCategoryCount">0 documents</div>
    </div>
  </div>

  <!-- Main chart card -->
  <div class="analytics-card">
    <div class="analytics-card-header">
      <div>
        <div class="analytics-title">Documents by type</div>
        <div class="analytics-subtitle">Distribution of documents across categories</div>
    </div>
  </div>

      <div class="analytics-chart-wrapper">
        <canvas id="docTypeChart"></canvas>
      </div>
      </div>
    </section>

    <!-- Files Section -->
    <section id="filesSection" style="display:none;">
      <h2>My Files</h2>
      <div class="documents-table-area">
        <table class="documents-table">
          <thead>
            <tr>
              <th></th>
              <th>Document Name</th>
              <th>Category</th>
              <th>Size</th>
              <th>User</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="myfiles-tbody">
            <!-- Rows filled by JS -->
          </tbody>
        </table>
      </div>
      <!-- Modal for file preview -->
      <div id="filePreviewModal" class="modal" style="display:none;">
        <div class="modal-content">
          <span id="closeModalBtn" class="close-btn">&times;</span>
          <div id="previewBody">Loading...</div>
        </div>
      </div>
    </section>


<!-- Application Upload Section (initially hidden) -->
<section id="applicationSection" style="display:none;">


  <!-- Faculty/User upload -->
  <div id="facultyAppUpload" style="display:none;">
    <h2>Submit Application</h2>
    <form id="applicationForm" enctype="multipart/form-data">
      <div class="form-group">
        <label for="applicationType">Application Type:</label>
        <select id="applicationType" required>
          <option value="">Select Application Type</option>
          <option value="Leave">Leave Application</option>
          <option value="Job">Job Application</option>
          <option value="Internship">Internship Application</option>
          <option value="Other">Other</option>
        </select>
      </div>
      <div class="form-group">
        <label for="applicationTitle">Title/Subject:</label>
        <input id="applicationTitle" type="text" required placeholder="Application title" />
      </div>
      <div class="form-group">
        <label for="applicationDetails">Details:</label>
        <textarea id="applicationDetails" required placeholder="Please provide details..."></textarea>
      </div>
      <div class="form-group leave-only">
        <label for="startDate">Start Date:</label>
        <input type="date" id="startDate" />
      </div>

      <div class="form-group leave-only">
        <label for="endDate">End Date:</label>
        <input type="date" id="endDate" />
      </div>

      <div class="form-group leave-only">
        <label for="classCount">Number of classes:</label>
        <input type="number" id="classCount" min="1" />
      </div>

      <div id="classScheduleContainer" class="leave-only"></div>

      <div class="form-group">
        <label for="applicationFile">Upload Application File (PDF, DOC, etc):</label>
        <input type="file" id="applicationFile" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" required />
      </div>
      <button type="submit">Submit Application</button>
    </form>
    <h3 style="margin:2.5em 0 1em 0;">Your Submitted Applications</h3>
    <div style="overflow-x:auto;">
      <table class="documents-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Type</th>
            <th>Submission Date</th>
            <th>Status</th>
            <th>File</th>
          </tr>
        </thead>
        <tbody id="user-applications-list"></tbody>
      </table>

    </div>
  </div>
  <!-- Admin view -->
  <div id="adminAppsList" style="display:none;">
    <h2>All Applications</h2>
      <table class="documents-table">
        <thead>
            <tr>
            <th>Title</th>
            <th>Type</th>
            <th>User</th>
            <th>Submitted</th>
            <th>Status</th>
            <th>Action</th>
        </tr>
      </thead>
      <tbody id="applications-tbody"></tbody>
    </table>
  </div>

</section>


<!-- ================= User Management Section (Admin only) ================= -->
<section id="userManagementSection" style="display:none;">
  <h2>User Management</h2>

  <div class="documents-table-area" style="margin-bottom:16px;">
    <h3>Add / Edit User</h3>
    <form id="userForm" class="settings-form">
      <input type="hidden" id="userId" /> <!-- empty = new user -->

      <div class="two-col">
        <div class="form-field">
          <label for="userFullName">Full name</label>
          <input type="text" id="userFullName" required />
        </div>
        <div class="form-field">
          <label for="userUsername">Username</label>
          <input type="text" id="userUsername" required />
        </div>
      </div>

      <div class="two-col">
        <div class="form-field">
          <label for="userEmail">Email</label>
          <input type="email" id="userEmail" required />
        </div>
        <div class="form-field">
          <label for="userRole">Role</label>
          <select id="userRole" required>
            <option value="faculty">Faculty</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </div>

      <div class="two-col">
        <div class="form-field">
          <label for="userPassword">Password (for new user or change)</label>
          <input type="password" id="userPassword" placeholder="Leave blank to keep existing" />
        </div>
        <div class="form-field" style="align-self:flex-end;">
          <button type="submit" class="upload-btn">Save User</button>
          <button type="button" id="userFormReset" class="pill-btn pill-btn-ghost" style="margin-left:8px;">Clear</button>
        </div>
      </div>
    </form>
  </div>

  <div class="documents-table-area">
    <h3>All Users</h3>
    <table class="documents-table">
      <thead>
        <tr>
          <th>Username</th>
          <th>Full name</th>
          <th>Email</th>
          <th>Role</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody id="users-tbody">
        <!-- filled by JS -->
      </tbody>
    </table>
  </div>
</section>


<!-- Settings Section -->
<section id="settingsSection" style="display:none;">
  <h2>Settings</h2>

  <div class="settings-grid">
    <!-- ===== Profile Card ===== -->
    <div class="settings-card settings-profile">
      <div class="settings-card-header">
        <div>
          <h3>Profile</h3>
          <p class="settings-subtitle">View and update your basic information.</p>
        </div>
        <div class="settings-actions">
          <button type="button" id="profileEditBtn" class="pill-btn pill-btn-outline">Edit</button>
          <button type="button" id="profileSaveBtn" class="pill-btn pill-btn-primary" style="display:none;">Save</button>
          <button type="button" id="profileCancelBtn" class="pill-btn pill-btn-ghost" style="display:none;">Cancel</button>
        </div>
      </div>

      <div class="profile-top-row">
        <div class="profile-avatar-wrapper">
          <img id="profileAvatarPreview"
               src="https://randomuser.me/api/portraits/women/44.jpg"
               alt="Avatar" />
        </div>
        <div class="profile-avatar-upload">
          <label for="profilePic">Profile picture</label>
          <input type="file" id="profilePic" accept="image/*" disabled />
          <small>PNG or JPG, max 2 MB.</small>
        </div>
      </div>

      <form id="editProfileForm" class="settings-form">
        <div class="two-col">
          <div class="form-field">
            <label for="profileName">Full name</label>
            <input type="text" id="profileName" placeholder="Your name" disabled />
          </div>
          <div class="form-field">
            <label for="profileUsername">Username</label>
            <input type="text" id="profileUsername" disabled />
          </div>
        </div>

        <div class="form-field">
          <label for="profileEmail">Email address</label>
          <input type="email" id="profileEmail" placeholder="you@example.com" disabled />
        </div>
      </form>
    </div>

    <!-- ===== Security Card (Change password) ===== -->
    <div class="settings-card settings-security">
      <div class="settings-card-header">
        <div>
          <h3>Security</h3>
          <p class="settings-subtitle">Update your password to keep your account safe.</p>
          <p class="settings-meta" id="passwordLastChanged">Last changed: Not available</p>
        </div>
        <div class="settings-actions">
          <button type="button" id="securityEditBtn" class="pill-btn pill-btn-outline">
            Change password
          </button>
          <button type="button" id="securitySaveBtn" class="pill-btn pill-btn-primary" style="display:none;">
            Save
          </button>
          <button type="button" id="securityCancelBtn" class="pill-btn pill-btn-ghost" style="display:none;">
            Cancel
          </button>
        </div>
      </div>

      <form id="changePasswordForm" class="settings-form">
        <div class="form-field">
          <label for="currentPassword">Current password</label>
          <input type="password" id="currentPassword" placeholder="••••••••" disabled />
        </div>
        <div class="two-col">
          <div class="form-field">
            <label for="newPassword">New password</label>
            <input type="password" id="newPassword" placeholder="New password" disabled />
          </div>
          <div class="form-field">
            <label for="confirmPassword">Confirm new password</label>
            <input type="password" id="confirmPassword" placeholder="Repeat new password" disabled />
          </div>
        </div>
      </form>
    </div>

    <!-- ===== Preferences Card (Theme + Notifications) ===== -->
    <div class="settings-card settings-preferences">
      <div class="settings-card-header">
        <div>
          <h3>Preferences</h3>
          <p class="settings-subtitle">Customize how DMS behaves for you.</p>
        </div>
        <div class="settings-actions">
          <button type="button" id="prefsEditBtn" class="pill-btn pill-btn-outline">
            Edit
          </button>
          <button type="button" id="prefsSaveBtn" class="pill-btn pill-btn-primary" style="display:none;">
            Save
          </button>
          <button type="button" id="prefsCancelBtn" class="pill-btn pill-btn-ghost" style="display:none;">
            Cancel
          </button>
        </div>
      </div>

      <div class="settings-form">
        <div class="form-field">
          <label>Theme</label>
          <div class="theme-toggle" id="themeToggleGroup">
            <label class="chip-option">
              <input type="radio" name="theme" value="light" checked disabled />
              <span>Light</span>
            </label>
            <label class="chip-option">
              <input type="radio" name="theme" value="dark" disabled />
              <span>Dark</span>
            </label>
          </div>
        </div>
      </div>
    </div>

  </div>
</section>


  <!-- Scripts -->
  <script src="../js/dashboard.js"></script>
  <script src="../js/sidebar.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.10.1/lottie.min.js"></script>


  <script>
    fetch('../php/api.php')
      .then(res => res.json())
      .then(data => {
        if (data.status !== "success") {
          window.location.href = "login.html";
        }
      })
      .catch(() => window.location.href = "login.html");
  </script>
  <!-- PDF generation -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>

<!-- Word document generation -->
<script src="https://cdn.jsdelivr.net/npm/docx@8.5.0/build/index.js"></script>
<script>
  localStorage.setItem('fullname', "<?= $_SESSION['fullname'] ?>");
  localStorage.setItem('userRole', "<?= $_SESSION['role'] ?>");
</script>

<!-- Toast / notification container -->
<div id="toast-container"></div>
<!-- Confirm dialog -->
<!-- Confirm dialog -->
<div id="confirm-modal" class="confirm-modal">
  <div class="confirm-backdrop"></div>
  <div class="confirm-dialog">
    <h3 id="confirm-title" class="confirm-title">Are you sure?</h3>
    <p id="confirm-message" class="confirm-message">
      Do you really want to perform this action?
    </p>
    <div class="confirm-actions">
      <button id="confirm-cancel" type="button" class="confirm-btn cancel">
        Cancel
      </button>
      <button id="confirm-ok" type="button" class="confirm-btn danger">
        OK
      </button>
    </div>
  </div>
</div>
</body>
</html>
