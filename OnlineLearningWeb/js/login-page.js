(function () {
  var form = document.getElementById("login-form");
  var alertBox = document.getElementById("login-alert");
  if (!form) return;

  function showAlert(type, msg) {
    alertBox.className = "alert alert-" + type;
    alertBox.textContent = msg;
    alertBox.classList.remove("d-none");
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var u = document.getElementById("login-username").value.trim();
    var p = document.getElementById("login-password").value;
    OLApi.login(u, p)
      .then(function () {
        showAlert("success", "Đăng nhập thành công. Chuyển đến khóa học...");
        setTimeout(function () {
          window.location.href = "course.html";
        }, 800);
      })
      .catch(function (err) {
        showAlert("danger", err.message || "Đăng nhập thất bại");
      });
  });
})();
