(function () {
  var tbody = document.getElementById("cart-tbody");
  var alertBox = document.getElementById("cart-alert");
  var hint = document.getElementById("cart-hint");
  var checkoutCard = document.getElementById("cart-checkout-card");
  var totalDisplay = document.getElementById("cart-total-display");
  var checkoutBtn = document.getElementById("cart-checkout-btn");
  if (!tbody) return;

  function showAlert(type, msg) {
    if (!alertBox) return;
    alertBox.className = "alert alert-" + type + " mb-3";
    alertBox.textContent = msg;
    alertBox.classList.remove("d-none");
  }

  function escapeHtml(s) {
    if (s == null) return "";
    var d = document.createElement("div");
    d.textContent = String(s);
    return d.innerHTML;
  }

  function courseTitleById(map, id) {
    var k = String(id);
    return map[k] ? map[k] : "(Không tìm thấy tên — kiểm tra DB)";
  }

  function priceLabel(n) {
    var p = typeof n === "number" && !isNaN(n) ? n : Number(n) || 0;
    if (p <= 0) return "0đ";
    return "$" + p;
  }

  function load() {
    if (!OLApi.getToken()) {
      tbody.innerHTML =
        '<tr><td colspan="5">Chưa đăng nhập. <a href="login.html">Đăng nhập</a> để xem giỏ.</td></tr>';
      if (hint) hint.textContent = "Cần đăng nhập (token trong localStorage + cookie).";
      if (checkoutCard) checkoutCard.style.display = "none";
      return;
    }

    Promise.all([OLApi.courses(), OLApi.cartGet()])
      .then(function (arr) {
        var courses = arr[0] || [];
        var cartItems = arr[1] || [];
        var titleMap = {};
        var priceMap = {};
        courses.forEach(function (c) {
          var id = String(c._id);
          titleMap[id] = c.title;
          priceMap[id] = typeof c.price === "number" ? c.price : Number(c.price) || 0;
        });

        tbody.innerHTML = "";
        if (!cartItems.length) {
          tbody.innerHTML = '<tr><td colspan="5" class="text-muted">Giỏ trống.</td></tr>';
          if (checkoutCard) checkoutCard.style.display = "none";
          return;
        }

        var grandTotal = 0;

        cartItems.forEach(function (line) {
          var cid = line.course;
          var qty = line.quantity || 1;
          var unit = priceMap[String(cid)];
          if (unit === undefined) unit = 0;
          var lineTotal = unit * qty;
          grandTotal += lineTotal;

          var tr = document.createElement("tr");
          tr.innerHTML =
            "<td>" +
            escapeHtml(courseTitleById(titleMap, cid)) +
            "</td>" +
            "<td>" +
            escapeHtml(priceLabel(unit)) +
            "</td>" +
            "<td>" +
            escapeHtml(qty) +
            "</td>" +
            "<td><strong>" +
            escapeHtml(priceLabel(lineTotal)) +
            "</strong></td>" +
            '<td><button type="button" class="btn btn-sm btn-danger btn-remove" data-id="' +
            escapeHtml(String(cid)) +
            '">Xóa</button> ' +
            '<button type="button" class="btn btn-sm btn-outline-secondary btn-reduce" data-id="' +
            escapeHtml(String(cid)) +
            '">-1</button></td>';
          tbody.appendChild(tr);
        });

        if (totalDisplay) totalDisplay.textContent = priceLabel(grandTotal);
        if (checkoutCard) checkoutCard.style.display = "block";

        tbody.querySelectorAll(".btn-remove").forEach(function (btn) {
          btn.addEventListener("click", function () {
            var id = btn.getAttribute("data-id");
            OLApi.cartRemove(id)
              .then(function () {
                showAlert("success", "Đã xóa khỏi giỏ.");
                load();
              })
              .catch(function (e) {
                showAlert("danger", e.message || "Lỗi");
              });
          });
        });

        tbody.querySelectorAll(".btn-reduce").forEach(function (btn) {
          btn.addEventListener("click", function () {
            var id = btn.getAttribute("data-id");
            OLApi.cartReduce(id)
              .then(function () {
                load();
              })
              .catch(function (e) {
                showAlert("danger", e.message || "Lỗi");
              });
          });
        });
      })
      .catch(function (e) {
        tbody.innerHTML =
          '<tr><td colspan="5" class="text-danger">Lỗi: ' + escapeHtml(e.message) + "</td></tr>";
        if (checkoutCard) checkoutCard.style.display = "none";
      });
  }

  if (checkoutBtn) {
    checkoutBtn.addEventListener("click", function () {
      if (!OLApi.getToken()) {
        showAlert("warning", "Cần đăng nhập.");
        return;
      }
      if (!confirm("Xác nhận thanh toán? (Demo — luôn thành công)")) return;
      checkoutBtn.disabled = true;
      OLApi.cartCheckout()
        .then(function (data) {
          var msg = data && data.message ? data.message : "Thanh toán thành công";
          var ref = data && data.paymentRef ? " Mã: " + data.paymentRef : "";
          showAlert("success", msg + ref + ". Chuyển tới Khóa học đã mua…");
          setTimeout(function () {
            window.location.href = "my-courses.html";
          }, 1200);
        })
        .catch(function (e) {
          showAlert("danger", e.message || "Thanh toán thất bại");
        })
        .finally(function () {
          checkoutBtn.disabled = false;
        });
    });
  }

  load();
})();
