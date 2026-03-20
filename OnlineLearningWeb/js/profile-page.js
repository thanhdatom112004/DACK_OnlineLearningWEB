(function () {
  var alertBox = document.getElementById("profile-alert");

  function showAlert(type, msg) {
    if (!alertBox) return;
    alertBox.className = "alert alert-" + type;
    alertBox.textContent = msg;
    alertBox.classList.remove("d-none");
  }

  function setText(id, value) {
    var el = document.getElementById(id);
    if (el) el.textContent = value || "-";
  }

  if (!window.OLApi || !OLApi.getToken()) {
    showAlert("warning", "Bạn chưa đăng nhập.");
    return;
  }

  OLApi.me()
    .then(function (user) {
      var roleValue = user.role;
      if (roleValue && typeof roleValue === "object") {
        roleValue = roleValue.name || roleValue._id || "-";
      }
      setText("pf-username", user.username);
      setText("pf-email", user.email);
      setText("pf-role", roleValue);
      setText("pf-status", user.status ? "Đang hoạt động" : "Chưa kích hoạt");
    })
    .catch(function (e) {
      showAlert("danger", e.message || "Không tải được thông tin cá nhân.");
    });
})();

