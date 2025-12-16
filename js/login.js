console.log("login.js loaded");

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const data = {
      username: form.username.value.trim(),
      password: form.password.value
    };

    const res = await fetch("../php/login.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    const result = await res.json();

    if (result.status === "success") {
      localStorage.setItem("fullname", result.user.fullname);
      localStorage.setItem("role", result.user.role);

      window.location.href = "../html/dashboard.php";
    } else {
      alert(result.message);
    }
  });
});
