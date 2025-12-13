/* dashboard.js - full updated */

/* ---------- helpers ---------- */
function formatSize(size) {
  if (!size || isNaN(size)) return "—";
  const num = Number(size);
  if (num >= 1024 * 1024) return (num / (1024 * 1024)).toFixed(1) + " MB";
  if (num >= 1024) return (num / 1024).toFixed(1) + " KB";
  return num + " B";
}

function escapeHtml(s) {
  if (s === null || s === undefined) return "";
  return String(s).replace(/[&<>"']/g, (m) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]
  ));
}

/* build absolute URL for Google Docs viewer (for Word) */
function buildGoogleDocsViewerUrl(relativePath) {
  const origin = window.location.origin;
  const base = window.location.pathname.replace(/\/html\/[^/]*$/, "/upload/");
  const abs = origin + base + encodeURIComponent(relativePath);
  return "https://docs.google.com/gview?embedded=1&url=" + encodeURIComponent(abs);
}

/* ---------- main ---------- */
document.addEventListener("DOMContentLoaded", () => {
  let searchInput, searchBtn, filterButtons, periodSelect;
  let docTypeBtn, docTypeMenuEl;
  let menuDocType = "";
  let menuDocTypeRaw = "";
  let barDocType = "";
  let allDocuments = [];
  let docTypeChart = null;

  const uploadForm = document.getElementById("uploadForm");
  const fileInput = document.getElementById("fileInput");
  const docNameInput = document.getElementById("docNameInput");
  const docUploadTypeInput = document.getElementById("docUploadTypeInput");
  const filePreviewArea = document.getElementById("filePreviewArea");
  const dropzone = document.querySelector(".upload-card");
  const docsTableBody = document.getElementById("docs-tbody");

  /* ---------- hide User Management for non-admins ---------- */
  const umSidebarLink = document.querySelector(
    '[data-section="userManagementSection"]'
  );
  const umSection = document.getElementById("userManagementSection");

  fetch("../php/api.php")
    .then((res) => res.json())
    .then((data) => {
      if (data.status === "success" && data.role !== "admin") {
        // hide sidebar link + section
        if (umSidebarLink) umSidebarLink.style.display = "none";
        if (umSection) umSection.style.display = "none";

        // if active section was User Management, move back to dashboard
        const active = localStorage.getItem("activeSection");
        if (active === "userManagementSection") {
          localStorage.setItem("activeSection", "dashboardSection");
          const evt = new CustomEvent("sectionChanged", {
            detail: { id: "dashboardSection" },
          });
          document.dispatchEvent(evt);
        }
      }
    })
    .catch(() => {
      // fail silently; backend should still enforce permissions
    });

      // ---------- Logout with confirm ----------
  const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => {
      showConfirm(
        "Are you sure you want to logout?",
        "Logout",
        "Confirm Logout",
        "danger"
    ).then((yes) => {
      if (!yes) return;

      fetch("../php/logout.php")
        .then(() => {
          localStorage.clear();
          showToast("Logged out successfully.", "success");

          setTimeout(() => {
            window.location.href = "login.html";
          }, 800);
        })
        .catch(() => {
          showToast("Server error while logging out.", "error");
        });
    });
  });
}

      // ---------- Toast helper ----------
  function showToast(message, type = "success") {
    const container = document.getElementById("toast-container");
    if (!container) {
      alert(message); // fallback if container missing
      return;
    }

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;

    let icon = "ℹ️";
    if (type === "success") icon = "✅";
    else if (type === "error") icon = "❌";
    else if (type === "warning") icon = "⚠️";

    toast.innerHTML = `
      <span class="toast-icon">${icon}</span>
      <span class="toast-message">${escapeHtml(message)}</span>
      <button class="toast-close" aria-label="Close">&times;</button>
    `;

    const close = () => {
      toast.classList.remove("show");
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 250);
    };

    toast.querySelector(".toast-close").addEventListener("click", close);

    container.appendChild(toast);

    // small timeout so CSS transition plays
    requestAnimationFrame(() => {
      toast.classList.add("show");
    });

    // auto-hide after 4 seconds
    setTimeout(close, 4000);
  }
  // ---------- Confirm dialog helper ----------
const confirmModal = document.getElementById("confirm-modal");
const confirmMsgEl = document.getElementById("confirm-message");
const confirmOkBtn = document.getElementById("confirm-ok");
const confirmCancelBtn = document.getElementById("confirm-cancel");
const confirmTitleEl = document.getElementById("confirm-title");
const confirmBackdrop = confirmModal
  ? confirmModal.querySelector(".confirm-backdrop")
  : null;

function showConfirm(
  message = "Are you sure?",
  okText = "OK",
  titleText = "Are you sure?",
  variant = "danger" // "danger" or "primary"
) {
  return new Promise((resolve) => {
    if (!confirmModal) {
      const result = window.confirm(message);
      resolve(result);
      return;
    }

    if (confirmTitleEl) confirmTitleEl.textContent = titleText;
    if (confirmMsgEl) confirmMsgEl.textContent = message;

    if (confirmOkBtn) {
      confirmOkBtn.textContent = okText;
      confirmOkBtn.classList.remove("danger", "primary");
      if (variant === "primary") {
        confirmOkBtn.classList.add("primary");
      } else {
        confirmOkBtn.classList.add("danger");
      }
    }

    confirmModal.classList.add("open");

    const cleanup = (result) => {
      confirmModal.classList.remove("open");
      confirmOkBtn.onclick = null;
      confirmCancelBtn.onclick = null;
      if (confirmBackdrop) confirmBackdrop.onclick = null;
      resolve(result);
    };

    confirmOkBtn.onclick = () => cleanup(true);
    confirmCancelBtn.onclick = () => cleanup(false);
    if (confirmBackdrop) confirmBackdrop.onclick = () => cleanup(false);
  });
}
  // ========== SIDEBAR SECTION SWITCHING WITH PERSISTENCE ==========
  /*  const sectionLinks = document.querySelectorAll(".sidebar nav a[data-section]");
  const sections = {
    dashboardSection: document.getElementById("dashboardSection"),
    analyticsSection: document.getElementById("analyticsSection"),
    filesSection: document.getElementById("filesSection"),
    applicationSection: document.getElementById("applicationSection"),
    userManagementSection: document.getElementById("userManagementSection"),
    settingsSection: document.getElementById("settingsSection"),
  };

  function showSection(id) {
    Object.keys(sections).forEach((key) => {
      if (!sections[key]) return;
      sections[key].style.display = key === id ? "block" : "none";
    });

    sectionLinks.forEach((link) => {
      link.classList.toggle("active", link.dataset.section === id);
    });

    localStorage.setItem("activeSection", id);
  }

  let savedSection = localStorage.getItem("activeSection");
  if (!savedSection || !sections[savedSection]) {
    savedSection = "dashboardSection";
  }
  showSection(savedSection);

  sectionLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const targetId = link.dataset.section;
      if (sections[targetId]) showSection(targetId);

      // trigger data loads when switching via sidebar
      if (targetId === "filesSection") loadMyFiles();
      if (targetId === "applicationSection" && appTabBtn) appTabBtn.click();
      if (targetId === "userManagementSection") loadUsers();
    });
  });

  // hide User Management link for non-admins
  fetch("../php/api.php")
    .then((res) => res.json())
    .then((data) => {
      if (data.status === "success" && data.role !== "admin") {
        const umLink = document.querySelector(
          '[data-section="userManagementSection"]'
        );
        if (umLink) umLink.style.display = "none";
        const active = localStorage.getItem("activeSection");
        if (active === "userManagementSection") {
          localStorage.setItem("activeSection", "dashboardSection");
          showSection("dashboardSection");
        }
      }
    })
    .catch(() => {});

  // auto-load if refreshed on certain sections
  if (savedSection === "filesSection") {
    loadMyFiles();
  } else if (savedSection === "applicationSection") {
    if (typeof appTabBtn !== "undefined" && appTabBtn) appTabBtn.click();
  } else if (savedSection === "userManagementSection") {
    loadUsers();
  }
*/
  // ---------- assign selectors ONCE ----------
  searchInput = document.querySelector('.search-row input[type="text"]');
  searchBtn = document.querySelector(".search-row .search-btn");
  filterButtons = document.querySelectorAll(".filter-group .filter");
  if (!filterButtons || filterButtons.length === 0)
    filterButtons = document.querySelectorAll(".filter-bar .filter");
  if (!filterButtons || filterButtons.length === 0)
    filterButtons = document.querySelectorAll(".filter");
  periodSelect =
    document.getElementById("periodSelect") ||
    document.querySelector(".period-select");
  docTypeBtn = document.getElementById("docTypeBtn");
  docTypeMenuEl = document.getElementById("docTypeMenu");

  // ---------- Upload preview + submit ----------
  if (fileInput) {
    fileInput.addEventListener("change", function () {
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
    uploadForm.addEventListener("submit", function (e) {
      e.preventDefault();
      if (
        !fileInput.files[0] ||
        !docNameInput.value.trim() ||
        !docUploadTypeInput.value
      ) {
        alert("Please fill all fields and select a file.");
        return;
      }
      const formData = new FormData();
      formData.append("document", fileInput.files[0]);
      formData.append("doc_name", docNameInput.value.trim());
      formData.append("category", docUploadTypeInput.value);

      fetch("../php/upload.php", { method: "POST", body: formData })
        .then((res) => res.json())
        .then((data) => {
          if (data.status === "success") {
            showToast("File uploaded successfully.", "success");
            uploadForm.reset();
            filePreviewArea.innerHTML = "";
            loadDocuments();
          } else {
            showToast("Upload failed: " + (data.message || "Unknown error"), "error");
          }
        })
        .catch(() => alert("Server error during upload."));
    });
  }

  // ---------- Drag & Drop ----------
  if (dropzone) {
    dropzone.addEventListener("dragover", (e) => {
      e.preventDefault();
      dropzone.classList.add("dragover");
    });
    dropzone.addEventListener("dragleave", () =>
      dropzone.classList.remove("dragover")
    );
    dropzone.addEventListener("drop", (e) => {
      e.preventDefault();
      dropzone.classList.remove("dragover");
      if (e.dataTransfer.files.length) {
        fileInput.files = e.dataTransfer.files;
        fileInput.dispatchEvent(new Event("change"));
      }
    });
  }

  // ---------- Analytics ----------
  function updateAnalytics(docs) {
    const dataArray = Array.isArray(docs) ? docs : [];

    const totalEl = document.getElementById("kpiTotalDocs");
    const monthEl = document.getElementById("kpiThisMonth");
    const topLabelEl = document.getElementById("kpiTopCategory");
    const topCountEl = document.getElementById("kpiTopCategoryCount");

    const now = new Date();
    const totalDocs = dataArray.length;

    const docsThisMonth = dataArray.filter((doc) => {
      if (!doc.uploaded_at) return false;
      const ts = String(doc.uploaded_at).replace(" ", "T");
      const d = new Date(ts);
      if (isNaN(d.getTime())) return false;
      return (
        d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      );
    }).length;

    const countsMap = {};
    dataArray.forEach((doc) => {
      let cat =
        (doc.category && String(doc.category).trim()) ||
        (doc.doc_type && String(doc.doc_type).trim()) ||
        "Uncategorized";
      if (!cat) cat = "Uncategorized";
      countsMap[cat] = (countsMap[cat] || 0) + 1;
    });

    const labels = Object.keys(countsMap);
    const values = Object.values(countsMap);

    let topCategory = "—";
    let topCount = 0;
    labels.forEach((label) => {
      const val = countsMap[label];
      if (val > topCount) {
        topCount = val;
        topCategory = label;
      }
    });

    if (totalEl) totalEl.textContent = totalDocs.toString();
    if (monthEl) monthEl.textContent = docsThisMonth.toString();
    if (topLabelEl) topLabelEl.textContent = labels.length ? topCategory : "—";
    if (topCountEl)
      topCountEl.textContent = labels.length
        ? `${topCount} document${topCount === 1 ? "" : "s"}`
        : "No documents";

    const canvas = document.getElementById("docTypeChart");
    if (!canvas || !window.Chart) return;

    if (!labels.length) {
      if (docTypeChart) {
        docTypeChart.destroy();
        docTypeChart = null;
      }
      return;
    }

    const ctx = canvas.getContext("2d");

    if (docTypeChart) {
      docTypeChart.data.labels = labels;
      docTypeChart.data.datasets[0].data = values;
      docTypeChart.update();
    } else {
      docTypeChart = new Chart(ctx, {
        type: "bar",
        data: {
          labels,
          datasets: [
            {
              label: "Documents",
              data: values,
              borderRadius: 10,
              barThickness: 45,
              backgroundColor: (chartCtx) => {
                const g = chartCtx.chart.ctx.createLinearGradient(
                  0,
                  0,
                  0,
                  250
                );
                g.addColorStop(0, "#6366F1");
                g.addColorStop(1, "#E0E7FF");
                return g;
              },
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            title: {
              display: true,
              text: "Documents by type",
              font: { size: 16, family: "Poppins", weight: "600" },
              color: "#111827",
            },
            tooltip: {
              padding: 10,
              backgroundColor: "rgba(15, 23, 42, 0.9)",
              titleFont: { size: 12, weight: "600" },
              bodyFont: { size: 11 },
              cornerRadius: 10,
            },
          },
          scales: {
            x: {
              ticks: { font: { size: 12 }, color: "#374151" },
              grid: { display: false },
            },
            y: {
              beginAtZero: true,
              ticks: {
                stepSize: 1,
                color: "#6B7280",
                font: { size: 12 },
              },
              grid: {
                color: "rgba(209,213,219,0.3)",
                drawBorder: false,
              },
            },
          },
        },
      });
    }
  }

  // ---------- Documents load/render ----------
  function loadDocuments() {
    fetch("../php/list_documents.php")
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success") {
          allDocuments = Array.isArray(data.documents) ? data.documents : [];
          renderDocuments(allDocuments);
          updatePreCategorizedCount();
          updateAnalytics(allDocuments);
        } else {
          docsTableBody.innerHTML = `<tr><td colspan="8" style="color:red">${escapeHtml(
            data.message || "Error"
          )}</td></tr>`;
        }
      })
      .catch(() => {
        docsTableBody.innerHTML =
          '<tr><td colspan="8" style="color:red">Server error loading documents.</td></tr>';
      });
  }

  function renderDocuments(documents) {
  if (!Array.isArray(documents) || documents.length === 0) {
    docsTableBody.innerHTML =
      '<tr><td colspan="7" style="text-align:center;">No documents found.</td></tr>';
    return;
  }

  docsTableBody.innerHTML = documents
    .map((doc, index) => {
      const typeValue = doc.category || doc.doc_type || "—";
      const categoryValue = doc.category || "-";
      return `
      <tr>
        <td>${index + 1}</td>
        <td>${escapeHtml(doc.doc_name ? doc.doc_name : doc.filename)}</td>
        <td><span class="doc-type">${escapeHtml(typeValue)}</span></td>
        <td>${formatSize(doc.size)}</td>
        <td>${escapeHtml(doc.uploaded_by || "—")}</td>
        <td>${escapeHtml(categoryValue)}</td>
        <td>
          <button class="action-btn download" data-id="${escapeHtml(
            doc.id
          )}" title="Download">⬇️</button>
          <button class="action-btn delete" data-id="${escapeHtml(
            doc.id
          )}" title="Delete">🗑️</button>
        </td>
      </tr>
      `;
    })
    .join("");

    docsTableBody.querySelectorAll(".download").forEach((btn) => {
      btn.onclick = () =>
        (window.location = `../php/download.php?id=${encodeURIComponent(
          btn.dataset.id
        )}`);
    });
    docsTableBody.querySelectorAll(".delete").forEach((btn) => {
  btn.onclick = () => {
    showConfirm(
      "Delete this document?",
      "Delete",
      "Delete Document",
      "danger"
    ).then((yes) => {
      if (yes) deleteDocument(btn.dataset.id);
    });
  };
});
}

  function deleteDocument(id) {
    fetch(`../php/delete_documents.php?id=${encodeURIComponent(id)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success") {
          showToast("Document deleted.", "success");
          loadDocuments();
        } else {
          showToast("Failed to delete: " + (data.message || "Unknown"), "error");
        }
      })
      .catch(() => alert("Server error during delete."));
  }

  // ---------- Filters ----------
  function attachPillFilters() {
    let pills = Array.from(filterButtons || []);
    if (!pills.length)
      pills = Array.from(
        document.querySelectorAll(
          ".filter-group .filter, .filter-bar .filter, .filter"
        )
      );

    pills.forEach((btn) => {
      if (btn.__hasListener) return;
      btn.__hasListener = true;
      btn.addEventListener("click", () => {
        pills.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        barDocType = btn.dataset && btn.dataset.filter ? btn.dataset.filter : "";
        barDocType = barDocType === "all" ? "" : barDocType;
        menuDocType = "";
        menuDocTypeRaw = "";
        if (docTypeBtn) docTypeBtn.textContent = "Document Type ▼";
        if (docTypeMenuEl) docTypeMenuEl.style.display = "none";
        applyFilters();
      });
    });
  }

  function attachDocTypeHandlers() {
    if (docTypeBtn && docTypeMenuEl && !docTypeBtn.__attached) {
      docTypeBtn.__attached = true;
      docTypeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const open = docTypeMenuEl.style.display === "block";
        docTypeMenuEl.style.display = open ? "none" : "block";
      });
      document.addEventListener("click", (e) => {
        if (
          docTypeMenuEl &&
          !docTypeMenuEl.contains(e.target) &&
          e.target !== docTypeBtn
        ) {
          docTypeMenuEl.style.display = "none";
        }
      });
    }

    if (docTypeMenuEl) {
      docTypeMenuEl.querySelectorAll(".doc-menu-item").forEach((item) => {
        if (item.__menuListener) return;
        item.__menuListener = true;
        item.addEventListener("click", () => {
          const raw = (item.getAttribute("data-type") || "").trim();
          menuDocTypeRaw = raw;
          menuDocType = raw.toLowerCase();
          docTypeMenuEl
            .querySelectorAll(".doc-menu-item")
            .forEach((i) => i.classList.remove("active"));
          item.classList.add("active");
          if (docTypeBtn) {
            docTypeBtn.textContent =
              menuDocType && menuDocType !== "all"
                ? `${menuDocTypeRaw} ▼`
                : "Document Type ▼";
          }
          const pills = document.querySelectorAll(
            ".filter-group .filter, .filter-bar .filter, .filter"
          );
          pills.forEach((p) => p.classList.remove("active"));
          barDocType = "";
          docTypeMenuEl.style.display = "none";
          applyFilters();
        });
      });
    }
  }

  function applyFilters() {
    let filtered = Array.isArray(allDocuments) ? allDocuments.slice() : [];

    const searchText =
      searchInput && searchInput.value
        ? searchInput.value.trim().toLowerCase()
        : "";
    const period =
      periodSelect && periodSelect.value ? periodSelect.value : "all";

    if (searchText) {
      filtered = filtered.filter((doc) => {
        const combined = `${doc.filename || ""} ${
          doc.doc_name || ""
        }`.toLowerCase();
        return combined.includes(searchText);
      });
    }

    if (barDocType && barDocType !== "") {
      if (barDocType === "Pre-categorized") {
        filtered = filtered.filter(
          (doc) => doc.pre_categorized == "1" || doc.pre_categorized === true
        );
      } else {
        filtered = filtered.filter((doc) => {
          const cat = (doc.category || doc.doc_type || "")
            .toString()
            .trim()
            .toLowerCase();
          const target = barDocType.toString().trim().toLowerCase();
          return cat === target;
        });
      }
    }

    if (menuDocType && menuDocType !== "" && menuDocType !== "all") {
      filtered = filtered.filter((doc) => {
        const cat = (doc.category || doc.doc_type || "")
          .toString()
          .trim()
          .toLowerCase();
        return cat === menuDocType;
      });
    }

    if (period !== "all" && filtered.length > 0) {
      const now = new Date();
      filtered = filtered.filter((doc) => {
        if (!doc.uploaded_at) return false;
        const uploadedDate = new Date(
          String(doc.uploaded_at).replace(" ", "T")
        );
        if (isNaN(uploadedDate.getTime())) return false;
        if (period === "7days") {
          const sevenDaysAgo = new Date(now);
          sevenDaysAgo.setDate(now.getDate() - 7);
          return uploadedDate > sevenDaysAgo;
        }
        if (period === "month") {
          return (
            uploadedDate.getMonth() === now.getMonth() &&
            uploadedDate.getFullYear() === now.getFullYear()
          );
        }
        return true;
      });
    }

    renderDocuments(filtered);
  }

  if (searchBtn) searchBtn.addEventListener("click", applyFilters);
  if (searchInput)
    searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") applyFilters();
    });
  if (periodSelect)
    periodSelect.addEventListener("change", applyFilters);

  attachPillFilters();
  attachDocTypeHandlers();
  loadDocuments();

  function updatePreCategorizedCount() {
    const el = document.querySelector(
      '.filter-group .filter[data-filter="Pre-categorized"] .count'
    );
    if (!el) return;
    const count = Array.isArray(allDocuments)
      ? allDocuments.filter(
          (d) => d.pre_categorized == "1" || d.pre_categorized === true
        ).length
      : 0;
    el.textContent = count;
  }

  // ---------- My Files section ----------
  function loadMyFiles() {
    fetch("../php/list_documents.php")
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success") {
          renderMyFiles(Array.isArray(data.documents) ? data.documents : []);
        } else {
          const tbody = document.getElementById("myfiles-tbody");
          if (tbody)
            tbody.innerHTML = `<tr><td colspan="6" style="color:red">${escapeHtml(
              data.message || "Error"
            )}</td></tr>`;
        }
      })
      .catch(() => {
        const tbody = document.getElementById("myfiles-tbody");
        if (tbody)
          tbody.innerHTML =
            '<tr><td colspan="6" style="color:red">Server error loading files.</td></tr>';
      });
  }

  function renderMyFiles(documents) {
  const tbody = document.getElementById("myfiles-tbody");
  if (!tbody) return;
  if (!Array.isArray(documents) || documents.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="6" style="text-align:center;">No files found.</td></tr>';
    return;
  }

  tbody.innerHTML = documents
    .map((doc, index) => {
      const typeValue = doc.category || doc.doc_type || "—";
      const fp = doc.filepath || "";
      const lower = fp.toLowerCase();

      let viewHref;
      if (
        lower.endsWith(".pdf") ||
        lower.endsWith(".png") ||
        lower.endsWith(".jpg") ||
        lower.endsWith(".jpeg") ||
        lower.endsWith(".gif") ||
        lower.endsWith(".webp")
      ) {
        viewHref = `../upload/${encodeURIComponent(fp)}`;
      } else if (lower.endsWith(".doc") || lower.endsWith(".docx")) {
        viewHref = buildGoogleDocsViewerUrl(fp);
      } else {
        viewHref = `../upload/${encodeURIComponent(fp)}`;
      }

      return `
        <tr>
          <td>${index + 1}</td>
          <td>${escapeHtml(doc.doc_name || doc.filename)}</td>
          <td><span class="doc-type">${escapeHtml(typeValue)}</span></td>
          <td>${formatSize(doc.size)}</td>
          <td>${escapeHtml(doc.uploaded_by || "—")}</td>
          <td>
            <a href="${viewHref}" target="_blank" class="action-btn" title="Open in new tab">👁️</a>
            <button class="action-btn download" data-id="${escapeHtml(
              doc.id
            )}">⬇️</button>
            <button class="action-btn delete" data-id="${escapeHtml(
              doc.id
            )}">🗑️</button>
          </td>
        </tr>
      `;
    })
    .join("");

    tbody.querySelectorAll(".download").forEach((btn) => {
      btn.onclick = () =>
        (window.location = `../php/download.php?id=${encodeURIComponent(
          btn.dataset.id
        )}`);
    });
    tbody.querySelectorAll(".delete").forEach((btn) => {
  btn.onclick = () => {
    showConfirm(
      "Delete this document?",
      "Delete",
      "Delete Document",
      "danger"
    ).then((yes) => {
      if (yes) deleteDocument(btn.dataset.id);
    });
  };
});

}

  const closeBtn = document.getElementById("closeModalBtn");
  if (closeBtn) {
    closeBtn.onclick = () => {
      const modal = document.getElementById("filePreviewModal");
      if (modal) modal.style.display = "none";
    };
    window.addEventListener("click", (event) => {
      const modal = document.getElementById("filePreviewModal");
      if (event.target === modal) modal.style.display = "none";
    });
  }

  const filesBtn = document.querySelector('[data-section="filesSection"]');
  if (filesBtn) filesBtn.addEventListener("click", loadMyFiles);

  // ---------- Applications module ----------
  const applicationSection = document.getElementById("applicationSection");
  const facultyAppUpload = document.getElementById("facultyAppUpload");
  const adminAppsList = document.getElementById("adminAppsList");
  const applicationsTbody = document.getElementById("applications-tbody");
  const classScheduleContainer = document.getElementById(
    "classScheduleContainer"
  );
  const applicationTypeSelect = document.getElementById("applicationType");
  const leaveOnlyFields = document.querySelectorAll(".leave-only");

  function toggleLeaveFields() {
    const typeVal = applicationTypeSelect ? applicationTypeSelect.value : "";
    const isLeave =
      typeVal === "Leave" || typeVal === "Leave Application";

    leaveOnlyFields.forEach((group) => {
      if (!group) return;
      group.style.display = isLeave ? "" : "none";
      group
        .querySelectorAll("input, select, textarea")
        .forEach((el) => {
          if (["startDate", "endDate", "classCount"].includes(el.id)) {
            if (isLeave) {
              el.setAttribute("required", "required");
            } else {
              el.removeAttribute("required");
              el.value = "";
            }
          }
        });
    });

    if (!isLeave && classScheduleContainer) {
      classScheduleContainer.innerHTML = "";
    }
  }

  if (applicationTypeSelect) {
    toggleLeaveFields();
    applicationTypeSelect.addEventListener("change", toggleLeaveFields);
  }

  if (document.getElementById("classCount")) {
    document
      .getElementById("classCount")
      .addEventListener("input", function () {
        const count = parseInt(this.value) || 0;
        if (!classScheduleContainer) return;
        classScheduleContainer.innerHTML = "";
        for (let i = 1; i <= count; i++) {
          const div = document.createElement("div");
          div.classList.add("form-group");
          div.innerHTML = `
          <h4>Class ${i}</h4>

          <label>Class Name:
            <input type="text" class="class-name" required />
          </label>

          <label>Section:
            <input type="text" class="class-section" required />
          </label>

          <label>Subject Name:
            <input type="text" class="subject-name" required />
          </label>

          <label>Class Time:
            <input type="time" class="class-time" required />
          </label>

          <label>Date:
            <input type="date" class="class-date" required />
          </label>

          <label>Assigned Teacher:
            <input type="text" class="teacher-name" required />
          </label>

          <hr/>
        `;
          classScheduleContainer.appendChild(div);
        }
      });
  }

 if (document.getElementById("applicationForm")) {
  document
    .getElementById("applicationForm")
    .addEventListener("submit", async function (e) {
      e.preventDefault();

      const type = applicationTypeSelect ? applicationTypeSelect.value : "";
      const isLeave = type === "Leave" || type === "Leave Application";

      const title = document.getElementById("applicationTitle").value.trim();
      const details = document.getElementById("applicationDetails").value.trim();
      const fileInputApp = document.getElementById("applicationFile");
      // e.g. 100 MB limit on front-end
const MAX_SIZE_BYTES = 100 * 1024 * 1024;
if (fileInputApp.files[0].size > MAX_SIZE_BYTES) {
  alert("File is too large. Please upload a file smaller than 100 MB.");
  return;
}


      const startDateEl = document.getElementById("startDate");
      const endDateEl = document.getElementById("endDate");
      const classCountEl = document.getElementById("classCount");

      let startDate = "";
      let endDate = "";
      let classCount = 0;
      let schedule = [];

      // basic validation
      if (!type || !title || !details || !fileInputApp.files.length) {
        alert("Fill in all required fields and attach your application file.");
        return;
      }

      if (isLeave) {
        startDate = startDateEl ? startDateEl.value : "";
        endDate = endDateEl ? endDateEl.value : "";
        classCount = classCountEl ? parseInt(classCountEl.value) || 0 : 0;

        if (!startDate || !endDate || classCount <= 0) {
          alert(
            "For a Leave Application, please fill Start Date, End Date and Number of classes."
          );
          return;
        }

        let ok = true;
        document
          .querySelectorAll("#classScheduleContainer > .form-group")
          .forEach((div, idx) => {
            const className = div.querySelector(".class-name").value.trim();
            const section = div.querySelector(".class-section").value.trim();
            const subject = div.querySelector(".subject-name").value.trim();
            const time = div.querySelector(".class-time").value;
            const date = div.querySelector(".class-date").value;
            const teacher = div.querySelector(".teacher-name").value.trim();

            if (!className || !section || !subject || !time || !date || !teacher) {
              ok = false;
              alert(`Fill all fields for Class ${idx + 1}`);
              return;
            }

            schedule.push({
              className,
              section,
              subject,
              time,
              date,
              teacher,
            });
          });

        if (!ok) return;
      }

      const fd = new FormData();
      fd.append("application_type", type);
      fd.append("application_title", title);
      fd.append("application_details", details);
      fd.append("start_date", startDate);
      fd.append("end_date", endDate);
      fd.append("class_count", classCount);
      fd.append("class_schedule", JSON.stringify(schedule));
      fd.append("application_document", fileInputApp.files[0]);

      try {
        const res = await fetch("../php/upload_application.php", {
          method: "POST",
          body: fd,
        });

        const raw = await res.text();
        console.log("upload_application.php raw response:", raw);

        let data;
        try {
          data = JSON.parse(raw);
        } catch (err) {
          alert("Server returned invalid JSON:\n\n" + raw);
          return;
        }

        if (data.status === "success") {
          const appData = {
            application_type: type,
            application_title: title,
            application_details: details,
            start_date: startDate,
            end_date: endDate,
            class_count: classCount,
            class_schedule: schedule,
          };

          const usernameForApp = window.CURRENT_USER || "Faculty Member";

          sessionStorage.setItem("applicationData", JSON.stringify(appData));
          sessionStorage.setItem("applicationUsername", usernameForApp);

          window.location.href = "application-confirmation.html";
        } else {
          alert("Upload failed: " + (data.message || "Unknown error"));
        }
      } catch (err) {
        alert("Network / server error: " + err.message);
      }
    });
}

  function loadUserApplications() {
    fetch("../php/list_applications.php")
      .then((res) => res.json())
      .then((data) => {
        const tbody = document.getElementById("user-applications-list");
        if (!tbody) return;

        if (
          data.status !== "success" ||
          !Array.isArray(data.applications) ||
          data.applications.length === 0
        ) {
          // now we have 5 columns in the header
          tbody.innerHTML =
            '<tr><td colspan="5" style="text-align:center;">No applications submitted yet.</td></tr>';
          return;
        }

        tbody.innerHTML = data.applications
          .map((app) => {
            // try multiple possible field names for submission date
            const submitted =
              app.submission_date ||
              app.submitted_at ||
              app.created_at ||
              app.uploaded_at ||
              "";

            return `
            <tr>
              <td>${escapeHtml(app.title)}</td>
              <td>${escapeHtml(app.application_type)}</td>
              <td>${escapeHtml(submitted)}</td>
              <td>
                <span class="${escapeHtml(app.status)}">
                  ${escapeHtml(
                    app.status
                      ? app.status.charAt(0).toUpperCase() +
                          app.status.slice(1)
                      : ""
                  )}
                </span>
              </td>
              <td>${
                app.file
                  ? `<a href="../upload_applications/${encodeURIComponent(
                      app.file
                    )}" target="_blank">View</a>`
                  : "—"
              }</td>
            </tr>
          `;
          })
          .join("");
      })
      .catch(() => {});
  }

  function loadAdminApplications() {
    fetch("../php/list_applications.php")
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success")
          renderAdminApplications(
            Array.isArray(data.applications) ? data.applications : []
          );
        else if (applicationsTbody)
          applicationsTbody.innerHTML = `<tr><td colspan="5">${escapeHtml(
            data.message || ""
          )}</td></tr>`;
      })
      .catch(() => {
        if (applicationsTbody)
          applicationsTbody.innerHTML =
            '<tr><td colspan="5">Server error</td></tr>';
      });
  }

  function renderAdminApplications(apps) {
    if (!applicationsTbody) return;
    applicationsTbody.innerHTML =
      !Array.isArray(apps) || apps.length === 0
        ? '<tr><td colspan="5" style="text-align:center;">No pending applications</td></tr>'
        : apps
            .map(
              (app) => `
      <tr>
        <td>${escapeHtml(app.title)}</td>
        <td>${escapeHtml(app.application_type)}</td>
        <td>${escapeHtml(app.uploaded_by || "")}</td>
        <td><span class="${escapeHtml(
          app.status
        )}">${escapeHtml(
                app.status
                  ? app.status.charAt(0).toUpperCase() +
                      app.status.slice(1)
                  : ""
              )}</span></td>
        <td>
          ${
            app.file
              ? `<a href="../upload_applications/${encodeURIComponent(
                  app.file
                )}" target="_blank" class="action-btn">View File</a>`
              : ""
          }
          ${
            app.status === "pending"
              ? `<button class="action-btn accept" data-id="${escapeHtml(
                  app.id
                )}">Accept</button>
                 <button class="action-btn reject" data-id="${escapeHtml(
                   app.id
                 )}">Reject</button>`
              : ""
          }
        </td>
      </tr>
    `
            )
            .join("");

    applicationsTbody.querySelectorAll(".accept").forEach((btn) => {
      btn.onclick = () => updateApplicationStatus(btn.dataset.id, "accepted");
    });
    applicationsTbody.querySelectorAll(".reject").forEach((btn) => {
      btn.onclick = () => updateApplicationStatus(btn.dataset.id, "rejected");
    });
  }

  function updateApplicationStatus(id, status) {
    fetch("../php/update_application_status.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.status === "success") loadAdminApplications();
        else alert("Failed: " + (data.message || "Unknown"));
      })
      .catch(() => alert("Server error."));
  }

  const appTabBtn = document.querySelector(
    '[data-section="applicationSection"]'
  );
  if (appTabBtn) {
    appTabBtn.addEventListener("click", () => {
      fetch("../php/api.php")
        .then((res) => res.json())
        .then((data) => {
          if (data.status === "success") {
            if (!applicationSection) return;
            applicationSection.style.display = "block";
            if (data.role === "admin") {
              if (adminAppsList) adminAppsList.style.display = "block";
              if (facultyAppUpload) facultyAppUpload.style.display = "none";
              loadAdminApplications();
            } else {
              if (facultyAppUpload) facultyAppUpload.style.display = "block";
              if (adminAppsList) adminAppsList.style.display = "none";
              loadUserApplications();
            }
          } else alert("User not authenticated");
        })
        .catch(() => alert("Failed to get role"));
    });
  }

    // ========== USER MANAGEMENT (Admin) ==========
  const userMgmtSection = document.getElementById("userManagementSection");
  const usersTbody = document.getElementById("users-tbody");
  const userForm = document.getElementById("userForm");
  const userIdInput = document.getElementById("userId");
  const userFullNameInput = document.getElementById("userFullName");
  const userUsernameInput = document.getElementById("userUsername");
  const userEmailInput = document.getElementById("userEmail");
  const userRoleSelect = document.getElementById("userRole");
  const userPasswordInput = document.getElementById("userPassword");
  const userFormResetBtn = document.getElementById("userFormReset");

  function loadUsers() {
    if (!usersTbody) return;

    fetch("../php/user_management.php?action=list")
      .then((res) => res.json())
      .then((data) => {
        if (data.status !== "success" || !Array.isArray(data.users)) {
          usersTbody.innerHTML =
            '<tr><td colspan="5" style="text-align:center;">No users found.</td></tr>';
          return;
        }

        usersTbody.innerHTML = data.users
          .map(
            (u) => `
          <tr>
            <td>${escapeHtml(u.username)}</td>
            <td>${escapeHtml(u.fullname || "")}</td>
            <td>${escapeHtml(u.email || "")}</td>
            <td>${escapeHtml(u.role || "")}</td>
            <td>
              <button class="action-btn edit-user" data-id="${escapeHtml(
                u.id
              )}">Edit</button>
              <button class="action-btn reject delete-user" data-id="${escapeHtml(
                u.id
              )}">Delete</button>
            </td>
          </tr>
        `
          )
          .join("");

        // attach edit handlers
        usersTbody.querySelectorAll(".edit-user").forEach((btn) => {
          btn.onclick = () => {
            const id = btn.dataset.id;
            const u = data.users.find((x) => String(x.id) === String(id));
            if (!u) return;
            userIdInput.value = u.id;
            userFullNameInput.value = u.fullname || "";
            userUsernameInput.value = u.username || "";
            userEmailInput.value = u.email || "";
            userRoleSelect.value = u.role || "faculty";
            userPasswordInput.value = "";
          };
        });

        // attach delete handlers with custom confirm
        usersTbody.querySelectorAll(".delete-user").forEach((btn) => {
          btn.onclick = () => {
            showConfirm(
              "Delete this user?",
              "Delete",
              "Delete User",
              "danger"
          ).then((yes) => {
            if (!yes) return;
              fetch("../php/user_management.php?action=delete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: btn.dataset.id }),
              })
                .then((r) => r.json())
                .then((d) => {
                  if (d.status === "success") {
                    showToast("User deleted.", "success");
                    loadUsers();
                  } else {
                    showToast(
                      "Failed to delete user: " +
                        (d.message || "Unknown error"),
                      "error"
                    );
                  }
                })
                .catch(() =>
                  showToast("Server error while deleting user.", "error")
                );
            });
          };
        });
      })
      .catch(() => {
        usersTbody.innerHTML =
          '<tr><td colspan="5" style="text-align:center;">Error loading users.</td></tr>';
      });
  }

  const umLink = document.querySelector(
    '[data-section="userManagementSection"]'
  );
  if (umLink) {
    umLink.addEventListener("click", () => {
      loadUsers();
    });
  }

  if (userForm) {
    userForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const payload = {
        id: userIdInput.value || null,
        fullname: userFullNameInput.value.trim(),
        username: userUsernameInput.value.trim(),
        email: userEmailInput.value.trim(),
        role: userRoleSelect.value,
        password: userPasswordInput.value,
      };

      if (!payload.fullname || !payload.username || !payload.email) {
        showToast("Full name, username and email are required.", "warning");
        return;
      }

      fetch("../php/user_management.php?action=save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
        .then((r) => r.json())
        .then((d) => {
          if (d.status === "success") {
            showToast("User saved successfully.", "success");
            userForm.reset();
            userIdInput.value = "";
            loadUsers();
          } else {
            showToast(
              "Failed to save user: " + (d.message || "Unknown error"),
              "error"
            );
          }
        })
        .catch(() =>
          showToast("Server error while saving user.", "error")
        );
    });

    if (userFormResetBtn) {
      userFormResetBtn.addEventListener("click", () => {
        userForm.reset();
        userIdInput.value = "";
      });
    }
  }

  // ========== SETTINGS MODULE ==========
  const profileForm = document.getElementById("editProfileForm");
  const profileNameInput = document.getElementById("profileName");
  const profileUsernameInput = document.getElementById("profileUsername");
  const profileEmailInput = document.getElementById("profileEmail");
  const profilePicInput = document.getElementById("profilePic");
  const profileAvatarPreview = document.getElementById("profileAvatarPreview");

  const profileEditBtn = document.getElementById("profileEditBtn");
  const profileSaveBtn = document.getElementById("profileSaveBtn");
  const profileCancelBtn = document.getElementById("profileCancelBtn");
  const profileCard = document.querySelector(".settings-profile");

  const securityForm = document.getElementById("changePasswordForm");
  const securityEditBtn = document.getElementById("securityEditBtn");
  const securitySaveBtn = document.getElementById("securitySaveBtn");
  const securityCancelBtn = document.getElementById("securityCancelBtn");
  const securityCard = document.querySelector(".settings-security");

  const prefsEditBtn = document.getElementById("prefsEditBtn");
  const prefsSaveBtn = document.getElementById("prefsSaveBtn");
  const prefsCancelBtn = document.getElementById("prefsCancelBtn");
  const prefsCard = document.querySelector(".settings-preferences");

  function setInputsDisabled(container, disabled) {
    if (!container) return;
    container.querySelectorAll("input").forEach((inp) => {
      if (inp.id === "profileUsername") return;
      inp.disabled = disabled;
    });
  }

  /* PROFILE */
  if (profileForm) {
    const currentProfile = {
      full_name: "",
      username: "",
      email: "",
      avatar_url: "",
    };

    function applyProfileToUI() {
      if (profileUsernameInput)
        profileUsernameInput.value = currentProfile.username || "";
      if (profileNameInput)
        profileNameInput.value = currentProfile.full_name || "";
      if (profileEmailInput)
        profileEmailInput.value = currentProfile.email || "";
      if (profileAvatarPreview && currentProfile.avatar_url) {
        profileAvatarPreview.src = currentProfile.avatar_url;
      }
    }

    function loadProfileFromServer() {
      return fetch("../php/api.php")
        .then((res) => res.json())
        .then((data) => {
          if (data.status !== "success") return;
          currentProfile.username = data.username || "";
          currentProfile.full_name =
            data.full_name || currentProfile.username;
          currentProfile.email = data.email || "";
          if (data.avatar_url) currentProfile.avatar_url = data.avatar_url;
          applyProfileToUI();
        })
        .catch((err) => console.error("Profile load failed", err));
    }

    function setProfileEditing(on) {
      setInputsDisabled(profileCard, !on);
      if (profilePicInput) profilePicInput.disabled = !on;
      if (profileCard) profileCard.classList.toggle("editing", on);
      if (profileEditBtn) profileEditBtn.style.display = on ? "none" : "";
      if (profileSaveBtn) profileSaveBtn.style.display = on ? "" : "none";
      if (profileCancelBtn)
        profileCancelBtn.style.display = on ? "" : "none";
    }

    setProfileEditing(false);
    loadProfileFromServer();

    if (profilePicInput && profileAvatarPreview) {
      profilePicInput.addEventListener("change", () => {
        const file = profilePicInput.files && profilePicInput.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
          profileAvatarPreview.src = e.target.result;
        };
        reader.readAsDataURL(file);
      });
    }

    if (profileEditBtn) {
      profileEditBtn.addEventListener("click", () => setProfileEditing(true));
    }

    if (profileCancelBtn) {
      profileCancelBtn.addEventListener("click", () => {
        if (profilePicInput) profilePicInput.value = "";
        loadProfileFromServer();
        setProfileEditing(false);
      });
    }

    if (profileSaveBtn) {
      profileSaveBtn.addEventListener("click", () => {
        const fd = new FormData();
        fd.append("full_name", (profileNameInput?.value || "").trim());
        fd.append("email", (profileEmailInput?.value || "").trim());
        if (profilePicInput && profilePicInput.files[0]) {
          fd.append("avatar", profilePicInput.files[0]);
        }

        fetch("../php/update_profile.php", {
          method: "POST",
          body: fd,
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.status === "success") {
              showToast("Profile updated successfully.", "success");
              currentProfile.full_name =
                (profileNameInput?.value || "").trim();
              currentProfile.email =
                (profileEmailInput?.value || "").trim();
              if (data.avatar_url) currentProfile.avatar_url = data.avatar_url;
              applyProfileToUI();
              setProfileEditing(false);
              const headerNameEl = document.querySelector(".user-name");
              const helloEl = document.getElementById("helloUser");
              const displayName =
                currentProfile.full_name || currentProfile.username;
              if (headerNameEl) headerNameEl.textContent = displayName;
              if (helloEl) helloEl.textContent = "Hello " + displayName;
            } else {
              showToast("Profile update failed: " + (data.message || "Unknown error"), "error");
            }
          })
          .catch(() => alert("Server error while updating profile."));
      });
    }
  }

  /* SECURITY */
  if (securityForm) {
    function setSecurityEditing(on) {
      setInputsDisabled(securityCard, !on);
      if (securityCard) securityCard.classList.toggle("editing", on);
      if (securityEditBtn) securityEditBtn.style.display = on ? "none" : "";
      if (securitySaveBtn) securitySaveBtn.style.display = on ? "" : "none";
      if (securityCancelBtn)
        securityCancelBtn.style.display = on ? "" : "none";
    }

    setSecurityEditing(false);

    if (securityEditBtn) {
      securityEditBtn.addEventListener("click", () =>
        setSecurityEditing(true)
      );
    }

    if (securityCancelBtn) {
      securityCancelBtn.addEventListener("click", () => {
        securityForm.reset();
        setSecurityEditing(false);
      });
    }

    if (securitySaveBtn) {
      securitySaveBtn.addEventListener("click", () => {
        const currentPw =
          document.getElementById("currentPassword").value;
        const newPw = document.getElementById("newPassword").value;
        const confirmPw =
          document.getElementById("confirmPassword").value;

        if (!currentPw || !newPw || !confirmPw) {
          alert("Please fill in all password fields.");
          return;
        }
        if (newPw !== confirmPw) {
          alert("New password and confirm password must match.");
          return;
        }

        fetch("../php/change_password.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            current_password: currentPw,
            new_password: newPw,
            confirm_password: confirmPw,
          }),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.status === "success") {
              showToast("Password updated successfully.", "success");
              securityForm.reset();
              setSecurityEditing(false);
          } else {
              showToast("Password change failed: " + (data.message || "Unknown error"), "error");
          }
          })
          .catch(() => alert("Server error while changing password."));
      });
    }
  }

  /* PREFERENCES */
  if (prefsCard) {
    const themeRadios = prefsCard.querySelectorAll('input[name="theme"]');
    const chipOptions = prefsCard.querySelectorAll(".chip-option");
       const notifInputs = prefsCard.querySelectorAll(".switch input");

    let originalPrefs = {
      theme: [...themeRadios].find((r) => r.checked)?.value || "light",
      notifEmail: document.getElementById("notifEmail")?.checked ?? true,
      notifStatus: document.getElementById("notifStatus")?.checked ?? true,
      notifSummary: document.getElementById("notifSummary")?.checked ?? false,
    };

    function updateThemeChipHighlight() {
      chipOptions.forEach((chip) => {
        const input = chip.querySelector('input[type="radio"]');
        if (input && input.checked) chip.classList.add("chip-active");
        else chip.classList.remove("chip-active");
      });
    }

    function setPrefsEditing(on) {
      themeRadios.forEach((r) => (r.disabled = !on));
      notifInputs.forEach((n) => (n.disabled = !on));
      prefsCard.classList.toggle("editing", on);
      if (prefsEditBtn) prefsEditBtn.style.display = on ? "none" : "";
      if (prefsSaveBtn) prefsSaveBtn.style.display = on ? "" : "none";
      if (prefsCancelBtn)
        prefsCancelBtn.style.display = on ? "" : "none";
      updateThemeChipHighlight();
    }

    themeRadios.forEach((radio) => {
      radio.addEventListener("change", () => {
        if (radio.checked) {
          document.body.setAttribute("data-theme", radio.value);
          updateThemeChipHighlight();
        }
      });
    });

    setPrefsEditing(false);
    updateThemeChipHighlight();

    if (prefsEditBtn) {
      prefsEditBtn.addEventListener("click", () => setPrefsEditing(true));
    }

    if (prefsCancelBtn) {
      prefsCancelBtn.addEventListener("click", () => {
        themeRadios.forEach((r) => {
          r.checked = r.value === originalPrefs.theme;
        });
        const emailCb = document.getElementById("notifEmail");
        const statusCb = document.getElementById("notifStatus");
        const summaryCb = document.getElementById("notifSummary");
        if (emailCb) emailCb.checked = originalPrefs.notifEmail;
        if (statusCb) statusCb.checked = originalPrefs.notifStatus;
        if (summaryCb) summaryCb.checked = originalPrefs.notifSummary;
        document.body.setAttribute("data-theme", originalPrefs.theme);
        setPrefsEditing(false);
        updateThemeChipHighlight();
      });
    }

    if (prefsSaveBtn) {
      prefsSaveBtn.addEventListener("click", () => {
        const selectedTheme =
          [...themeRadios].find((r) => r.checked)?.value || "light";
        document.body.setAttribute("data-theme", selectedTheme);
        const emailCb = document.getElementById("notifEmail");
        const statusCb = document.getElementById("notifStatus");
        const summaryCb = document.getElementById("notifSummary");
        originalPrefs = {
          theme: selectedTheme,
          notifEmail: emailCb?.checked ?? true,
          notifStatus: statusCb?.checked ?? true,
          notifSummary: summaryCb?.checked ?? false,
        };
        showToast("Preferences saved.", "info");
        setPrefsEditing(false);
        updateThemeChipHighlight();
      });
    }
  }

  // ✅ Listen for sidebar section changes and load related data
  document.addEventListener("sectionChanged", (e) => {
    const section = e.detail.id;

    switch (section) {
      case "dashboardSection":
        loadDocuments();
        break;
      case "analyticsSection":
        updateAnalytics(allDocuments);
        break;
      case "filesSection":
        loadMyFiles();
        break;
      case "applicationSection":
        if (appTabBtn) appTabBtn.click();
        break;
      case "userManagementSection":
        loadUsers();
        break;
      case "settingsSection":
        // Ensure settings data reloads (profile/preferences)
        if (typeof loadProfileFromServer === "function") {
          loadProfileFromServer();
        }
        break;
    }
  });
}); //End of DOMContentLoaded
