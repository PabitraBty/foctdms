const form = document.getElementById('registrationForm');
const fields = ['fullname', 'email', 'username', 'password', 'confirmPassword', 'role'];

form.addEventListener('submit', function(e) {
  e.preventDefault();
  clearErrors();

  const body = {
    fullname: form.fullname.value.trim(),
    email: form.email.value.trim(),
    username: form.username.value.trim(),
    password: form.password.value,
    confirmPassword: form.confirmPassword.value,
    role: form.role.value
  };

  let valid = true;
  if (!body.role) {
    showError('role');
    valid = false;
  }
  // Add your other validations as before...

  if (valid) {
    fetch('../php/register.php', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(body)
    })
    .then(res => res.json())
    .then(data => {
      if (data.status === 'success') {
        alert('Registration successful!');
        form.reset();
        window.location.href = 'login.html';
      } else {
        alert('Error: ' + data.message);
      }
    })
    .catch(() => {
      alert('Server error.');
    });
  }
});

function showError(field) {
  const input = form[field];
  input.classList.add('invalid');
  input.nextElementSibling.style.display = 'block';
  input.focus();
}

function clearErrors() {
  fields.forEach(field => {
    const input = form[field];
    input.classList.remove('invalid');
    if (input.nextElementSibling) input.nextElementSibling.style.display = 'none';
  });
}