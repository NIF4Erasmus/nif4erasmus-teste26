/* NIF4Erasmus — Redesign (Phase 1)
   Small, dependency-free behaviours shared by every page:
   - mobile nav toggle + "Other Legal Services" submenu
   - smooth-scroll-to-section links that also work from another page
   - FAQ search + category filter (faq.html only, degrades to a no-op elsewhere)
   This file does NOT touch the order form, Firebase, EmailJS or Stripe —
   that logic stays in scripts/main.js untouched. */
(function () {
  "use strict";

  /* ---------- Mobile nav ---------- */
  var toggle = document.querySelector("[data-rd-nav-toggle]");
  var mobile = document.querySelector("[data-rd-nav-mobile]");
  if (toggle && mobile) {
    toggle.addEventListener("click", function () {
      var isOpen = mobile.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });
  }
  var subToggle = document.querySelector("[data-rd-nav-subtoggle]");
  var sub = document.querySelector("[data-rd-nav-sub]");
  if (subToggle && sub) {
    subToggle.addEventListener("click", function () {
      var isOpen = sub.classList.toggle("is-open");
      subToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });
  }

  /* ---------- Scroll-to-section (works from any page) ---------- */
  // Usage: <a href="index.html#services" data-rd-scroll="services">...</a>
  document.addEventListener("click", function (evt) {
    var link = evt.target.closest("[data-rd-scroll]");
    if (!link) return;
    var isHome =
      location.pathname === "/" ||
      location.pathname.endsWith("/index.html") ||
      location.pathname === "";
    if (!isHome) return; // let the browser follow the normal href to index.html#id
    var id = link.getAttribute("data-rd-scroll");
    var el = document.getElementById(id);
    if (el) {
      evt.preventDefault();
      el.scrollIntoView({ behavior: "smooth" });
      if (mobile) mobile.classList.remove("is-open");
    }
  });

  // On load, if arriving with a #hash from another page, scroll to it.
  if (location.hash) {
    var target = document.getElementById(location.hash.slice(1));
    if (target) {
      window.setTimeout(function () {
        target.scrollIntoView({ behavior: "smooth" });
      }, 50);
    }
  }

  /* ---------- FAQ search + category filter ---------- */
  var faqRoot = document.querySelector("[data-rd-faq]");
  if (faqRoot) {
    var searchInput = faqRoot.querySelector("[data-rd-faq-search]");
    var clearBtns = Array.prototype.slice.call(
      faqRoot.querySelectorAll("[data-rd-faq-clear]")
    );
    var clearBtn = clearBtns[0];
    var catButtons = Array.prototype.slice.call(
      faqRoot.querySelectorAll("[data-rd-faq-cat]")
    );
    var items = Array.prototype.slice.call(
      faqRoot.querySelectorAll("[data-rd-faq-item]")
    );
    var catBar = faqRoot.querySelector("[data-rd-faq-catbar]");
    var emptyState = faqRoot.querySelector("[data-rd-faq-empty]");
    var countLabel = faqRoot.querySelector("[data-rd-faq-count]");
    var resultsBar = faqRoot.querySelector("[data-rd-faq-resultsbar]");
    var resultsTitle = faqRoot.querySelector("[data-rd-faq-searchtitle]");
    var activeCat = "general";

    function applyFilter() {
      var query = (searchInput.value || "").trim().toLowerCase();
      var visibleCount = 0;
      var searching = query.length > 0;
      catBar.style.display = searching ? "none" : "";
      if (clearBtn) clearBtn.style.display = searching ? "block" : "none";

      items.forEach(function (item) {
        var cat = item.getAttribute("data-rd-faq-item");
        var text = item.textContent.toLowerCase();
        var matchesCat = searching || cat === activeCat;
        var matchesQuery = !searching || text.indexOf(query) !== -1;
        var show = matchesCat && matchesQuery;
        item.style.display = show ? "" : "none";
        if (show) visibleCount++;
      });

      if (resultsBar) resultsBar.style.display = searching ? "flex" : "none";
      if (resultsTitle) resultsTitle.textContent = 'Search results for "' + query + '"';
      if (countLabel) {
        countLabel.textContent =
          visibleCount + (visibleCount === 1 ? " result" : " results");
      }
      if (emptyState) {
        emptyState.style.display = visibleCount === 0 ? "block" : "none";
      }
    }

    searchInput.addEventListener("input", applyFilter);
    clearBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        searchInput.value = "";
        applyFilter();
        searchInput.focus();
      });
    });
    catButtons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        activeCat = btn.getAttribute("data-rd-faq-cat");
        catButtons.forEach(function (b) {
          b.setAttribute("aria-selected", b === btn ? "true" : "false");
        });
        applyFilter();
      });
    });

    applyFilter();
  }

  // ---------- Article reading-progress bar ----------
  var progressBar = document.querySelector("[data-rd-article-progress]");
  if (progressBar) {
    var updateProgress = function () {
      var total = document.documentElement.scrollHeight - window.innerHeight;
      var pct = total > 0 ? (window.scrollY / total) * 100 : 0;
      progressBar.style.width = pct + "%";
    };
    window.addEventListener("scroll", updateProgress, { passive: true });
    updateProgress();
  }

  // ---------- Order form file-input filename display (cosmetic only) ----------
  // Purely visual: shows the chosen filename next to the "Choose File" pill.
  // Does not touch the file input's id/name/required/accept, and does not
  // interfere with main.js's own file-size/type validation or upload logic.
  var fileNameTags = document.querySelectorAll("[data-rd-filename]");
  fileNameTags.forEach(function (tag) {
    var inputId = tag.getAttribute("data-rd-filename");
    var input = document.getElementById(inputId);
    if (!input) return;
    input.addEventListener("change", function () {
      tag.textContent = input.files && input.files[0] ? input.files[0].name : "No file chosen";
    });
  });

  // ---------- Success page order reference (cosmetic only, client-side) ----------
  var refTag = document.querySelector("[data-rd-order-ref]");
  if (refTag) {
    refTag.textContent = "#" + Math.random().toString(36).substring(2, 8).toUpperCase();
  }
})();
