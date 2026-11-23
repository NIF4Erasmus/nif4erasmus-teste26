document.addEventListener("DOMContentLoaded", () => {
  const sections = document.querySelectorAll("section");
  const navLinks = document.querySelectorAll("nav ul li a");
  const hamburger = document.querySelector(".hamburger");
  const nav = document.querySelector("nav");

  let lastKnownScrollY = window.scrollY;
  let ticking = false;
  let scrollPosition = 0;

  // Firebase Configuration
  const firebaseConfig = {
    apiKey: "AIzaSyD4d93ABAaV4dikgtjLmz7k4Vx6-JUChGs",
    authDomain: "nif4erasmus-3fb80.firebaseapp.com",
    projectId: "nif4erasmus-3fb80",
    storageBucket: "nif4erasmus-3fb80.firebasestorage.app",
    messagingSenderId: "53708558332",
    appId: "1:53708558332:web:fbf84088da99ffdfacec79",
    measurementId: "G-5GFPK7SM1T",
  };
  const STRIPE_PAYMENT_LINKS = {
    nifOnly: "https://buy.stripe.com/test_dRm00ibuL5Yk44ZgKjbsc01",
    nifAndTax: "https://buy.stripe.com/test_28E8wO1Ub1I40SN2Ttbsc02",
  };

  // Initialize Firebase (guarded: if the SDK is blocked/offline the rest of the site must still work)
  let storage = null;
  if (typeof firebase !== "undefined") {
    firebase.initializeApp(firebaseConfig);
    storage = firebase.storage();
    try { storage.setMaxUploadRetryTime(60000); } catch (e) {}
  }

  // Initialize EmailJS
  (function () {
    if (typeof emailjs !== "undefined") emailjs.init("4p7vp9ScdkLBP_9fx");
  })();

  // Update the uploadFile function to use the storage reference
  async function uploadFile(file, path) {
    try {
      if (!storage) throw new Error("Firebase Storage is not available");
      // Add metadata to track uploads
      const metadata = {
        customMetadata: {
          uploadTime: new Date().toISOString(),
          fileType: file.type,
        },
      };

      const storageRef = storage.ref(path);
      const snapshot = await storageRef.put(file, metadata);
      //const metadataResult = await snapshot.ref.getMetadata();
      //console.log("File uploaded successfully:", metadataResult);
      return true; //"https://console.firebase.google.com/u/0/project/nif4erasmus-3fb80/storage/"+metadataResult.bucket+"/files//"+metadataResult.fullPath;
      //return await snapshot.ref.getDownloadURL();
    } catch (error) {
      console.error("Upload error:", error);
      throw error;
    }
  }

  // Function to update the active link based on the current URL or hash
  function updateActiveLink() {
    const currentPath = window.location.pathname; // Get the current page path
    const currentHash = window.location.hash; // Get the current hash (e.g., #services)

    navLinks.forEach((link) => {
      const linkPath = link.getAttribute("href");

      // Check if the link matches the current path or hash
      if (
        currentPath.includes(linkPath) || // Match for page links
        (linkPath.startsWith("#") && linkPath === currentHash) // Match for hash links
      ) {
        link.classList.add("active");
      } else {
        link.classList.remove("active");
      }
    });
  }
  // Add this at the start
  function updateScrollPadding() {
    const header = document.querySelector("header") || document.querySelector(".rd-nav");
    if (!header) return;
    const headerHeight = header.offsetHeight;
    const topMargin = 20; // The header's top margin
    const totalOffset = headerHeight + topMargin + 20; // Adding extra 20px for spacing

    document.documentElement.style.setProperty(
      "--scroll-padding",
      `${totalOffset}px`
    );
  }

  // Run on load
  updateScrollPadding();

  // Run on resize
  window.addEventListener("resize", updateScrollPadding);
  // ✅ Scroll event handler (optimized)
  function onScroll() {
    lastKnownScrollY = window.scrollY;

    if (!ticking) {
      window.requestAnimationFrame(() => {
        updateActiveLink();
        ticking = false;
      });

      ticking = true;
    }
  }

  window.addEventListener("scroll", onScroll);
  updateActiveLink(); // On load

  // Update active link on hash change (for in-page navigation)
  window.addEventListener("hashchange", updateActiveLink);

  // ✅ Smooth scroll fallback for older browsers (optional)
  navLinks.forEach((link) => {
    link.addEventListener("click", function (e) {
      const targetId = this.getAttribute("href");
      const target = document.querySelector(targetId);

      if (target) {
        // Optional: fallback if smooth behavior not supported
        if (!("scrollBehavior" in document.documentElement.style)) {
          e.preventDefault();
          window.scrollTo({
            top: target.offsetTop - 140, // Adjust if needed
            behavior: "smooth",
          });
        }

        // Immediate active class (optional)
        navLinks.forEach((l) => l.classList.remove("active"));
        this.classList.add("active");
      }
    });
  });

  function lockScroll() {
    // Store current scroll position
    scrollPosition = window.pageYOffset;
    const body = document.body;
    // Add styles to lock the body
    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${scrollPosition}px`;
    body.style.width = "100%";
  }

  function unlockScroll() {
    const body = document.body;
    // Remove scroll lock styles
    body.style.removeProperty("overflow");
    body.style.removeProperty("position");
    body.style.removeProperty("top");
    body.style.removeProperty("width");
    // Restore scroll position
    window.scrollTo(0, scrollPosition);
  }

  // Legacy header only: the redesigned pages use redesign.js for the mobile menu
  if (hamburger && nav) {
    hamburger.addEventListener("click", function () {
      hamburger.classList.toggle("active");
      nav.classList.toggle("active");
      document.body.classList.toggle("no-scroll");

      if (nav.classList.contains("active")) {
        lockScroll();
      } else {
        unlockScroll();
      }
    });
  }

  navLinks.forEach((link) => {
    link.addEventListener("click", function () {
      if (!hamburger || !nav) return;
      hamburger.classList.remove("active");
      nav.classList.remove("active");
      document.body.classList.remove("no-scroll");
      unlockScroll();
    });
  });

  // Close menu when clicking outside
  document.addEventListener("click", function (event) {
    if (
      hamburger &&
      nav &&
      !hamburger.contains(event.target) &&
      !nav.contains(event.target) &&
      nav.classList.contains("active")
    ) {
      hamburger.classList.remove("active");
      nav.classList.remove("active");
      document.body.classList.remove("no-scroll");
      unlockScroll();
    }
  });

  // FAQ Toggle functionality
  document.querySelectorAll(".faq-question").forEach((button) => {
    button.addEventListener("click", () => {
      const answer = button.nextElementSibling;
      const isOpen = answer.classList.contains("open");

      // Close all answers first
      document.querySelectorAll(".faq-answer").forEach((a) => {
        a.classList.remove("open");
      });
      document.querySelectorAll(".faq-question").forEach((q) => {
        q.classList.remove("active");
      });

      // Toggle current answer if it wasn't open
      if (!isOpen) {
        answer.classList.add("open");
        button.classList.add("active");
      }
    });
  });

  // Form submission handler
  const contactForm = document.getElementById("contact-form");
  if (contactForm) {
    contactForm.addEventListener("submit", function (event) {
      event.preventDefault();

      // Verify reCAPTCHA
      const recaptchaResponse =
        typeof grecaptcha !== "undefined" ? grecaptcha.getResponse() : "";
      if (!recaptchaResponse) {
        document.getElementById("form-status").textContent =
          "Please verify that you are not a robot.";
        document.getElementById("form-status").className = "form-status error";
        return;
      }

      // Get form data
      const serviceField = document.getElementById("service");
      const formData = {
        name: document.getElementById("name").value,
        email: document.getElementById("email").value,
        service: serviceField ? serviceField.value : "",
        message: document.getElementById("message").value,
        submitTime: new Date().toLocaleString(),
      };

      // Show loading status
      document.getElementById("form-status").textContent = "Sending...";
      document.getElementById("form-status").className = "form-status sending";

      // Send email using EmailJS
      // Replace with your service ID and template ID
      emailjs.send("service_2o3ozpv", "template_r7k657e", formData).then(
        function (response) {
          document.getElementById("form-status").textContent =
            "Message sent successfully!";
          document.getElementById("form-status").className =
            "form-status success";
          contactForm.reset();
          if (typeof grecaptcha !== "undefined") grecaptcha.reset();
        },
        function (error) {
          document.getElementById("form-status").textContent =
            "Failed to send message. Please try again.";
          document.getElementById("form-status").className =
            "form-status error";
          console.error("EmailJS error:", error);
        }
      );
    });
  }

  // =====================================================================
  // Order form (form.html) — 6-step wizard: Service → Personal Details →
  // Address → Contact → Who told you about us? → Review
  // Keeps: Firebase Storage uploads under documents/<email>/..., the Stripe
  // payment links, and the sessionStorage "formSubmission" hand-off that
  // success.html sends through EmailJS (template_11dv42p).
  // =====================================================================
  const form = document.getElementById("personalInfoForm");
  if (form) {
    const TOTAL_STEPS = 6;
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    const sections = form.querySelectorAll(".form-section");
    const progressSteps = form.querySelectorAll(".progress-step");
    const submitBtn = form.querySelector(".submit-btn");
    const nextStep1Btn = form.querySelector('.form-section[data-step="1"] .next-btn');
    let currentStep = 1;

    const el = (id) => document.getElementById(id);
    const val = (id) => (el(id) ? el(id).value.trim() : "");
    const isChecked = (id) => !!(el(id) && el(id).checked);

    const DOC_LABELS = { national_id: "National ID Card", passport: "Passport" };
    const SERVICE_INFO = {
      nifOnly: {
        price: "64,00 €",
        short: "NIF (64 €)",
        turnaround: "NIF Only",
        description:
          "NIF (EU/EEA CITIZENS, OR NON-EU CITIZENS WITH A RESIDENCE PERMIT IN AN EU COUNTRY)",
      },
      nifAndTax: {
        price: "105,00 €",
        short: "NIF & Tax Rep (105 €)",
        turnaround: "NIF + Tax Rep",
        description: "NIF and TAX REPRESENTATION (NON UE/EEA CITIZEN)",
      },
    };

    function selectedService() {
      const r = form.querySelector('input[name="service"]:checked');
      return r ? r.value : "";
    }
    function isMinor() {
      const v = val("dateOfBirth");
      if (!v) return false;
      const dob = new Date(v);
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const m = today.getMonth() - dob.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
      return age < 18;
    }
    function isNonEu() {
      const r = form.querySelector('input[name="isEuCitizen"]:checked');
      return !!r && r.value === "no";
    }

    // ---------- identification document rules ----------
    // "NIF and Tax Representative" (non-EU/EEA citizens): only a Passport is accepted.
    function applyServiceRules() {
      const sel = el("documentType");
      if (!sel) return;
      const passportOnly = selectedService() === "nifAndTax";
      Array.from(sel.options).forEach((o) => {
        if (o.value === "national_id") {
          o.disabled = passportOnly;
          o.hidden = passportOnly;
        }
      });
      if (passportOnly && sel.value !== "passport") sel.value = "passport";
    }
    function todayISO() {
      const d = new Date();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return d.getFullYear() + "-" + m + "-" + day;
    }
    // Document must be valid for at least 7 more days from the day of filling
    function minExpiryISO() {
      const d = new Date();
      d.setDate(d.getDate() + 7);
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return d.getFullYear() + "-" + m + "-" + day;
    }
    function isExpired() {
      const v = val("documentExpiry");
      return !!v && v < minExpiryISO();
    }
    function refreshExpiry() {
      const input = el("documentExpiry");
      if (!input) return;
      input.min = minExpiryISO();
      const dob = el("dateOfBirth");
      if (dob) dob.max = todayISO();
      const hint = el("expiryHint");
      if (hint) hint.hidden = !isExpired();
      input.classList.toggle("error", isExpired());
    }
    // Country-code field: must be one of the options of the list
    function refreshPhoneCode() {
      const input = el("phoneCode");
      const list = el("phoneCodeList");
      if (!input || !list) return;
      const ok = Array.from(list.options).some((o) => o.value === input.value);
      input.setCustomValidity(!input.value || ok ? "" : "Please choose a country code from the list.");
    }

    // ---------- conditional blocks ----------
    function setBlock(blockId, show, requiredIds) {
      const block = el(blockId);
      if (!block) return;
      block.hidden = !show;
      (requiredIds || []).forEach((id) => {
        if (el(id)) el(id).required = show;
      });
    }
    function refreshConditionals() {
      setBlock("visaBlock", isNonEu(), ["visaFile"]);
      setBlock("minorBlock", isMinor(), ["birthCertificate", "parentPassport"]);
      const nonEuNote = el("minorNonEuNote");
      if (nonEuNote) nonEuNote.hidden = !isNonEu();
      applyServiceRules();
      refreshExpiry();
      const otherBox = el("other");
      setBlock("otherSourceWrap", !!(otherBox && otherBox.checked), []);
      // country-specific proof-of-address tip
      const country = val("country");
      form.querySelectorAll("[data-country-tip]").forEach((tip) => {
        tip.hidden = tip.getAttribute("data-country-tip") !== country;
      });
      const tipWrap = el("countryTipWrap");
      if (tipWrap) {
        tipWrap.hidden = !form.querySelector("[data-country-tip]:not([hidden])");
        const t = el("countryTipTitle");
        if (t) t.textContent = "Top choice for users from " + country;
      }
    }
    function refreshGates() {
      if (nextStep1Btn) {
        nextStep1Btn.classList.toggle(
          "is-incomplete",
          !(isChecked("acceptIdentity") && isChecked("acceptDisclaimer") && isChecked("acceptTerms"))
        );
      }
      if (submitBtn && !submitBtn.dataset.busy) {
        submitBtn.classList.toggle("is-incomplete", !isChecked("confirmReview"));
      }
    }

    // ---------- validation ----------
    function fieldLabel(f) {
      let lab = null;
      if (f.id) lab = form.querySelector('label[for="' + f.id + '"]');
      if (!lab || f.type === "radio" || f.type === "checkbox") {
        const grp = f.closest(".form-group");
        const gl = grp && grp.querySelector(":scope > label, :scope > h4");
        if (gl) lab = gl;
      }
      const t = (f.getAttribute("data-label") || (lab && lab.textContent) || f.name || "Field")
        .replace(/\*/g, "")
        .replace(/\s+/g, " ")
        .trim();
      return t;
    }
    function missingList(step) {
      const section = form.querySelector('.form-section[data-step="' + step + '"]');
      const out = [];
      const seen = new Set();
      if (!section) return out;
      section.querySelectorAll("input, select, textarea").forEach((f) => {
        if (f.closest("[hidden]")) return;
        if (f.checkValidity()) return;
        const key = f.type === "radio" ? "radio:" + f.name : f.id || f.name;
        if (seen.has(key)) return;
        seen.add(key);
        out.push(f.name === "service" ? "Service selection" : fieldLabel(f));
      });
      if (step === 5) {
        if (!form.querySelector('input[name="referralSource[]"]:checked')) {
          out.push("Who told you about us? (select at least one option)");
        } else if (isChecked("other") && !val("otherSource")) {
          out.push("Other (please specify)");
        }
      }
      return out;
    }
    function showErrors(step, items) {
      const section = form.querySelector('.form-section[data-step="' + step + '"]');
      if (!section) return;
      let box = section.querySelector(".rd-order-errors");
      if (!box) {
        box = document.createElement("div");
        box.className = "rd-order-errors";
        box.setAttribute("role", "alert");
        const nav = section.querySelector(".form-navigation:last-of-type") || section.lastElementChild;
        section.insertBefore(box, nav);
      }
      if (!items || !items.length) {
        box.hidden = true;
        box.innerHTML = "";
        return;
      }
      box.hidden = false;
      box.innerHTML = "<strong>Please complete all required information before proceeding:</strong><ul>" +
        items.map((i) => "<li>" + i.replace(/</g, "&lt;") + "</li>").join("") + "</ul>";
      box.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    // ---------- file checks (inline, immediate) ----------
    function fileProblem(f) {
      const label = f.getAttribute("data-label") || "File";
      const files = Array.from(f.files || []);
      if (files.length > 2) return label + ": you can attach a maximum of 2 files.";
      for (const file of files) {
        if (!/\.pdf$/i.test(file.name) && file.type !== "application/pdf") {
          return label + " must be a PDF file (photos and screenshots are not accepted). Please scan the document and save it as PDF.";
        }
        if (file.size === 0) return label + " is empty. Please choose the correct file.";
        if (file.size > MAX_SIZE) {
          return label + " is too large (" + (file.size / 1048576).toFixed(1) + " MB). Maximum allowed size is 5MB.";
        }
      }
      return "";
    }
    function fileMsgEl(f) {
      const wrap = f.closest(".rd-order-file") || f.parentElement;
      let m = wrap.parentElement.querySelector('.rd-file-error[data-for="' + f.id + '"]');
      if (!m) {
        m = document.createElement("p");
        m.className = "rd-file-error";
        m.dataset.for = f.id;
        m.setAttribute("role", "alert");
        wrap.insertAdjacentElement("afterend", m);
      }
      return m;
    }
    function setFileError(f, msg) {
      const m = fileMsgEl(f);
      m.textContent = msg || "";
      m.hidden = !msg;
      f.classList.toggle("error", !!msg);
    }
    // a real PDF starts with "%PDF" — catches photos renamed to .pdf
    function looksLikePdf(file) {
      return new Promise((resolve) => {
        try {
          const r = new FileReader();
          r.onload = () => resolve(String(r.result || "").indexOf("%PDF") === 0 || String(r.result || "").indexOf("%PDF") > -1);
          r.onerror = () => resolve(true);
          r.readAsText(file.slice(0, 1024));
        } catch (e) { resolve(true); }
      });
    }

    function findInvalid(step) {
      const section = form.querySelector('.form-section[data-step="' + step + '"]');
      if (!section) return null;
      const fields = section.querySelectorAll("input, select, textarea");
      for (const f of fields) {
        if (f.closest("[hidden]")) continue;
        if (f.type === "file" && f.files && f.files.length) {
          const msg = fileProblem(f);
          if (msg) return { el: f, msg: msg };
        }
      }
      const missing = missingList(step).map((m) =>
        m === "Document Expiry Date" && isExpired()
          ? "Document Expiry Date (must be valid for at least 7 more days)"
          : m === "Country code" && val("phoneCode")
          ? "Country code (choose one from the list)"
          : m
      );
      if (missing.length) return { list: missing, el: null };
      return null;
    }
    function reportInvalid(inv) {
      if (inv.list) {
        showErrors(currentStep, inv.list);
        return;
      }
      if (inv.el && inv.el.type === "file") setFileError(inv.el, inv.msg);
      else showErrors(currentStep, [inv.msg]);
      if (inv.el) inv.el.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    // ---------- review step ----------
    function setReview(key, text) {
      form.querySelectorAll('[data-review="' + key + '"]').forEach((n) => {
        n.textContent = text || "-";
      });
    }
    function fileRow(id, label) {
      const f = el(id);
      const files = f && f.files ? Array.from(f.files) : [];
      return { label: label, names: files.map((x) => x.name), ok: files.length > 0 };
    }
    function renderFiles(rows) {
      const box = form.querySelector("[data-review-files]");
      if (!box) return;
      const esc = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      const iconFile = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path><path d="M14 2v4a2 2 0 0 0 2 2h4"></path></svg>';
      const iconOk = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"></path></svg>';
      const iconNo = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><path d="M12 8v4M12 16h.01"></path></svg>';
      box.innerHTML = rows
        .map(
          (r) =>
            '<div class="rd-files__row' + (r.ok ? "" : " is-missing") + '">' +
            '<span class="rd-files__icon">' + iconFile + "</span>" +
            '<span class="rd-files__text"><span class="rd-files__label">' + esc(r.label) + "</span>" +
            '<span class="rd-files__name">' + (r.ok ? esc(r.names.join(", ")) : "No file selected") + "</span></span>" +
            '<span class="rd-files__badge ' + (r.ok ? "is-ok" : "is-missing") + '">' + (r.ok ? iconOk + " Attached" : iconNo + " Missing") + "</span>" +
            "</div>"
        )
        .join("");
    }
    function renderReview() {
      const svc = SERVICE_INFO[selectedService()] || {};
      setReview("service", svc.short);
      setReview("fullName", val("fullName"));
      setReview("sex", val("sex"));
      setReview("dateOfBirth", val("dateOfBirth"));
      setReview("nationality", val("nationality"));
      setReview("countryOfBirth", val("countryOfBirth"));
      setReview(
        "document",
        (DOC_LABELS[val("documentType")] || "-") + " (" + (val("documentNumber") || "-") + ")"
      );
      setReview("documentExpiry", val("documentExpiry"));
      setReview("issuingAuthority", val("issuingAuthority"));
      setReview(
        "address",
        [val("address"), (val("zipCode") + " " + val("city")).trim(), val("country")]
          .filter(Boolean)
          .join("\n")
      );
      setReview("email", val("email"));
      setReview("whatsapp", whatsappFull());
      const rows = [fileRow("idCard", "Identification document")];
      if (isNonEu()) rows.push(fileRow("visaFile", "Visa / Residence permit"));
      rows.push(fileRow("proofOfAddressInput", "Proof of address"));
      if (isMinor()) {
        rows.push(fileRow("birthCertificate", "Birth certificate"));
        rows.push(fileRow("parentPassport", "Both parents' ID / Passport"));
      }
      renderFiles(rows);
    }
    function phoneCodeOnly() {
      // option value looks like "+33 (France)" -> "+33"
      const v = val("phoneCode");
      return v ? v.split(" ")[0] : "";
    }
    function whatsappFull() {
      const code = phoneCodeOnly();
      const num = val("whatsapp");
      return code ? code + " " + num : num;
    }

    // ---------- navigation ----------
    function showStep(n) {
      currentStep = n;
      sections.forEach((s) => {
        s.classList.toggle("active", parseInt(s.dataset.step) === n);
      });
      progressSteps.forEach((p) => {
        const num = parseInt(p.dataset.step);
        p.classList.toggle("active", num <= n);
        p.classList.toggle("current", num === n);
      });
      applyServiceRules();
      refreshExpiry();
      refreshPhoneCode();
      if (n === TOTAL_STEPS) renderReview();
      refreshGates();
      const top = form.closest(".rd-order-card") || form;
      top.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    function goNext() {
      const inv = findInvalid(currentStep);
      if (inv) return reportInvalid(inv);
      showErrors(currentStep, null);
      if (currentStep < TOTAL_STEPS) showStep(currentStep + 1);
    }

    form.querySelectorAll(".next-btn").forEach((b) => b.addEventListener("click", goNext));
    form.querySelectorAll(".prev-btn").forEach((b) =>
      b.addEventListener("click", () => {
        const target = parseInt(b.dataset.goto) || currentStep - 1;
        if (target >= 1) showStep(target);
      })
    );
    form.addEventListener("change", () => {
      refreshPhoneCode();
      refreshConditionals();
      refreshGates();
    });
    form.addEventListener("input", (e) => {
      if (e.target && e.target.id === "dateOfBirth") refreshConditionals();
      if (e.target && e.target.id === "documentExpiry") refreshExpiry();
      if (e.target && e.target.id === "phoneCode") refreshPhoneCode();
    });
    // filename display next to the "Choose File" pill (cosmetic)
    form.querySelectorAll('input[type="file"]').forEach((input) => {
      input.addEventListener("change", async () => {
        const tag = form.querySelector('[data-rd-filename="' + input.id + '"]');
        let msg = fileProblem(input);
        if (!msg && input.files && input.files.length) {
          for (const file of input.files) {
            if (!(await looksLikePdf(file))) {
              msg = (input.getAttribute("data-label") || "File") + " does not look like a valid PDF. Please scan the document and save it as PDF.";
              break;
            }
          }
        }
        if (msg) {
          input.value = "";
          if (tag) tag.textContent = "No file chosen";
          setFileError(input, msg);
          return;
        }
        setFileError(input, "");
        if (tag) tag.textContent = input.files && input.files.length ? Array.from(input.files).map((f) => f.name).join(", ") : "No file chosen";
      });
    });

    // ---------- submit ----------
    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      // Pressing Enter inside a field on steps 1–5 must behave like "Next"
      if (currentStep !== TOTAL_STEPS) {
        goNext();
        return;
      }
      for (let s = 1; s < TOTAL_STEPS; s++) {
        const inv = findInvalid(s);
        if (inv) {
          showStep(s);
          reportInvalid(inv);
          return;
        }
      }
      if (!isChecked("confirmReview")) {
        showErrors(TOTAL_STEPS, [
          "Please confirm that you have reviewed all the information above (tick the confirmation box).",
        ]);
        return;
      }
      showErrors(TOTAL_STEPS, null);

      const setBusy = (busy) => {
        if (busy) {
          submitBtn.dataset.busy = "1";
          submitBtn.disabled = true;
          submitBtn.innerHTML = 'Uploading documents<span class="dot-anim"></span>';
        } else {
          delete submitBtn.dataset.busy;
          submitBtn.textContent = "Proceed to Payment";
          refreshGates();
        }
      };
      setBusy(true);

      try {
        const service = selectedService();
        const paymentLink = STRIPE_PAYMENT_LINKS[service];
        if (!paymentLink) throw new Error("Invalid service selection");
        const svc = SERVICE_INFO[service];
        const email = val("email");
        const ts = Date.now();
        const folder = "documents/" + email + "/";
        const nonEu = isNonEu();
        const minor = isMinor();

        // 1) Upload documents to Firebase Storage (same folder convention as before)
        const total = 2 + (nonEu ? 1 : 0) + (minor ? 2 : 0);
        let done = 0;
        const progress = () => {
          submitBtn.innerHTML = "Uploading documents (" + Math.min(++done, total) + "/" + total + ")<span class=\"dot-anim\"></span>";
        };
        await uploadFile(el("idCard").files[0], folder + "id-card-" + ts);
        progress();
        await uploadFile(el("proofOfAddressInput").files[0], folder + "proof-address-" + ts);
        progress();
        if (nonEu) {
          await uploadFile(el("visaFile").files[0], folder + "visa-residence-permit-" + ts);
          progress();
        }
        if (minor) {
          await uploadFile(el("birthCertificate").files[0], folder + "birth-certificate-" + ts);
          progress();
          const pFiles = Array.from(el("parentPassport").files).slice(0, 2);
          for (let i = 0; i < pFiles.length; i++) {
            await uploadFile(
              pFiles[i],
              folder + "parent-passport" + (pFiles.length > 1 ? "-" + (i + 1) : "") + "-" + ts
            );
          }
          progress();
        }

        const firebaseConsoleUrl =
          "https://console.firebase.google.com/u/0/project/nif4erasmus-3fb80/storage/nif4erasmus-3fb80.firebasestorage.app/files/~2Fdocuments~2F" +
          email;
        const NA = "Not applicable";

        // 2) Data handed to success.html → EmailJS (template_11dv42p).
        //    Existing keys are unchanged; new ones are added.
        const formDataObject = {
          personalDetails: {
            fullName: val("fullName"),
            sex: val("sex"),
            dateOfBirth: val("dateOfBirth"),
            nationality: val("nationality"),
            countryOfBirth: val("countryOfBirth"),
            documentType: DOC_LABELS[val("documentType")] || val("documentType"),
            documentNumber: val("documentNumber"),
            documentExpiry: val("documentExpiry"),
            issuingAuthority: val("issuingAuthority"),
            idCard: firebaseConsoleUrl,
            isEuCitizen: nonEu ? "No" : "Yes",
            visaResidencePermit: nonEu ? firebaseConsoleUrl : NA,
            isMinor: minor ? "Yes" : "No",
            birthCertificate: minor ? firebaseConsoleUrl : NA,
            parentPassport: minor ? firebaseConsoleUrl : NA,
          },
          addressInformation: {
            address: val("address"),
            zipCode: val("zipCode"),
            city: val("city"),
            country: val("country"),
            proofOfAddress: firebaseConsoleUrl,
          },
          contactInformation: {
            email: email,
            whatsapp: whatsappFull(),
            phoneCode: phoneCodeOnly(),
            whatsappNumber: val("whatsapp"),
          },
          serviceDetails: {
            type: service,
            price: svc.price,
            description: svc.description,
            selectedService: service,
          },
          consents: {
            identityVerification: "Accepted",
            privateServiceProvider: "Accepted",
            termsAndPrivacy: "Accepted",
            reviewedInformation: "Confirmed",
          },
          referralInfo: {
            source: Array.from(
              form.querySelectorAll('input[name="referralSource[]"]:checked')
            )
              .map((cb) => {
                if (cb.id === "other") {
                  const t = val("otherSource");
                  return t ? "Other: " + t : "Other";
                }
                return cb.value;
              })
              .join(", "),
          },
          submitTime: new Date().toLocaleString(),
        };
        sessionStorage.setItem("formSubmission", JSON.stringify(formDataObject));

        // 3) Redirect to the Stripe payment link, returning to success.html
        const successUrl = new URL("success.html", window.location.href);
        successUrl.searchParams.append("payment_status", "success");
        successUrl.searchParams.append("service", service);
        const stripeUrl = new URL(paymentLink);
        stripeUrl.searchParams.append("success_url", successUrl.toString());
        window.location.href = stripeUrl.toString();
      } catch (error) {
        console.error("Error:", error);
        setBusy(false);
        showErrors(TOTAL_STEPS, [
          "We could not upload your documents. Please check your internet connection and try again. Nothing was charged. If the problem continues, contact us at info@nif4erasmus.com.",
        ]);
      }
    });

    // ---------- email typo hint (clients often mistype their email; confirmations go there) ----------
    (function () {
      const input = el("email");
      if (!input) return;
      const FIX = {
        "gmial.com": "gmail.com", "gmai.com": "gmail.com", "gmal.com": "gmail.com", "gamil.com": "gmail.com",
        "gnail.com": "gmail.com", "gmail.co": "gmail.com", "gmail.con": "gmail.com", "gmail.cm": "gmail.com", "gmail.es": "gmail.com",
        "hotmial.com": "hotmail.com", "hotmal.com": "hotmail.com", "hotmail.con": "hotmail.com", "hotmai.com": "hotmail.com",
        "outlok.com": "outlook.com", "outlook.con": "outlook.com", "outllok.com": "outlook.com",
        "yahooo.com": "yahoo.com", "yaho.com": "yahoo.com", "yahoo.con": "yahoo.com",
        "icloud.con": "icloud.com", "iclod.com": "icloud.com",
      };
      const hint = document.createElement("p");
      hint.className = "rd-file-error rd-email-hint";
      hint.hidden = true;
      input.insertAdjacentElement("afterend", hint);
      function check() {
        const v = input.value.trim();
        const at = v.lastIndexOf("@");
        const dom = at > 0 ? v.slice(at + 1).toLowerCase() : "";
        if (FIX[dom]) {
          // already showing this suggestion: do not re-render (a tap on the button fires blur first)
          if (!hint.hidden && hint.dataset.sug === v.slice(0, at + 1) + FIX[dom]) return;
          hint.dataset.sug = v.slice(0, at + 1) + FIX[dom];
          hint.innerHTML = "";
          hint.append("Did you mean ");
          const b = document.createElement("button");
          b.type = "button";
          b.className = "rd-email-fix";
          b.textContent = v.slice(0, at + 1) + FIX[dom];
          b.addEventListener("click", () => {
            input.value = b.textContent;
            hint.hidden = true;
            refreshGates();
          });
          hint.append(b, "? Your confirmation is sent to this address.");
          hint.hidden = false;
        } else {
          hint.hidden = true;
        }
      }
      input.addEventListener("blur", check);
      input.addEventListener("input", () => { if (!hint.hidden) check(); });
    })();

    // Coming back from Stripe with the browser's Back button must not leave the button stuck
    window.addEventListener("pageshow", (ev) => {
      if (ev.persisted && submitBtn && submitBtn.dataset.busy) {
        delete submitBtn.dataset.busy;
        submitBtn.disabled = false;
        submitBtn.textContent = "Proceed to Payment";
        refreshGates();
      }
    });

    // initial state
    refreshConditionals();
    showStepInitial();
    function showStepInitial() {
      sections.forEach((s) => s.classList.toggle("active", parseInt(s.dataset.step) === 1));
      progressSteps.forEach((p) => {
        const num = parseInt(p.dataset.step);
        p.classList.toggle("active", num <= 1);
        p.classList.toggle("current", num === 1);
      });
      refreshGates();
    }
  }
  // Initialize phone input
  // Contact form handling - Only run if elements exist
  const callbackPhone = document.querySelector("#callback-phone");
  const contactBtn = document.querySelector(".contact-btn");

  if (callbackPhone && contactBtn && window.intlTelInput) {
    const phoneInput = window.intlTelInput(
      document.querySelector("#callback-phone"),
      {
        preferredCountries: ["pt", "es", "fr", "de", "it"],
        initialCountry: "pt",
        separateDialCode: true,
        utilsScript:
          "https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/17.0.8/js/utils.js",
      }
    );

    // Create error message element
    const phoneWrap =
      callbackPhone.closest(".phone-input") ||
      (callbackPhone.closest(".iti") && callbackPhone.closest(".iti").parentElement) ||
      callbackPhone.parentElement;
    let errorMsg = phoneWrap.querySelector(".phone-error-msg");
    if (!errorMsg) {
      // Only create if it doesn't exist
      errorMsg = document.createElement("div");
      errorMsg.className = "phone-error-msg";
      errorMsg.style.cssText = "color:#f87171;font-size:0.75rem;margin-top:0.35rem;";
      phoneWrap.appendChild(errorMsg);
    }
    errorMsg.style.display = "none";

    // Replace the error messages with more professional ones
    const errorMap = [
      "Please enter a complete phone number",
      "This country code is not valid",
      "Phone number is too short",
      "Phone number is too long",
      "Please enter a valid phone number for this country",
    ];

    // Validation function
    const validatePhoneNumber = () => {
      const phoneField = document.querySelector("#callback-phone");
      phoneField.classList.remove("error", "valid");
      errorMsg.style.display = "none";

      if (phoneField.value.trim()) {
        if (phoneInput.isValidNumber()) {
          phoneField.classList.add("valid");
          return true;
        } else {
          phoneField.classList.add("error");
          const errorCode = phoneInput.getValidationError();
          errorMsg.textContent =
            errorMap[errorCode] || "Please provide a valid phone number";
          errorMsg.style.display = "block";
        }
      }
      return false;
    };

    // Add validation on input
    document
      .querySelector("#callback-phone")
      .addEventListener("input", validatePhoneNumber);
    document
      .querySelector("#callback-phone")
      .addEventListener("blur", validatePhoneNumber);

    // Validate phone number on form submit
    const contactButton = document.querySelector(".contact-btn");
    if (contactButton) {
      contactButton.addEventListener("click", function () {
        if (validatePhoneNumber()) {
          const fullNumber = phoneInput.getNumber();

          // Show loading state
          this.textContent = "Sending...";
          this.disabled = true;

          // Send email using EmailJS
          emailjs
            .send(
              "service_2o3ozpv", // Your service ID
              "template_r7k657e", // Replace with your template ID from EmailJS
              {
                email: fullNumber,
                name: "Callback Request",
                message: "Please contact me via WhatsApp.",
                submitTime: new Date().toLocaleString(),
              }
            )
            .then(
              (response) => {
                // Success
                alert("Thank you! We'll contact you soon via WhatsApp.");
                document.querySelector("#callback-phone").value = "";
                this.textContent = "Contact me";
                this.disabled = false;
              },
              (error) => {
                // Error
                alert("Sorry, there was an error. Please try again.");
                console.error("EmailJS error:", error);
                this.textContent = "Contact me";
                this.disabled = false;
              }
            );
        }
      });
    }
  }
  // Handle success page logic

  console.log("Current pathname:", window.location.pathname);
  if (window.location.pathname.includes("success.html")) {
    const formDataString = sessionStorage.getItem("formSubmission");
    console.log("Retrieved form data:", formDataString);

    if (formDataString) {
      try {
        // Parse the stored JSON string back to an object
        const formData = JSON.parse(formDataString);
        console.log("Parsed form data:", formData);

        // Send email with the parsed form data (one automatic retry if the first attempt fails)
        const sendOrder = (attempt) =>
          emailjs.send("service_2o3ozpv", "template_11dv42p", formData).then(
            function (response) {
              console.log("Email sent successfully:", response);
              sessionStorage.removeItem("formSubmission");
            },
            function (error) {
              console.error("Failed to send email (attempt " + attempt + "):", error);
              if (attempt < 3) setTimeout(() => sendOrder(attempt + 1), 4000 * attempt);
            }
          );
        sendOrder(1);
      } catch (error) {
        console.error("Error parsing form data:", error);
      }
    } else {
      // Redirect to home if no form data
      window.location.href = "index.html";
    }
  }

  // Add the Intersection Observer code here
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("active");
        }
      });
    },
    {
      threshold: 0.1,
      rootMargin: "0px 0px -50px 0px",
    }
  );

  // Observe all elements with fade-in-up class
  document
    .querySelectorAll(".fade-in-up, .fade-in-left, .fade-in-right")
    .forEach((el) => {
      observer.observe(el);
    });
});
