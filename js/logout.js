document.querySelector('.logout-btn').onclick = () => {
  fetch('../php/logout.php')
    .then(() => window.location.href = "login.html");
};
