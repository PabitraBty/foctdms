const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const data = {
      username: loginForm.username.value.trim(),
      password: loginForm.password.value
    };
    fetch('../php/login.php', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(data)
    })
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
          // Save user session info for frontend rendering
          localStorage.setItem('userRole', data.user.role);
          localStorage.setItem('fullname', data.user.fullname);
          window.location.href = "../html/dashboard.html";
        } else {
          alert('Error: ' + data.message);
        }
      }).catch(() => {
        alert('Server error.');
      });
  });
}
