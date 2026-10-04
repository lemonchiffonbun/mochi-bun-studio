/* ==========================================================
   Mochi Bun Studio: interactivity
   No libraries needed. Edit the CONFIG block below first.
   ========================================================== */

(() => {
  "use strict";

  /* ---------- EDIT ME ---------- */
  const CONFIG = {
    // Where "Email this to me" sends the request.
    // Leave it empty ("") to hide that button; visitors can still copy the message.
    email: "paktos@msn.com",

    studioName: "Mochi Bun Studio",

    // Prices are written in MXN in index.html. These turn them into approximate USD and EUR.
    // "1 / 18.5" means about 18.5 MXN per 1 USD. Update the numbers when the exchange rate moves.
    rates: { MXN: 1, USD: 1 / 18.5, EUR: 1 / 20 },
    defaultCurrency: "MXN",
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  /* ---------- Currency formatting ---------- */

  const SYMBOL = { MXN: "$", USD: "US$", EUR: "€" };
  let currency = CONFIG.defaultCurrency;

  function formatRange(minMxn, maxMxn, cur) {
    const rate = CONFIG.rates[cur];
    const lo = Math.round(minMxn * rate);
    const hi = Math.round(maxMxn * rate);
    const suffix = cur === "MXN" ? " MXN" : "";
    const amount = lo === hi ? `${lo}` : `${lo}–${hi}`;
    return `${SYMBOL[cur]}${amount}${suffix}`;
  }

  function updatePrices() {
    $$(".money").forEach((el) => {
      const min = Number(el.dataset.min);
      const max = el.dataset.max ? Number(el.dataset.max) : min;
      el.textContent = formatRange(min, max, currency);
    });
    updateQuote();
  }

  /* ---------- Mobile menu ---------- */

  const navToggle = $(".nav-toggle");
  const nav = $("#site-nav");

  function setMenu(open) {
    nav.classList.toggle("is-open", open);
    navToggle.setAttribute("aria-expanded", String(open));
  }

  navToggle.addEventListener("click", () => setMenu(!nav.classList.contains("is-open")));
  $$("a", nav).forEach((a) => a.addEventListener("click", () => setMenu(false)));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && nav.classList.contains("is-open")) {
      setMenu(false);
      navToggle.focus();
    }
  });

  /* ---------- Highlight the section you're reading ---------- */

  const navLinks = $$('.nav-list a[href^="#"]:not(.nav-cta)');
  const linkById = new Map(navLinks.map((a) => [a.getAttribute("href").slice(1), a]));

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          navLinks.forEach((a) => {
            a.classList.remove("is-active");
            a.removeAttribute("aria-current");
          });
          const active = linkById.get(entry.target.id);
          if (active) {
            active.classList.add("is-active");
            active.setAttribute("aria-current", "location");
          }
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    linkById.forEach((_, id) => {
      const section = document.getElementById(id);
      if (section) observer.observe(section);
    });
  }

  /* ---------- The poke-able bun ---------- */

  const bun = $("#bun");
  const bunSays = $("#bun-says");
  const phrases = [
    "Boing!",
    "Squish squish!",
    "Mochi!",
    "Psst, check the prices below",
    "Again, again!",
    "Pick a type and order me",
  ];
  let pokes = 0;
  let calmTimer;

  bun.addEventListener("click", () => {
    bun.classList.remove("squish");
    void bun.offsetWidth; // restart the animation if it's already playing
    bun.classList.add("squish", "is-happy");
    bunSays.textContent = phrases[pokes % phrases.length];
    pokes += 1;
    clearTimeout(calmTimer);
    calmTimer = setTimeout(() => bun.classList.remove("is-happy"), 1400);
  });

  /* ---------- Gallery lightbox ---------- */

  const works = $$(".work");
  const lightbox = $("#lightbox");
  const lbImg = $("img", lightbox);
  const lbCaption = $("figcaption", lightbox);
  let currentWork = 0;

  const isMissing = (i) => works[i].classList.contains("is-missing");

  function showWork(index) {
    currentWork = (index + works.length) % works.length;
    const img = $("img", works[currentWork]);
    lbImg.src = img.currentSrc || img.src;
    lbImg.alt = img.alt;
    lbCaption.textContent = img.alt;
  }

  function stepWork(direction) {
    for (let tries = 0; tries < works.length; tries += 1) {
      currentWork = (currentWork + direction + works.length) % works.length;
      if (!isMissing(currentWork)) break;
    }
    showWork(currentWork);
  }

  works.forEach((button, i) => {
    const img = $("img", button);
    const markMissing = () => button.classList.add("is-missing");
    img.addEventListener("error", markMissing);
    if (img.complete && img.naturalWidth === 0 && img.getAttribute("src")) markMissing();

    button.addEventListener("click", () => {
      if (isMissing(i)) return;
      showWork(i);
      lightbox.showModal();
    });
  });

  $(".lb-close", lightbox).addEventListener("click", () => lightbox.close());
  $(".lb-prev", lightbox).addEventListener("click", () => stepWork(-1));
  $(".lb-next", lightbox).addEventListener("click", () => stepWork(1));
  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) lightbox.close(); // click on the dark backdrop
  });
  lightbox.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") stepWork(1);
    if (e.key === "ArrowLeft") stepWork(-1);
  });

  /* ---------- Stages stepper ---------- */

  const tabs = $$(".step-tab");
  const panels = $$(".step-panel");
  const track = $(".step-track");

  function selectStage(index, moveFocus = false) {
    tabs.forEach((tab, i) => {
      const selected = i === index;
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;
      tab.classList.toggle("is-done", i < index);
      panels[i].hidden = !selected;
    });
    track.style.setProperty("--progress", String(index / (tabs.length - 1)));
    if (moveFocus) tabs[index].focus();
  }

  tabs.forEach((tab, i) => {
    tab.addEventListener("click", () => selectStage(i));
    tab.addEventListener("keydown", (e) => {
      const last = tabs.length - 1;
      const targets = {
        ArrowRight: i === last ? 0 : i + 1,
        ArrowLeft: i === 0 ? last : i - 1,
        Home: 0,
        End: last,
      };
      if (e.key in targets) {
        e.preventDefault();
        selectStage(targets[e.key], true);
      }
    });
  });
  $$("[data-goto-stage]").forEach((button) =>
    button.addEventListener("click", () => selectStage(Number(button.dataset.gotoStage), true))
  );
  selectStage(0);

  /* ---------- Pricing: filter + currency ---------- */

  const priceCards = $$(".price-card");

  function applyFilter(value) {
    priceCards.forEach((card) => {
      card.hidden = !(value === "all" || card.dataset.type === value);
    });
    const radio = $(`input[name="filter"][value="${value}"]`);
    if (radio) radio.checked = true;
  }

  $$('input[name="filter"]').forEach((radio) =>
    radio.addEventListener("change", () => applyFilter(radio.value))
  );

  $$('input[name="currency"]').forEach((radio) =>
    radio.addEventListener("change", () => {
      currency = radio.value;
      updatePrices();
    })
  );

  // "See art prices" style buttons in the services section
  $$("[data-filter]").forEach((link) =>
    link.addEventListener("click", () => applyFilter(link.dataset.filter))
  );

  /* ---------- Order builder ---------- */

  const typeSelect = $("#order-type");
  const rushBox = $("#order-rush");
  const nameInput = $("#order-name");
  const ideaInput = $("#order-idea");
  const consentBox = $("#order-consent");
  const estimateEl = $("#order-estimate");
  const rushNote = $("#rush-note");
  const messageEl = $("#order-message");
  const copyBtn = $("#copy-message");
  const emailBtn = $("#email-message");
  const hintEl = $("#order-hint");
  const statusEl = $("#order-status");

  const TYPE_LABEL = { art: "art", website: "website", premium: "art + website" };

  function selectedCard() {
    return priceCards.find((card) => card.dataset.id === typeSelect.value);
  }

  function buildMessage(card, estimate) {
    const name = nameInput.value.trim();
    const idea = ideaInput.value.trim();
    const lines = [
      `Hi ${CONFIG.studioName}!`,
      "",
      `I'd like to order: ${card.dataset.name} (${TYPE_LABEL[card.dataset.type]}).`,
      `Estimated price: ${estimate}`,
      `Deadline: ${rushBox.checked ? "I need it in under 5 days (rush)" : "Standard (5 days)"}`,
    ];
    if (name) lines.push(`My name: ${name}`);
    lines.push("", "About my idea:", idea || "(I'll add the details when we chat.)");
    lines.push("", "I've read the terms, and any reference photos I share have the consent of the person depicted.");
    return lines.join("\n");
  }

  function updateQuote() {
    const card = selectedCard();
    rushNote.hidden = !rushBox.checked;
    statusEl.textContent = "";

    if (!card) {
      estimateEl.textContent = "Choose a type to see an estimate";
      messageEl.value = "";
    } else {
      const estimate = formatRange(Number(card.dataset.min), Number(card.dataset.max), currency);
      estimateEl.textContent = estimate;
      messageEl.value = buildMessage(card, estimate);
    }

    const ready = Boolean(card) && consentBox.checked;
    copyBtn.disabled = !ready;
    emailBtn.disabled = !ready;
    hintEl.textContent = !card
      ? "Choose what you'd like to order to start your message."
      : !consentBox.checked
        ? "Tick the terms box to unlock the buttons."
        : "";
  }

  [typeSelect, rushBox, nameInput, ideaInput, consentBox].forEach((el) => {
    el.addEventListener(el.tagName === "SELECT" || el.type === "checkbox" ? "change" : "input", updateQuote);
  });
  $("#order-form").addEventListener("submit", (e) => e.preventDefault());

  // "Order this" buttons on the price cards pre-select the type
  $$("[data-choose]").forEach((link) =>
    link.addEventListener("click", () => {
      typeSelect.value = link.dataset.choose;
      updateQuote();
    })
  );

  copyBtn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(messageEl.value);
      statusEl.textContent = "Message copied. Paste it into a message to me!";
    } catch (err) {
      messageEl.focus();
      messageEl.select();
      statusEl.textContent = "Your message is selected. Press Ctrl+C (or Cmd+C) to copy it.";
    }
  });

  if (CONFIG.email) {
    emailBtn.hidden = false;
    emailBtn.addEventListener("click", () => {
      const card = selectedCard();
      if (!card) return;
      const subject = `Commission request: ${card.dataset.name}`;
      window.location.href =
        `mailto:${CONFIG.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(messageEl.value)}`;
    });
  }

  /* ---------- Terms: expand / collapse all ---------- */

  const termDetails = $$(".terms details");
  const toggleTerms = $("#toggle-terms");

  function syncToggleLabel() {
    toggleTerms.textContent = termDetails.every((d) => d.open) ? "Collapse all" : "Expand all";
  }

  toggleTerms.addEventListener("click", () => {
    const openThem = termDetails.some((d) => !d.open);
    termDetails.forEach((d) => { d.open = openThem; });
    syncToggleLabel();
  });
  termDetails.forEach((d) => d.addEventListener("toggle", syncToggleLabel));

  /* ---------- Start ---------- */

  updatePrices();
})();