/* dashboard.js - Updated, complete, drop-in replacement */

/* ---------- helpers ---------- */
// Format file size as MB, KB, or B
function formatSize(size) {
  if (!size || isNaN(size)) return '—';
  const num = Number(size);
  if (num >= 1024 * 1024) return (num / (1024 * 1024)).toFixed(1) + ' MB';
  if (num >= 1024) return (num / 1024).toFixed(1) + ' KB';
  return num + ' B';
}

function escapeHtml(s) {
  if (s === null || s === undefined) return '';
  return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

/* ---------- main ---------- */
document.addEventListener('DOMContentLoaded', () => {
  // ---------- single declarations (do not redeclare later) ----------
  let searchInput, searchBtn, filterButtons, periodSelect;
  let docTypeBtn, docTypeMenuEl;
  let menuDocType = "";      // normalized (lowercase) selected from doc menu; '' means none
  let menuDocTypeRaw = "";   // raw display label (Assignment, Research Paper, etc.)
  let barDocType = "";       // value from pills (all, Others, Pre-categorized)
  let allDocuments = [];     // loaded documents list

  // ---------- elements used across the file ----------
  const uploadForm = document.getElementById('uploadForm');
  const fileInput = document.getElementById('fileInput');
  const docNameInput = document.getElementById('docNameInput');
  const docUploadTypeInput = document.getElementById('docUploadTypeInput');
  const filePreviewArea = document.getElementById('filePreviewArea');
  const dropzone = document.querySelector('.upload-card');
  const docsTableBody = document.getElementById('docs-tbody');

  // ---------- assign selectors ONCE ----------
  searchInput   = document.querySelector('.search-row input[type="text"]');
  searchBtn     = document.querySelector('.search-row .search-btn');
  // prefer .filter-group (used in your latest dashboard.html), fallback to .filter-bar or generic .filter
  filterButtons = document.querySelectorAll('.filter-group .filter');
  if (!filterButtons || filterButtons.length === 0) filterButtons = document.querySelectorAll('.filter-bar .filter');
  if (!filterButtons || filterButtons.length === 0) filterButtons = document.querySelectorAll('.filter');
  periodSelect  = document.getElementById('periodSelect') || document.querySelector('.period-select');
  docTypeBtn    = document.getElementById('docTypeBtn');
  docTypeMenuEl = document.getElementById('docTypeMenu');

  // ---------- Upload preview + submit ----------
  if (fileInput) {
    fileInput.addEventListener('change', function () {
      filePreviewArea.innerHTML = "";
      const file = this.files && this.files[0];
      if (!file) return;
      if (/^image\//.test(file.type)) {
        const reader = new FileReader();
        reader.onload = function (e) {
          filePreviewArea.innerHTML = `
            <div class="file-preview-box">
              <img src="${e.target.result}" alt="Preview" class="file-preview-img"/>
              <span class="file-preview-name">${escapeHtml(file.name)}</span>
            </div>`;
        };
        reader.readAsDataURL(file);
      } else {
        let icon = "📄";
        if (/pdf/i.test(file.name)) icon = "📕";
        else if (/doc/i.test(file.name)) icon = "📘";
        else if (/xls|csv|sheet/i.test(file.name)) icon = "📗";
        filePreviewArea.innerHTML = `
          <div class="file-preview-box">
            <span class="file-preview-icon">${icon}</span>
            <span class="file-preview-name">${escapeHtml(file.name)}</span>
            <span class="file-preview-size">(${formatSize(file.size)})</span>
          </div>`;
      }
    });
  }

  if (uploadForm) {
    uploadForm.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!fileInput.files[0] || !docNameInput.value.trim() || !docUploadTypeInput.value) {
        alert("Please fill all fields and select a file.");
        return;
      }
      const formData = new FormData();
      formData.append('document', fileInput.files[0]);
      formData.append('doc_name', docNameInput.value.trim());
      formData.append('category', docUploadTypeInput.value);

      fetch('../php/upload.php', { method: 'POST', body: formData })
        .then(res => res.json())
        .then(data => {
          if (data.status === 'success') {
            alert('File uploaded!');
            uploadForm.reset();
            filePreviewArea.innerHTML = "";
            loadDocuments();
          } else {
            alert('Upload failed: ' + (data.message || 'Unknown error'));
          }
        })
        .catch(() => alert('Server error during upload.'));
    });
  }

  // ---------- Drag & Drop ----------
  if (dropzone) {
    dropzone.addEventListener('dragover', e => { e.preventDefault(); dropzone.classList.add('dragover'); });
    dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
    dropzone.addEventListener('drop', e => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
      if (e.dataTransfer.files.length) {
        fileInput.files = e.dataTransfer.files;
        fileInput.dispatchEvent(new Event('change'));
      }
    });
  }

  // ---------- Documents load/render ----------
  function loadDocuments() {
    fetch('../php/list_documents.php')
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
          allDocuments = Array.isArray(data.documents) ? data.documents : [];
          renderDocuments(allDocuments);
          updatePreCategorizedCount();
        } else {
          docsTableBody.innerHTML = `<tr><td colspan="8" style="color:red">${escapeHtml(data.message || 'Error')}</td></tr>`;
        }
      })
      .catch(() => {
        docsTableBody.innerHTML = `<tr><td colspan="8" style="color:red">Server error loading documents.</td></tr>`;
      });
  }

  function renderDocuments(documents) {
    if (!Array.isArray(documents) || documents.length === 0) {
      docsTableBody.innerHTML = `<tr><td colspan="8" style="text-align:center;">No documents found.</td></tr>`;
      return;
    }

    docsTableBody.innerHTML = documents.map(doc => `
      <tr>
        <td><input type="checkbox" /></td>
        <td>${escapeHtml(doc.doc_name ? doc.doc_name : doc.filename)}</td>
        <td><span class="doc-type">${escapeHtml(doc.category || '—')}</span></td>
        <td>${formatSize(doc.size)}</td>
        <td>${escapeHtml(doc.uploaded_by || '—')}</td>
        <td>${escapeHtml(doc.category ?? '-')}</td>
        <td>
          <button class="action-btn download" data-id="${escapeHtml(doc.id)}" title="Download">⬇️</button>
          <button class="action-btn delete" data-id="${escapeHtml(doc.id)}" title="Delete">🗑️</button>
        </td>
      </tr>
    `).join('');

    // wire table action buttons
    docsTableBody.querySelectorAll('.download').forEach(btn => {
      btn.onclick = () => window.location = `../php/download.php?id=${encodeURIComponent(btn.dataset.id)}`;
    });
    docsTableBody.querySelectorAll('.delete').forEach(btn => {
      btn.onclick = () => { if (confirm('Delete this document?')) deleteDocument(btn.dataset.id); };
    });
  }

  function deleteDocument(id) {
    fetch(`../php/delete_documents.php?id=${encodeURIComponent(id)}`)
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') loadDocuments();
        else alert('Failed to delete: ' + (data.message || 'Unknown'));
      })
      .catch(() => alert('Server error during delete.'));
  }

  // ---------- Filters wiring (defensive & robust) ----------
  function attachPillFilters() {
    // Use filterButtons (already collected), fallback to query
    let pills = Array.from(filterButtons || []);
    if (!pills.length) pills = Array.from(document.querySelectorAll('.filter-group .filter, .filter-bar .filter, .filter'));

    pills.forEach(btn => {
      if (btn.__hasListener) return;
      btn.__hasListener = true;
      btn.addEventListener('click', () => {
        pills.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        // fallback if data-filter missing
        barDocType = (btn.dataset && btn.dataset.filter) ? btn.dataset.filter : '';
        barDocType = barDocType === 'all' ? '' : barDocType;
        // clear menu selection
        menuDocType = "";
        menuDocTypeRaw = "";
        if (docTypeBtn) docTypeBtn.textContent = 'Document Type ▼';
        if (docTypeMenuEl) docTypeMenuEl.style.display = 'none';
        applyFilters();
      });
    });
  }

  function attachDocTypeHandlers() {
    if (docTypeBtn && docTypeMenuEl && !docTypeBtn.__attached) {
      docTypeBtn.__attached = true;
      docTypeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const open = docTypeMenuEl.style.display === 'block';
        docTypeMenuEl.style.display = open ? 'none' : 'block';
      });
      document.addEventListener('click', (e) => {
        if (docTypeMenuEl && !docTypeMenuEl.contains(e.target) && e.target !== docTypeBtn) {
          docTypeMenuEl.style.display = 'none';
        }
      });
    }

    if (docTypeMenuEl) {
      docTypeMenuEl.querySelectorAll('.doc-menu-item').forEach(item => {
        if (item.__menuListener) return;
        item.__menuListener = true;
        item.addEventListener('click', () => {
          const raw = (item.getAttribute('data-type') || '').trim();
          menuDocTypeRaw = raw;
          menuDocType = raw.toLowerCase();
          // update menu UI
          docTypeMenuEl.querySelectorAll('.doc-menu-item').forEach(i => i.classList.remove('active'));
          item.classList.add('active');
          // set button label
          if (docTypeBtn) docTypeBtn.textContent = (menuDocType && menuDocType !== 'all') ? `${menuDocTypeRaw} ▼` : 'Document Type ▼';
          // clear pill selection
          const pills = document.querySelectorAll('.filter-group .filter, .filter-bar .filter, .filter');
          pills.forEach(p => p.classList.remove('active'));
          barDocType = "";
          // hide dropdown and apply
          docTypeMenuEl.style.display = 'none';
          applyFilters();
        });
      });
    }
  }

  function applyFilters() {
    let filtered = Array.isArray(allDocuments) ? allDocuments.slice() : [];

    const searchText = (searchInput && searchInput.value) ? searchInput.value.trim().toLowerCase() : '';
    const period = (periodSelect && periodSelect.value) ? periodSelect.value : 'all';

    if (searchText) {
      filtered = filtered.filter(doc => {
        const combined = `${doc.filename || ''} ${doc.doc_name || ''}`.toLowerCase();
        return combined.includes(searchText);
      });
    }

    // pill-based filters
    if (barDocType && barDocType !== '') {
      if (barDocType === 'Pre-categorized') {
        filtered = filtered.filter(doc => doc.pre_categorized == "1" || doc.pre_categorized === true);
      } else {
        filtered = filtered.filter(doc => ((doc.category || '').toString().trim().toLowerCase()) === barDocType.toString().trim().toLowerCase());
      }
    }

    // menu doc type filter (normalize)
    if (menuDocType && menuDocType !== '' && menuDocType !== 'all') {
      filtered = filtered.filter(doc => ((doc.category || '').toString().trim().toLowerCase()) === menuDocType);
    }

    // period filter
    if (period !== 'all' && filtered.length > 0) {
      const now = new Date();
      filtered = filtered.filter(doc => {
        if (!doc.uploaded_at) return false;
        const uploadedDate = new Date(String(doc.uploaded_at).replace(' ', 'T'));
        if (isNaN(uploadedDate.getTime())) return false;
        if (period === '7days') {
          const sevenDaysAgo = new Date(now); sevenDaysAgo.setDate(now.getDate() - 7);
          return uploadedDate > sevenDaysAgo;
        }
        if (period === 'month') {
          return uploadedDate.getMonth() === now.getMonth() && uploadedDate.getFullYear() === now.getFullYear();
        }
        return true;
      });
    }

    renderDocuments(filtered);
  }

  // ---------- wire search & period ----------
  if (searchBtn) searchBtn.addEventListener('click', applyFilters);
  if (searchInput) searchInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') applyFilters(); });
  if (periodSelect) periodSelect.addEventListener('change', applyFilters);

  // ---------- initial attach & load ----------
  attachPillFilters();
  attachDocTypeHandlers();
  loadDocuments();

  // update Pre-categorized count (if API provides pre_categorized flag)
  function updatePreCategorizedCount() {
    const el = document.querySelector('.filter-group .filter[data-filter="Pre-categorized"] .count');
    if (!el) return;
    const count = Array.isArray(allDocuments) ? allDocuments.filter(d => d.pre_categorized == "1" || d.pre_categorized === true).length : 0;
    el.textContent = count;
  }

  // ---------- "My Files" section (user-specific table) ----------
  function loadMyFiles() {
    fetch('../php/list_documents.php')
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
          renderMyFiles(Array.isArray(data.documents) ? data.documents : []);
        } else {
          const tbody = document.getElementById('myfiles-tbody');
          if (tbody) tbody.innerHTML = `<tr><td colspan="6" style="color:red">${escapeHtml(data.message || 'Error')}</td></tr>`;
        }
      })
      .catch(() => {
        const tbody = document.getElementById('myfiles-tbody');
        if (tbody) tbody.innerHTML = `<tr><td colspan="6" style="color:red">Server error loading files.</td></tr>`;
      });
  }

  function renderMyFiles(documents) {
    const tbody = document.getElementById('myfiles-tbody');
    if (!tbody) return;
    tbody.innerHTML = (!Array.isArray(documents) || documents.length === 0) ? `<tr><td colspan="6" style="text-align:center;">No files found.</td></tr>` :
      documents.map(doc => `
        <tr>
          <td><input type="checkbox" /></td>
          <td>${escapeHtml(doc.doc_name || doc.filename)}</td>
          <td><span class="doc-type">${escapeHtml(doc.category || '—')}</span></td>
          <td>${formatSize(doc.size)}</td>
          <td>${escapeHtml(doc.uploaded_by || '—')}</td>
          <td>
            <a href="../upload/${encodeURIComponent(doc.filepath || '')}" target="_blank" class="action-btn" title="Open in new tab">👁️</a>
            <button class="action-btn download" data-id="${escapeHtml(doc.id)}">⬇️</button>
            <button class="action-btn delete" data-id="${escapeHtml(doc.id)}">🗑️</button>
          </td>
        </tr>
      `).join('');

    tbody.querySelectorAll('.download').forEach(btn => btn.onclick = () => window.location = `../php/download.php?id=${encodeURIComponent(btn.dataset.id)}`);
    tbody.querySelectorAll('.delete').forEach(btn => btn.onclick = () => { if (confirm('Delete this document?')) deleteDocument(btn.dataset.id, loadMyFiles); });
  }

  // ---------- modal preview ----------
  function showFilePreviewModal(fileId) {
    const modal = document.getElementById('filePreviewModal');
    const body = document.getElementById('previewBody');
    if (!modal || !body) return;
    modal.style.display = 'block';
    body.innerHTML = "Loading preview...";

    fetch(`../php/api.php?preview_id=${encodeURIComponent(fileId)}`)
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
          if (data.filetype && data.filetype.startsWith('image/')) {
            body.innerHTML = `<img src="${data.url}" style="max-width:95%;max-height:330px;border-radius:12px;">`;
          } else if (data.filetype && data.filetype.includes('pdf')) {
            body.innerHTML = `<iframe src="${data.url}" style="width:100%;height:340px;border:0;"></iframe>`;
          } else {
            body.innerHTML = `<p>File type not previewable.<br><a href="${data.url}" target="_blank">Download/view</a></p>`;
          }
        } else {
          body.innerHTML = "Preview not available for this file.";
        }
      })
      .catch(() => body.innerHTML = "Preview failed to load.");
  }

  // close modal wiring
  const closeBtn = document.getElementById('closeModalBtn');
  if (closeBtn) {
    closeBtn.onclick = () => { const modal = document.getElementById('filePreviewModal'); if (modal) modal.style.display = 'none'; };
    window.addEventListener('click', (event) => { const modal = document.getElementById('filePreviewModal'); if (event.target === modal) modal.style.display = 'none'; });
  }

  const filesBtn = document.querySelector('[data-section="filesSection"]');
  if (filesBtn) filesBtn.addEventListener('click', loadMyFiles);

  // ---------- Applications module (Users + Admin) ----------
  // Kept largely the same as your existing implementation, but using the same style/guards:
  const applicationSection = document.getElementById('applicationSection');
  const facultyAppUpload = document.getElementById('facultyAppUpload');
  const adminAppsList = document.getElementById('adminAppsList');
  const applicationsTbody = document.getElementById('applications-tbody');
  const classScheduleContainer = document.getElementById('classScheduleContainer');

  if (document.getElementById('classCount')) {
    document.getElementById('classCount').addEventListener('input', function () {
      const count = parseInt(this.value) || 0;
      if (!classScheduleContainer) return;
      classScheduleContainer.innerHTML = '';
      for (let i = 1; i <= count; i++) {
        const div = document.createElement('div');
        div.classList.add('form-group');
        div.innerHTML = `
          <h4>Class ${i}</h4>
          <label>Subject Name:<input type="text" class="subject-name" required/></label>
          <label>Class Time:<input type="time" class="class-time" required/></label>
          <label>Date:<input type="date" class="class-date" required/></label>
          <label>Assigned Teacher:<input type="text" class="teacher-name" required/></label>
          <hr/>
        `;
        classScheduleContainer.appendChild(div);
      }
    });
  }

  if (document.getElementById('applicationForm')) {
    document.getElementById('applicationForm').addEventListener('submit', function (e) {
      e.preventDefault();
      const type = document.getElementById('applicationType').value;
      const title = document.getElementById('applicationTitle').value.trim();
      const details = document.getElementById('applicationDetails').value.trim();
      const startDate = document.getElementById('startDate').value;
      const endDate = document.getElementById('endDate').value;
      const classCount = parseInt(document.getElementById('classCount').value) || 0;
      const fileInputApp = document.getElementById('applicationFile');

      if (!type || !title || !details || !startDate || !endDate || classCount <= 0 || !fileInputApp.files.length) {
        alert('Fill in all required fields and attach your application file.');
        return;
      }

      const schedule = [];
      let ok = true;
      document.querySelectorAll('#classScheduleContainer > .form-group').forEach((div, idx) => {
        const subject = div.querySelector('.subject-name').value.trim();
        const time = div.querySelector('.class-time').value;
        const date = div.querySelector('.class-date').value;
        const teacher = div.querySelector('.teacher-name').value.trim();
        if (!subject || !time || !date || !teacher) { ok = false; alert(`Fill all fields for Class ${idx + 1}`); return; }
        schedule.push({ subject, time, date, teacher });
      });
      if (!ok) return;

      const fd = new FormData();
      fd.append('application_type', type);
      fd.append('application_title', title);
      fd.append('application_details', details);
      fd.append('start_date', startDate);
      fd.append('end_date', endDate);
      fd.append('class_count', classCount);
      fd.append('class_schedule', JSON.stringify(schedule));
      fd.append('application_document', fileInputApp.files[0]);

      fetch('../php/upload_application.php', { method: 'POST', body: fd })
        .then(res => res.json())
        .then(data => {
          if (data.status === 'success') {
            alert('Application uploaded!');
            this.reset();
            classScheduleContainer.innerHTML = '';
            loadUserApplications();
          } else alert('Upload failed: ' + (data.message || 'Unknown'));
        })
        .catch(() => alert('Server error.'));
    });
  }

  function loadUserApplications() {
    fetch('../php/list_applications.php')
      .then(res => res.json())
      .then(data => {
        const tbody = document.getElementById('user-applications-list');
        if (!tbody) return;
        if (data.status !== 'success' || !Array.isArray(data.applications) || data.applications.length === 0) {
          tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">No applications submitted yet.</td></tr>`;
          return;
        }
        tbody.innerHTML = data.applications.map(app => `
          <tr>
            <td>${escapeHtml(app.title)}</td>
            <td>${escapeHtml(app.application_type)}</td>
            <td>${escapeHtml(app.start_date)}</td>
            <td>${escapeHtml(app.end_date)}</td>
            <td><span class="${escapeHtml(app.status)}">${escapeHtml(app.status ? app.status.charAt(0).toUpperCase() + app.status.slice(1) : '')}</span></td>
            <td>${app.file ? `<a href="../upload_applications/${encodeURIComponent(app.file)}" target="_blank">View</a>` : '—'}</td>
          </tr>
        `).join('');
      })
      .catch(() => {/* ignore for now */});
  }

  // Admin applications list
  function loadAdminApplications() {
    fetch('../php/list_applications.php')
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') renderAdminApplications(Array.isArray(data.applications) ? data.applications : []);
        else if (applicationsTbody) applicationsTbody.innerHTML = `<tr><td colspan="5">${escapeHtml(data.message || '')}</td></tr>`;
      })
      .catch(() => { if (applicationsTbody) applicationsTbody.innerHTML = `<tr><td colspan="5">Server error</td></tr>`; });
  }

  function renderAdminApplications(apps) {
    if (!applicationsTbody) return;
    applicationsTbody.innerHTML = (!Array.isArray(apps) || apps.length === 0) ? `<tr><td colspan="5" style="text-align:center;">No pending applications</td></tr>` :
      apps.map(app => `
        <tr>
          <td>${escapeHtml(app.title)}</td>
          <td>${escapeHtml(app.application_type)}</td>
          <td>${escapeHtml(app.uploaded_by || '')}</td>
          <td><span class="${escapeHtml(app.status)}">${escapeHtml(app.status ? app.status.charAt(0).toUpperCase() + app.status.slice(1) : '')}</span></td>
          <td>
            ${app.file ? `<a href="../upload_applications/${encodeURIComponent(app.file)}" target="_blank" class="action-btn">View File</a>` : ''}
            ${app.status === 'pending' ? `<button class="action-btn accept" data-id="${escapeHtml(app.id)}">Accept</button> <button class="action-btn reject" data-id="${escapeHtml(app.id)}">Reject</button>` : ''}
          </td>
        </tr>
      `).join('');

    applicationsTbody.querySelectorAll('.accept').forEach(btn => btn.onclick = () => updateApplicationStatus(btn.dataset.id, 'accepted'));
    applicationsTbody.querySelectorAll('.reject').forEach(btn => btn.onclick = () => updateApplicationStatus(btn.dataset.id, 'rejected'));
  }

  function updateApplicationStatus(id, status) {
    fetch('../php/update_application_status.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status })
    }).then(r => r.json()).then(data => {
      if (data.status === 'success') loadAdminApplications();
      else alert('Failed: ' + (data.message || 'Unknown'));
    }).catch(() => alert('Server error.'));
  }

  // wire showing application section depending on role (your existing API provides role)
  const appTabBtn = document.querySelector('[data-section="applicationSection"]');
  if (appTabBtn) {
    appTabBtn.addEventListener('click', () => {
      fetch('../php/api.php')
        .then(res => res.json())
        .then(data => {
          if (data.status === 'success') {
            if (!applicationSection) return;
            applicationSection.style.display = '';
            if (data.role === 'admin') {
              if (adminAppsList) adminAppsList.style.display = '';
              if (facultyAppUpload) facultyAppUpload.style.display = 'none';
              loadAdminApplications();
            } else {
              if (facultyAppUpload) facultyAppUpload.style.display = '';
              if (adminAppsList) adminAppsList.style.display = 'none';
              loadUserApplications();
            }
          } else alert('User not authenticated');
        })
        .catch(() => alert('Failed to get role'));
    });
  }

  // initial load already called above
}); // end DOMContentLoaded
