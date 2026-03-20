(function () {
  var alertBox = document.getElementById("cw-alert");
  var titleEl = document.getElementById("cw-title");
  var descEl = document.getElementById("cw-desc");
  var player = document.getElementById("cw-player");
  var youtubeFrame = document.getElementById("cw-youtube");
  var lessons = document.getElementById("cw-lessons");

  function show(type, msg) {
    if (!alertBox) return;
    alertBox.className = "alert alert-" + type;
    alertBox.textContent = msg;
    alertBox.classList.remove("d-none");
  }

  function esc(s) {
    var d = document.createElement("div");
    d.textContent = s == null ? "" : String(s);
    return d.innerHTML;
  }

  /** Trả về id video YouTube hoặc null nếu không phải link YouTube */
  function getYouTubeId(url) {
    if (!url || typeof url !== "string") return null;
    var u = url.trim();
    var m;
    m = u.match(/youtube\.com\/embed\/([^?&#/]+)/i);
    if (m) return m[1];
    m = u.match(/youtube\.com\/shorts\/([^?&#/]+)/i);
    if (m) return m[1];
    m = u.match(/youtu\.be\/([^?&#/]+)/i);
    if (m) return m[1];
    if (/youtube\.com/i.test(u)) {
      m = u.match(/[?&]v=([^?&#/]+)/i);
      if (m) return m[1];
    }
    return null;
  }

  function hidePlayers() {
    if (player) {
      try {
        player.pause();
      } catch (e) {}
      player.removeAttribute("src");
      player.load();
      player.style.display = "none";
    }
    if (youtubeFrame) {
      youtubeFrame.removeAttribute("src");
      youtubeFrame.style.display = "none";
    }
  }

  var params = new URLSearchParams(window.location.search);
  var id = params.get("id");
  if (!id) {
    show("danger", "Thiếu id khóa học.");
    return;
  }

  OLApi.course(id)
    .then(function (course) {
      titleEl.textContent = course.title || "Khóa học";
      descEl.textContent = course.description || "";
      lessons.innerHTML = "";

      var vids = course.videos || [];
      if (!vids.length) {
        lessons.innerHTML =
          '<div class="text-muted">Khóa học chưa có video bài học.</div>';
        hidePlayers();
        return;
      }

      function playVideo(v, idx) {
        var url = v && v.url ? String(v.url).trim() : "";
        var ytId = getYouTubeId(url);

        lessons.querySelectorAll(".list-group-item").forEach(function (el) {
          el.classList.remove("active");
        });
        var active = lessons.querySelector('[data-idx="' + idx + '"]');
        if (active) active.classList.add("active");

        if (!url) {
          hidePlayers();
          return;
        }

        if (ytId && youtubeFrame) {
          if (player) {
            try {
              player.pause();
            } catch (e) {}
            player.removeAttribute("src");
            player.load();
            player.style.display = "none";
          }
          youtubeFrame.style.display = "block";
          youtubeFrame.src =
            "https://www.youtube.com/embed/" +
            encodeURIComponent(ytId) +
            "?rel=0&modestbranding=1";
          return;
        }

        if (youtubeFrame) {
          youtubeFrame.removeAttribute("src");
          youtubeFrame.style.display = "none";
        }
        if (player) {
          player.style.display = "block";
          player.src = url;
          player.play().catch(function () {});
        }
      }

      vids.forEach(function (v, idx) {
        var item = document.createElement("button");
        item.type = "button";
        item.className = "list-group-item list-group-item-action";
        item.setAttribute("data-idx", String(idx));
        item.innerHTML =
          "<strong>" +
          esc(v.title || "Bài " + (idx + 1)) +
          "</strong><br><small class='text-muted'>Video " +
          (idx + 1) +
          "</small>";
        item.addEventListener("click", function () {
          playVideo(v, idx);
        });
        lessons.appendChild(item);
      });

      playVideo(vids[0], 0);
    })
    .catch(function (e) {
      show("danger", e.message || "Không tải được khóa học.");
    });
})();
