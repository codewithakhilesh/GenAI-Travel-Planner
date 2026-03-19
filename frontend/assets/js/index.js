/* ==========================================================
   GoYatra – MASTER JS (ALL PAGES SAFE) ✅
   ✅ ONE dropdown logic only (no duplicates)
   ✅ Dropdown clickable fix (img/span pointer)
========================================================== */

document.addEventListener("DOMContentLoaded", function () {

  /* ===============================
     1) HEADER MENU + USER DROPDOWN (ALL PAGES)
  =============================== */
  (function initHeaderMenu() {
    const header = document.getElementById("siteHeader") || document.querySelector("header");
    if (!header) return;

    const navToggleBtn = document.getElementById("navToggleBtn");
    const mainNav = document.getElementById("mainNav") || header.querySelector("nav");

    const userBtn = document.getElementById("userMenuBtn");
    const userDropdown = document.getElementById("userDropdown");

    const isMobile = () => window.matchMedia("(max-width: 768px)").matches;

    function setAria(btn, expanded) {
      if (!btn) return;
      btn.setAttribute("aria-expanded", expanded ? "true" : "false");
    }

    function closeMenu() {
      header.classList.remove("menu-open");
      setAria(navToggleBtn, false);
    }

    function toggleMenu() {
      const open = header.classList.toggle("menu-open");
      setAria(navToggleBtn, open);
      // menu open => dropdown close
      if (open && userDropdown) {
        userDropdown.classList.remove("active");
        setAria(userBtn, false);
      }
    }

    function closeDropdown() {
      if (!userDropdown) return;
      userDropdown.classList.remove("active");
      setAria(userBtn, false);
    }

    function toggleDropdown() {
      if (!userDropdown) return;
      const open = userDropdown.classList.toggle("active");
      setAria(userBtn, open);

      // desktop pe dropdown open => menu close
      if (open && !isMobile()) closeMenu();
    }

    // ✅ IMPORTANT FIX: make click always hit the button (even when clicking img/span)
    // This prevents "click not firing" issues.
    if (userBtn && !userBtn.dataset.clickFix) {
      userBtn.dataset.clickFix = "1";
      const inner = userBtn.querySelectorAll("img, span, svg");
      inner.forEach((el) => {
        el.style.pointerEvents = "none";
      });
      userBtn.style.pointerEvents = "auto";
    }

    // Mobile menu toggle
    if (navToggleBtn && !navToggleBtn.dataset.bound) {
      navToggleBtn.dataset.bound = "1";
      navToggleBtn.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        toggleMenu();
      }, true); // capture => overlay/bubble issues reduce
    }

    // User dropdown toggle
    if (userBtn && userDropdown && !userBtn.dataset.bound) {
      userBtn.dataset.bound = "1";

      userBtn.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        toggleDropdown();
      }, true); // capture

      // click inside dropdown => don't close
      userDropdown.addEventListener("click", function (e) {
        e.stopPropagation();
      }, true);
    }

    // ONE outside click handler (no duplicates)
    if (!document.body.dataset.menuOutsideBound) {
      document.body.dataset.menuOutsideBound = "1";

      document.addEventListener("click", function (e) {
        // Close dropdown if click outside (userBtn + dropdown)
        if (userDropdown && userBtn) {
          const insideUser = userDropdown.contains(e.target) || userBtn.contains(e.target);
          if (!insideUser) closeDropdown();
        }

        // Close mobile menu if click outside header
        if (header && !header.contains(e.target)) closeMenu();
      }, true); // capture
    }

    // ESC closes both
    if (!document.body.dataset.escBound) {
      document.body.dataset.escBound = "1";
      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") {
          closeDropdown();
          closeMenu();
        }
      });
    }

    // Scroll => header scrolled class
    function onScroll() {
      if (window.scrollY > 10) header.classList.add("scrolled");
      else header.classList.remove("scrolled");
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    // Resize safety: desktop pe menu close
    window.addEventListener("resize", function () {
      if (!isMobile()) closeMenu();
    });

  })();


  /* ===============================
     2) NATIONAL BANNER SLIDER (ONLY WHEN EXISTS)
  =============================== */
  (function initBannerSlider() {
    const slides = document.querySelectorAll(".banner-slides .slide");
    if (!slides || slides.length === 0) return;

    let index = 0;
    slides.forEach(s => s.classList.remove("active"));
    slides[0].classList.add("active");

    setInterval(() => {
      slides[index].classList.remove("active");
      index = (index + 1) % slides.length;
      slides[index].classList.add("active");
    }, 3000);
  })();


  /* ===============================
     3) INTERNATIONAL STACK (ONLY WHEN EXISTS)
  =============================== */
  (function initInternationalStack() {
    const stack = document.getElementById("internationalStack");
    const nextBtn = document.getElementById("stackNextBtn");
    if (!stack || !nextBtn) return;

    const images = [
      "assets/images/International/1.jpg",
      "assets/images/International/2.jpg",
      "assets/images/International/3.jpg",
      "assets/images/International/4.jpeg",
      "assets/images/International/5.jpg",
    ];

    const s1 = stack.querySelector(".stack-photo.s1 img");
    const s2 = stack.querySelector(".stack-photo.s2 img");
    const s3 = stack.querySelector(".stack-photo.s3 img");
    const s4 = stack.querySelector(".stack-photo.s4 img");
    const s5 = stack.querySelector(".stack-photo.s5 img");
    if (!s1 || !s2 || !s3 || !s4 || !s5) return;

    let index = 0;

    function setLayerSources() {
      s1.src = images[index % images.length];
      s2.src = images[(index + 1) % images.length];
      s3.src = images[(index + 2) % images.length];
      s4.src = images[(index + 3) % images.length];
      s5.src = images[(index + 4) % images.length];
    }

    setLayerSources();

    function nextImage() {
      const frontCard = stack.querySelector(".stack-photo.s1");
      if (!frontCard) return;

      frontCard.style.opacity = "0.0";
      frontCard.style.transform = "translateY(6px)";

      setTimeout(() => {
        index = (index + 1) % images.length;
        setLayerSources();
        frontCard.style.opacity = "1";
        frontCard.style.transform = "translateY(0)";
      }, 180);
    }

    if (!nextBtn.dataset.bound) {
      nextBtn.dataset.bound = "1";
      nextBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        nextImage();
      });
    }
  })();


  /* ===============================
     4) FROM ↔ TO SWAP (ONLY WHEN EXISTS)
  =============================== */
  (function initSwap() {
    const fromInput = document.getElementById("from");
    const toInput = document.getElementById("to");
    const swapBtn = document.querySelector(".swap-box");
    if (!fromInput || !toInput || !swapBtn) return;

    if (swapBtn.dataset.bound) return;
    swapBtn.dataset.bound = "1";

    swapBtn.addEventListener("click", function () {
      const temp = fromInput.value;
      fromInput.value = toInput.value;
      toInput.value = temp;
    });
  })();


  /* ===============================
     5) CUSTOM SELECT (ONLY WHEN EXISTS)
  =============================== */
  function setDropdownPosition(box) {
    const dd = box.querySelector(".select-dropdown");
    if (!dd) return;

    const rect = box.getBoundingClientRect();
    dd.style.visibility = "hidden";
    dd.style.display = "block";

    const ddHeight = dd.offsetHeight;
    const spaceAbove = rect.top;

    dd.style.display = "";
    dd.style.visibility = "";

    if (spaceAbove >= ddHeight + 12) {
      dd.style.top = "auto";
      dd.style.bottom = "calc(100% + 8px)";
    } else {
      dd.style.bottom = "auto";
      dd.style.top = "calc(100% + 8px)";
    }
  }

  function setupCustomSelect(selectBoxId, valueTextId, hiddenInputId) {
    const box = document.getElementById(selectBoxId);
    if (!box) return;

    const head = box.querySelector(".select-head");
    const items = box.querySelectorAll(".select-item");
    const textEl = document.getElementById(valueTextId);
    const hiddenInput = document.getElementById(hiddenInputId);
    if (!head || !items.length || !textEl || !hiddenInput) return;

    if (box.dataset.bound) return;
    box.dataset.bound = "1";

    head.addEventListener("click", (e) => {
      e.stopPropagation();

      document.querySelectorAll(".custom-select.open").forEach((d) => {
        if (d !== box) d.classList.remove("open");
      });

      box.classList.toggle("open");
      if (box.classList.contains("open")) setDropdownPosition(box);
    });

    items.forEach((item) => {
      item.addEventListener("click", () => {
        textEl.textContent = item.innerText.trim();
        hiddenInput.value = item.dataset.value || "";
        box.classList.remove("open");
      });
    });
  }

  setupCustomSelect("peopleSelect", "peopleValue", "people");
  setupCustomSelect("travelTypeSelect", "travelTypeValue", "travelType");
  setupCustomSelect("transportSelect", "transportValue", "transport");

  document.addEventListener("click", () => {
    document.querySelectorAll(".custom-select.open").forEach((d) => d.classList.remove("open"));
  });

  window.addEventListener("resize", () => {
    document.querySelectorAll(".custom-select.open").forEach(setDropdownPosition);
  });

  window.addEventListener(
    "scroll",
    () => {
      document.querySelectorAll(".custom-select.open").forEach(setDropdownPosition);
    },
    true
  );


  /* ===============================
     6) SCROLL REVEAL (ALL PAGES SAFE)
  =============================== */
  (function initScrollReveal() {
    const luxHeads = document.querySelectorAll(".lux-heading");
    const reveals = document.querySelectorAll(".reveal");
    if (!luxHeads.length && !reveals.length) return;

    function splitHeading(el) {
      if (!el || el.dataset.splitted === "1") return;
      el.dataset.splitted = "1";

      const nodes = Array.from(el.childNodes);
      el.innerHTML = "";
      let idx = 0;

      nodes.forEach(node => {
        if (node.nodeType === Node.TEXT_NODE) {
          const words = node.textContent.replace(/\s+/g, " ").split(" ");
          words.forEach(w => {
            if (!w) return;
            const unit = document.createElement("span");
            unit.className = "unit";
            unit.textContent = w;
            unit.style.transitionDelay = `${idx * 110}ms`;
            idx++;
            el.appendChild(unit);
            el.appendChild(document.createTextNode(" "));
          });
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          const unit = document.createElement("span");
          unit.className = "unit";
          unit.style.transitionDelay = `${idx * 110}ms`;
          idx++;
          unit.appendChild(node.cloneNode(true));
          el.appendChild(unit);
          el.appendChild(document.createTextNode(" "));
        }
      });
    }

    luxHeads.forEach(splitHeading);

    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        const el = e.target;

        if (e.isIntersecting) {
          if (el.classList.contains("lux-heading")) el.classList.add("in-view");
          if (el.classList.contains("reveal")) {
            el.classList.remove("is-visible");
            void el.offsetWidth;
            el.classList.add("is-visible");
          }
        } else {
          if (el.classList.contains("lux-heading")) el.classList.remove("in-view");
          if (el.classList.contains("reveal")) el.classList.remove("is-visible");
        }
      });
    }, { threshold: 0.35 });

    luxHeads.forEach(el => io.observe(el));
    reveals.forEach(el => io.observe(el));
  })();

});





/* ===============================
   ✅ GLOBAL AUTH ACTIONS (DELEGATION) - ALWAYS WORKS
   Logout + Delete Account (no binding issues)
================================ */
(function initGlobalAuthActions() {
  const TOKEN_KEY = "goyatra_token";
  const USER_KEY = "goyatra_user";
  const PENDING_TRIP_KEY = "goyatra_pending_trip";
  const LAST_PLAN_KEY = "goyatra_last_plan";

  // ✅ change these pages if your file names differ
  const LOGIN_PAGE = "login.html";
  const REGISTER_PAGE = "register.html";

  function clearSession() {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(PENDING_TRIP_KEY);
      localStorage.removeItem(LAST_PLAN_KEY);
    } catch (e) {}
  }

  function closestId(target, id) {
    if (!target) return null;
    return target.id === id ? target : target.closest("#" + id);
  }

  // ✅ Single capture listener => dropdown stopPropagation won't block it
  document.addEventListener(
    "click",
    async function (e) {
      const logoutHit = closestId(e.target, "logoutBtn");
      const deleteHit = closestId(e.target, "deleteAccountBtn");

      // --- LOGOUT ---
      if (logoutHit) {
        e.preventDefault();
        e.stopPropagation();

        console.log("[GoYatra] Logout clicked ✅");
        clearSession();

        // if login page not exists, change name here
        window.location.href = LOGIN_PAGE;
        return;
      }

      // --- DELETE ACCOUNT ---
      if (deleteHit) {
        e.preventDefault();
        e.stopPropagation();

        console.log("[GoYatra] Delete clicked ✅");

        const ok = confirm("Delete your account permanently? This cannot be undone.");
        if (!ok) return;

        // ✅ If you don't have backend delete route yet, at least local delete works
        clearSession();

        window.location.href = REGISTER_PAGE;
        return;
      }
    },
    true
  );
})();