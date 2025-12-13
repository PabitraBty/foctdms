// sidebar.js — unified section handling
document.addEventListener('DOMContentLoaded', () => {
  const navLinks = document.querySelectorAll('.sidebar nav a[data-section]');
  const sections = {
    dashboardSection: document.getElementById('dashboardSection'),
    analyticsSection: document.getElementById('analyticsSection'),
    filesSection: document.getElementById('filesSection'),
    applicationSection: document.getElementById('applicationSection'),
    userManagementSection: document.getElementById('userManagementSection'),
    settingsSection: document.getElementById('settingsSection'),
  };

  function showSection(id) {
    let found = false;

    Object.keys(sections).forEach(key => {
      const sec = sections[key];
      if (!sec) return;
      const visible = (key === id);
      sec.style.display = visible ? 'block' : 'none';
      if (visible) found = true;
    });

    // fallback if invalid section
    if (!found && sections.dashboardSection) {
      id = 'dashboardSection';
      sections.dashboardSection.style.display = 'block';
    }

    navLinks.forEach(link => {
      link.classList.toggle('active', link.dataset.section === id);
    });

    localStorage.setItem('activeSection', id);

    // 🔄 Trigger section-specific initializations safely
    document.dispatchEvent(new CustomEvent('sectionChanged', { detail: { id } }));
  }

  // On first load, get from localStorage or fallback
  let saved = localStorage.getItem('activeSection');
  if (!saved || !sections[saved]) saved = 'dashboardSection';
  showSection(saved);

  // Handle sidebar link clicks
  navLinks.forEach(link => {
    link.addEventListener('click', e => {
      const targetId = link.dataset.section;
      if (!targetId) return;
      e.preventDefault();
      showSection(targetId);
    });
  });
});
