// sidebar.js

document.addEventListener('DOMContentLoaded', () => {
  const navLinks = document.querySelectorAll('.sidebar nav a');

  navLinks.forEach(link => {
    link.addEventListener('click', function (e) {
      const targetId = this.getAttribute('data-section');
      if (targetId) {
        e.preventDefault(); // Only run for SPA sections!
        navLinks.forEach(l => l.classList.remove('active'));
        this.classList.add('active');
        document.querySelectorAll('.main-area > section').forEach(sec => {
          sec.style.display = 'none';
        });
        document.getElementById(targetId).style.display = '';
        return; // Add this to STOP execution here for SPA links
      }
      // For links WITHOUT data-section (like upload.html), do nothing: browser will follow href as normal!
    });
  });

  // On page load, show only dashboard section
  if (document.getElementById("dashboardSection")) {
    document.getElementById("dashboardSection").style.display = '';
  }

  // Inside your existing event listener for sidebar nav
// for 'click' switch
if (targetId) {
  // hide all sections
  document.querySelectorAll('.main-area > section').forEach(sec => {
    sec.style.display = 'none';
  });
  // show selected
  document.getElementById(targetId).style.display = '';
}
});
