const tabs = document.querySelectorAll(".tab");

const setActiveTab = (tab) => {
  tabs.forEach((item) => {
    const isActive = item === tab;
    item.classList.toggle("active", isActive);
    item.setAttribute("aria-selected", isActive ? "true" : "false");
  });
};

const applyProgressColors = () => {
  const bars = document.querySelectorAll(".progress-bar span");
  bars.forEach((bar) => {
    const width = bar.style.width || "0%";
    const value = parseInt(width.replace("%", ""), 10);
    bar.classList.remove("bar-low", "bar-mid", "bar-high", "bar-peak");
    if (value <= 25) {
      bar.classList.add("bar-low");
    } else if (value <= 50) {
      bar.classList.add("bar-mid");
    } else if (value <= 75) {
      bar.classList.add("bar-high");
    } else {
      bar.classList.add("bar-peak");
    }
  });
};

tabs.forEach((tab) => {
  tab.addEventListener("click", () => setActiveTab(tab));
});

applyProgressColors();

const updatePullCount = () => {
  const countEl = document.querySelector("#pull-count");
  if (!countEl) return;
  const count = document.querySelectorAll(".pull-team").length;
  countEl.textContent = String(count);
};

const updateGateChangeCount = () => {
  const countEl = document.querySelector("#gate-change-count");
  if (!countEl) return;
  const count = document.querySelectorAll(".gate-changed").length;
  countEl.textContent = String(count);
};

const updateEnhancedCount = () => {
  const countEl = document.querySelector("#enhanced-count");
  if (!countEl) return;
  const count = document.querySelectorAll(".badge-enhanced").length;
  countEl.textContent = String(count);
};

const updateGateCount = () => {
  const gateEl = document.querySelector("#gate-count");
  if (!gateEl) return;
  const count = document.querySelectorAll(".gate-banner").length;
  gateEl.textContent = String(count);
};

const enablePullFilter = () => {
  const tile = document.querySelector("#pull-count-tile");
  if (!tile) return;

  document.querySelectorAll(".flight-card").forEach((card) => {
    if (card.querySelector(".pull-team")) {
      card.classList.add("has-pull");
    } else {
      card.classList.remove("has-pull");
    }
  });

  const toggleFilter = () => {
    document.body.classList.toggle("pull-filter-active");
    tile.classList.toggle("is-active");
  };

  tile.addEventListener("click", toggleFilter);
  tile.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggleFilter();
    }
  });
};

document.addEventListener("DOMContentLoaded", () => {
  updatePullCount();
  updateGateChangeCount();
  updateEnhancedCount();
  updateGateCount();
  applyStatusGateColors();
  enablePullFilter();
  enablePullRandom();
  enableTeamsToggle();
});

const applyStatusGateColors = () => {
  document.querySelectorAll(".flight-card").forEach((card) => {
    const statusEl = card.querySelector(".status");
    if (!statusEl) return;
    if (statusEl.classList.contains("on-time")) {
      card.classList.add("status-on-time");
      card.classList.remove("status-delayed");
    } else if (statusEl.classList.contains("delayed")) {
      card.classList.add("status-delayed");
      card.classList.remove("status-on-time");
    }
  });
};

const enableTeamsToggle = () => {
  const toggle = document.querySelector("#toggle-teams");
  if (!toggle) return;
  const updateLabel = () => {
    toggle.textContent = document.body.classList.contains("teams-hidden")
      ? "Show Teams"
      : "Hide Teams";
  };
  toggle.addEventListener("click", () => {
    document.body.classList.toggle("teams-hidden");
    updateLabel();
  });
  updateLabel();
};

const enablePullRandom = () => {
  const button = document.querySelector("#pull-random");
  if (!button) return;

  const pullIcon = `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="7" cy="7" r="2.2"/>
      <path d="M3.5 14.5c0-2 2-3.5 4.5-3.5s4.5 1.5 4.5 3.5V18H3.5z"/>
      <path d="M19.5 6l3.5 3.5-3.5 3.5V11h-6v-3h6z"/>
    </svg>
  `;
  const closeIcon = `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 4h12v16H6z"/>
      <path d="M10 4v16"/>
      <circle cx="14.5" cy="12" r="0.9" fill="#111"/>
    </svg>
  `;

  const normalizePullButtons = () => {
    document.querySelectorAll(".pull-team").forEach((badge) => {
      if (badge.tagName === "BUTTON") return;
      const replacement = document.createElement("button");
      replacement.type = "button";
      replacement.className = "pull-team";
      replacement.setAttribute("aria-label", "Pull Team");
      replacement.setAttribute("data-label", "Pull Team");
      replacement.innerHTML = pullIcon;
      badge.replaceWith(replacement);
    });
  };

  const applyRandomPull = () => {
    normalizePullButtons();
    document.querySelectorAll(".pull-team, .close-gate").forEach((badge) => badge.remove());
    document.querySelectorAll(".flight-card").forEach((card) => card.classList.remove("has-pull"));

    const cards = Array.from(document.querySelectorAll(".flight-card"));
    if (cards.length === 0) return;
    const count = Math.max(1, Math.floor(cards.length / 3));
    const shuffled = cards.sort(() => 0.5 - Math.random()).slice(0, count);

    shuffled.forEach((card) => {
      const actions = card.querySelector(".gate-actions");
      if (!actions) return;
      const pull = document.createElement("button");
      pull.type = "button";
      pull.className = "pull-team";
      pull.setAttribute("aria-label", "Pull Team");
      pull.setAttribute("data-label", "Pull Team");
      pull.innerHTML = pullIcon;
      const close = document.createElement("button");
      close.type = "button";
      close.className = "close-gate";
      close.setAttribute("aria-label", "Close Gate");
      close.setAttribute("data-label", "Close Gate");
      close.innerHTML = closeIcon;
      actions.appendChild(pull);
      actions.appendChild(close);
      card.classList.add("has-pull");
    });

    updatePullCount();
  };

  button.addEventListener("click", applyRandomPull);
  applyRandomPull();
};

const modal = document.querySelector(".modal");
const modalBackdrop = document.querySelector(".modal-backdrop");
const modalClose = document.querySelector(".modal-close");
const modalTitle = document.querySelector(".modal-title");
const modalGate = document.querySelector(".modal-gate");
const modalNextGate = document.querySelector(".modal-next-gate");
const modalETD = document.querySelector(".modal-etd");
const modalSTD = document.querySelector(".modal-std");
const modalFlightNo = document.querySelector(".modal-flight-no");
const modalReportTime = document.querySelector(".modal-report-time");
const modalTeamList = document.querySelector(".modal-team-list");
const modalCloseList = document.querySelector(".modal-close-list");
const modalTeamBlock = document.querySelector(".modal-team");
const modalCloseBlock = document.querySelector(".modal-close-team");

const staffPool = [
  { id: "OS-1142", name: "A. Rahman", phone: "+65 9123 4567" },
  { id: "OS-2098", name: "S. Lim", phone: "+65 9345 6789" },
  { id: "OS-3315", name: "K. Wong", phone: "+65 9234 7788" },
  { id: "OS-4481", name: "J. Tan", phone: "+65 9788 1122" },
  { id: "OS-5576", name: "M. Chan", phone: "+65 9555 3344" },
  { id: "OS-6689", name: "R. Ong", phone: "+65 9666 5566" },
];

const pickTeamMembers = (count = 3) =>
  staffPool.sort(() => 0.5 - Math.random()).slice(0, count);

const closeGatePool = [
  { id: "CG-1180", name: "R. Goh" },
  { id: "CG-2231", name: "T. Noor" },
  { id: "CG-3094", name: "H. Yeo" },
  { id: "CG-4172", name: "J. Lee" },
];

const pickCloseOfficers = (count = 2) =>
  closeGatePool.sort(() => 0.5 - Math.random()).slice(0, count);

const parseTime = (value) => {
  const match = value.match(/(\\d{2})(\\d{2})/);
  if (!match) return null;
  return { hours: Number(match[1]), minutes: Number(match[2]) };
};

const formatTime = (hours, minutes) =>
  `${String(hours).padStart(2, "0")}${String(minutes).padStart(2, "0")}hrs`;

const subtractMinutes = (timeLabel, minutes) => {
  const parsed = parseTime(timeLabel);
  if (!parsed) return "-";
  const total = parsed.hours * 60 + parsed.minutes - minutes;
  const normalized = (total + 24 * 60) % (24 * 60);
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  return formatTime(h, m);
};

const openModal = (data) => {
  if (!modal || !modalBackdrop) return;
  if (modalTitle) modalTitle.textContent = data.title || "Action Details";
  if (modalGate) modalGate.textContent = data.gate || "Gate";
  if (modalNextGate) modalNextGate.textContent = data.nextGate || "-";
  if (modalETD) modalETD.textContent = data.etd || "-";
  if (modalSTD) modalSTD.textContent = data.std || "-";
  if (modalFlightNo) modalFlightNo.textContent = data.flightNo || "-";
  if (modalReportTime) modalReportTime.textContent = data.reportTime || "-";
  if (modalTeamList) {
    modalTeamList.innerHTML = data.teamMembers
      .map(
        (member) =>
          `<li><span>${member.id} ${member.name}<br /><small>${member.phone}</small></span><span>✓</span></li>`
      )
      .join("");
  }
  if (modalCloseList) {
    modalCloseList.innerHTML = data.closeOfficers
      .map((member) => `<li><span>${member.id} ${member.name}</span><span>✓</span></li>`)
      .join("");
  }
  if (modalTeamBlock) {
    modalTeamBlock.classList.toggle("is-hidden", data.teamMembers.length === 0);
  }
  if (modalCloseBlock) {
    modalCloseBlock.classList.toggle("is-hidden", data.closeOfficers.length === 0);
  }
  modalBackdrop.classList.add("is-visible");
  modal.classList.add("is-visible");
};

const closeModal = () => {
  if (!modal || !modalBackdrop) return;
  modalBackdrop.classList.remove("is-visible");
  modal.classList.remove("is-visible");
};

document.addEventListener("click", (event) => {
  const pull = event.target.closest(".pull-team");
  const close = event.target.closest(".close-gate");
  const badge = pull || close;
  if (!badge) return;
  const card = badge.closest(".flight-card");
  const banner = badge.closest(".gate-banner");
  const gateText = banner ? banner.textContent.replace("PULL TEAM", "").trim() : "Gate";
  const flightEl = card ? card.querySelector(".flight-tag") : null;
  const flightText = flightEl ? flightEl.textContent.replace("✈", "").trim() : "-";
  const etdEl = card ? card.querySelector(".flight-times span:first-child") : null;
  const stdEl = card ? card.querySelector(".flight-times span:nth-child(2)") : null;
  const etdText = etdEl ? etdEl.textContent.replace("ETD:", "").trim() : "-";
  const stdText = stdEl ? stdEl.textContent.replace("STD:", "").trim() : "-";
  const nextCard = card ? card.nextElementSibling : null;
  const nextGateEl = nextCard ? nextCard.querySelector(".gate-banner") : null;
  const nextGateText = nextGateEl ? nextGateEl.textContent.replace("PULL TEAM", "").trim() : "-";
  const reportTime = etdText !== "-" ? subtractMinutes(etdText, 30) : "-";
  const teamMembers = pull ? pickTeamMembers() : [];
  const closeOfficers = close ? pickCloseOfficers() : [];

  openModal({
    title: pull ? "Pull Team Officers" : "Close Gate Officers",
    gate: gateText,
    nextGate: nextGateText,
    etd: etdText,
    std: stdText,
    flightNo: flightText,
    reportTime,
    teamMembers,
    closeOfficers,
  });
});

if (modalClose) {
  modalClose.addEventListener("click", closeModal);
}

if (modalBackdrop) {
  modalBackdrop.addEventListener("click", closeModal);
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeModal();
});
