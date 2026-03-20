/**
 * Gọi API cùng origin (Express phục vụ static + /api).
 * Dùng credentials để gửi cookie httpOnly (token).
 */
(function (window) {
  var TOKEN_KEY = "ol_token";

  function getApiBase() {
    return "";
  }

  function getToken() {
    try {
      return localStorage.getItem(TOKEN_KEY) || "";
    } catch (e) {
      return "";
    }
  }

  function setToken(token) {
    try {
      if (token) localStorage.setItem(TOKEN_KEY, token);
      else localStorage.removeItem(TOKEN_KEY);
    } catch (e) {}
  }

  function apiFetch(path, options) {
    options = options || {};
    var headers = options.headers || {};
    var token = getToken();
    if (token && !headers.Authorization) {
      headers.Authorization = "Bearer " + token;
    }
    var method = options.method || "GET";
    return fetch(getApiBase() + path, {
      credentials: "include",
      // Tránh cache GET (dữ liệu khóa học/video sau khi admin cập nhật)
      cache: method === "GET" ? "no-store" : "default",
      headers: Object.assign({ "Content-Type": "application/json" }, headers),
      body: options.body
        ? typeof options.body === "string"
          ? options.body
          : JSON.stringify(options.body)
        : undefined,
      method: method,
    }).then(function (res) {
      if (!res.ok) {
        return res.text().then(function (txt) {
          try {
            var j = JSON.parse(txt);
            var msg = j.message;
            if (Array.isArray(msg)) msg = msg.map(function (x) { return x.msg || x; }).join("; ");
            throw new Error(msg || txt || res.statusText);
          } catch (e) {
            if (e instanceof SyntaxError) throw new Error(txt || res.statusText);
            throw e;
          }
        });
      }
      var ct = res.headers.get("content-type");
      if (ct && ct.indexOf("application/json") !== -1) return res.json();
      return res.text();
    });
  }

  window.OLApi = {
    getToken: getToken,
    setToken: setToken,
    fetch: apiFetch,
    login: function (username, password) {
      return apiFetch("/api/auth/login", {
        method: "POST",
        body: { username: username, password: password },
      }).then(function (data) {
        if (data && data.token) setToken(data.token);
        return data;
      });
    },
    logout: function () {
      return apiFetch("/api/auth/logout", { method: "POST" }).finally(function () {
        setToken("");
      });
    },
    register: function (body) {
      return apiFetch("/api/auth/register", { method: "POST", body: body });
    },
    me: function () {
      return apiFetch("/api/auth/me");
    },
    courses: function () {
      return apiFetch("/api/courses");
    },
    courseCreate: function (body) {
      return apiFetch("/api/courses", { method: "POST", body: body });
    },
    courseUpdate: function (id, body) {
      return apiFetch("/api/courses/" + encodeURIComponent(id), {
        method: "PUT",
        body: body,
      });
    },
    courseDelete: function (id) {
      return apiFetch("/api/courses/" + encodeURIComponent(id), {
        method: "DELETE",
      });
    },
    course: function (id) {
      return apiFetch("/api/courses/" + encodeURIComponent(id));
    },
    users: function () {
      return apiFetch("/api/users");
    },
    categories: function () {
      return apiFetch("/api/categories");
    },
    categoryCreate: function (body) {
      return apiFetch("/api/categories", { method: "POST", body: body });
    },
    categoryUpdate: function (id, body) {
      return apiFetch("/api/categories/" + encodeURIComponent(id), {
        method: "PUT",
        body: body,
      });
    },
    categoryDelete: function (id) {
      return apiFetch("/api/categories/" + encodeURIComponent(id), {
        method: "DELETE",
      });
    },
    userDelete: function (id) {
      return apiFetch("/api/users/" + encodeURIComponent(id), {
        method: "DELETE",
      });
    },
    cartGet: function () {
      return apiFetch("/api/carts/get-cart");
    },
    cartAdd: function (courseId, quantity) {
      return apiFetch("/api/carts/add-cart", {
        method: "POST",
        body: { product: courseId, quantity: quantity || 1 },
      });
    },
    cartRemove: function (courseId) {
      return apiFetch("/api/carts/remove", {
        method: "POST",
        body: { product: courseId },
      });
    },
    cartReduce: function (courseId) {
      return apiFetch("/api/carts/reduce", {
        method: "POST",
        body: { product: courseId },
      });
    },
    /** Thanh toán demo — chuyển giỏ sang khóa học đã mua */
    cartCheckout: function () {
      return apiFetch("/api/carts/checkout", { method: "POST", body: {} });
    },
    /** Khóa học đã thanh toán / đăng ký */
    enrollmentsMine: function () {
      return apiFetch("/api/enrollments/mine");
    },
  };
})(window);
