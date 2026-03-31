(function () {
  var container = document.getElementById("course-list");
  var loading = document.getElementById("course-loading");
  var alertBox = document.getElementById("course-list-alert");
  var categoryFilterList = document.getElementById("course-category-filter-list");
  if (!container) return;

  var imgs = [
    "images/work-1.jpg",
    "images/work-2.jpg",
    "images/work-3.jpg",
    "images/work-4.jpg",
    "images/work-5.jpg",
    "images/work-6.jpg",
    "images/work-7.jpg",
    "images/work-8.jpg",
    "images/work-9.jpg",
  ];

  function showAlert(type, msg) {
    if (!alertBox) return;
    alertBox.className = "alert alert-" + type + " mb-3";
    alertBox.textContent = msg;
    alertBox.classList.remove("d-none");
  }

  function escapeHtml(s) {
    if (!s) return "";
    var d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }

  function normalizeCourseImage(c) {
    var raw = c && c.images;
    if (typeof raw === "string" && raw.trim()) return raw.trim();
    if (Array.isArray(raw) && raw.length) {
      var first = raw[0];
      if (typeof first === "string" && first.trim()) return first.trim();
    }
    return "";
  }

  var allCourses = [];
  var selectedCategories = {};

  function renderCategoryFilter(courses, categoriesFromApi) {
    if (!categoryFilterList) return;
    var map = {};
    (categoriesFromApi || []).forEach(function (cat) {
      if (!cat || !cat.name) return;
      map[String(cat.name)] = true;
    });
    (courses || []).forEach(function (c) {
      var name = c && c.category ? String(c.category).trim() : "";
      if (name) map[name] = true;
    });
    var names = Object.keys(map).sort(function (a, b) {
      return a.localeCompare(b, "vi");
    });
    if (!names.length) {
      categoryFilterList.innerHTML = '<span class="text-muted">Chưa có category.</span>';
      return;
    }
    categoryFilterList.innerHTML = "";
    names.forEach(function (name, idx) {
      var id = "filter-cat-" + idx;
      var row = document.createElement("label");
      row.setAttribute("for", id);
      row.style.display = "block";
      row.innerHTML =
        '<input type="checkbox" id="' +
        id +
        '" class="course-filter-category" value="' +
        escapeHtml(name) +
        '"> ' +
        escapeHtml(name);
      categoryFilterList.appendChild(row);
    });

    categoryFilterList.querySelectorAll(".course-filter-category").forEach(function (cb) {
      cb.addEventListener("change", function () {
        selectedCategories = {};
        categoryFilterList.querySelectorAll(".course-filter-category:checked").forEach(function (x) {
          selectedCategories[String(x.value)] = true;
        });
        renderCourses(allCourses);
      });
    });
  }

  function renderCourses(list) {
      if (loading) loading.remove();
      container.innerHTML = "";
      var filtered = (list || []).filter(function (c) {
        var keys = Object.keys(selectedCategories);
        if (!keys.length) return true;
        var cat = c && c.category ? String(c.category) : "";
        return !!selectedCategories[cat];
      });

      if (!filtered.length) {
        container.innerHTML =
          '<div class="col-12"><p class="text-muted">Không có khóa học phù hợp category đã chọn.</p></div>';
        return;
      }
      filtered.forEach(function (c, i) {
        var img = normalizeCourseImage(c) || imgs[i % imgs.length];
        var cat = c.category || "Khóa học";
        var price = typeof c.price === "number" ? c.price : 0;
        var id = c._id;
        var col = document.createElement("div");
        col.className = "col-md-6 d-flex align-items-stretch";
        col.innerHTML =
          '<div class="project-wrap w-100">' +
          '<a href="course-watch.html?id=' +
          encodeURIComponent(String(id)) +
          '" class="img course-list-img">' +
          '<span class="price">' +
          escapeHtml(cat) +
          "</span></a>" +
          '<div class="text p-4">' +
          "<h3>" +
          escapeHtml(c.title || "") +
          "</h3>" +
          '<p class="advisor small text-muted">' +
          escapeHtml((c.description || "").slice(0, 120)) +
          (c.description && c.description.length > 120 ? "…" : "") +
          "</p>" +
          '<ul class="d-flex justify-content-between align-items-center">' +
          '<li class="price">$' +
          price +
          "</li>" +
          '<li><a class="btn btn-sm btn-outline-success mr-1" href="course-watch.html?id=' +
          escapeHtml(String(id)) +
          '">Xem bài học</a><button type="button" class="btn btn-sm btn-primary btn-add-cart" data-id="' +
          escapeHtml(String(id)) +
          '">Thêm vào giỏ</button></li>' +
          "</ul></div></div>";
        container.appendChild(col);
        var imgLink = col.querySelector(".course-list-img");
        if (imgLink) {
          imgLink.style.backgroundImage = "url(" + JSON.stringify(img) + ")";
        }
      });

      container.querySelectorAll(".btn-add-cart").forEach(function (btn) {
        btn.addEventListener("click", function () {
          var cid = btn.getAttribute("data-id");
          if (!OLApi.getToken()) {
            showAlert("warning", "Bạn cần đăng nhập trước (Đăng nhập → thêm giỏ).");
            return;
          }
          OLApi.cartAdd(cid, 1)
            .then(function () {
              showAlert("success", "Đã thêm vào giỏ đăng ký. Xem tại Giỏ đăng ký.");
            })
            .catch(function (e) {
              showAlert("danger", e.message || "Không thêm được");
            });
        });
      });
  }

  Promise.all([OLApi.courses(), OLApi.categories()])
    .then(function (arr) {
      var list = arr[0] || [];
      var categories = arr[1] || [];
      allCourses = list;
      renderCategoryFilter(list, categories);
      renderCourses(list);
    })
    .catch(function (e) {
      if (loading) loading.remove();
      container.innerHTML =
        '<div class="col-12"><p class="text-danger">Không tải được khóa học: ' +
        escapeHtml(e.message) +
        "</p></div>";
    });
})();
