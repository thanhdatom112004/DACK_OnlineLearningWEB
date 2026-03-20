(function () {
  var alertBox = document.getElementById("profile-alert");
  var profileForm = document.getElementById("profile-form");
  var passwordForm = document.getElementById("password-form");

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

  function applyAvatar(url) {
    var img = document.getElementById("pf-avatar-img");
    var icon = document.getElementById("pf-avatar-icon");
    if (!url || !String(url).trim()) {
      if (img) {
        img.classList.add("d-none");
        img.removeAttribute("src");
      }
      if (icon) icon.classList.remove("d-none");
      return;
    }
    var u = String(url).trim();
    if (img) {
      img.onload = function () {
        img.classList.remove("d-none");
        if (icon) icon.classList.add("d-none");
      };
      img.onerror = function () {
        img.classList.add("d-none");
        if (icon) icon.classList.remove("d-none");
      };
      img.src = u;
    }
  }

  function fillUser(user) {
    var roleValue = user.role;
    if (roleValue && typeof roleValue === "object") {
      roleValue = roleValue.name || roleValue._id || "-";
    }
    setText("pf-username", user.username);
    setText("pf-email", user.email);
    setText("pf-role", roleValue);
    setText("pf-status", user.status ? "Đang hoạt động" : "Chưa kích hoạt");

    var emailRo = document.getElementById("pf-email-ro");
    if (emailRo) emailRo.value = user.email || "";

    var uIn = document.getElementById("pf-username-input");
    if (uIn) uIn.value = user.username || "";

    var fn = document.getElementById("pf-fullname");
    if (fn) fn.value = user.fullName || "";

    var av = document.getElementById("pf-avatar-url");
    if (av) av.value = user.avatarUrl || "";

    applyAvatar(user.avatarUrl);
  }

  if (!window.OLApi || !OLApi.getToken()) {
    showAlert("warning", "Bạn chưa đăng nhập.");
    return;
  }

  OLApi.me()
    .then(function (user) {
      fillUser(user);
    })
    .catch(function (e) {
      showAlert("danger", e.message || "Không tải được thông tin cá nhân.");
    });

  if (profileForm) {
    profileForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var username = document.getElementById("pf-username-input");
      var fullName = document.getElementById("pf-fullname");
      var avatarUrl = document.getElementById("pf-avatar-url");
      var payload = {
        username: username ? username.value.trim() : "",
        fullName: fullName ? fullName.value.trim() : "",
        avatarUrl: avatarUrl ? avatarUrl.value.trim() : "",
      };
      if (!payload.username) {
        showAlert("danger", "Tên đăng nhập không được để trống.");
        return;
      }
      OLApi.profileUpdate(payload)
        .then(function (user) {
          showAlert("success", "Đã cập nhật thông tin.");
          fillUser(user);
        })
        .catch(function (err) {
          showAlert("danger", err.message || "Không lưu được.");
        });
    });
  }

  if (passwordForm) {
    passwordForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var oldP = document.getElementById("pf-old-pass");
      var newP = document.getElementById("pf-new-pass");
      var newP2 = document.getElementById("pf-new-pass2");
      var a = oldP ? oldP.value : "";
      var b = newP ? newP.value : "";
      var c = newP2 ? newP2.value : "";
      if (b !== c) {
        showAlert("danger", "Mật khẩu mới nhập lại không khớp.");
        return;
      }
      if (b.length < 8) {
        showAlert("danger", "Mật khẩu mới tối thiểu 8 ký tự.");
        return;
      }
      OLApi.changePassword(a, b)
        .then(function () {
          showAlert("success", "Đã đổi mật khẩu thành công.");
          passwordForm.reset();
        })
        .catch(function (err) {
          showAlert("danger", err.message || "Đổi mật khẩu thất bại.");
        });
    });
  }
})();
