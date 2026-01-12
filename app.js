const tabs = document.querySelectorAll(".tab");

const setActiveTab = (tab) => {
  const isActive = tab.classList.toggle("active");
  tab.setAttribute("aria-selected", isActive ? "true" : "false");
  filterUnassignedCards();
};

const unassignedSection = document.querySelector("#unassigned-flights");
const filterUnassignedCards = () => {
  if (!unassignedSection) return;
  const cards = unassignedSection.querySelectorAll(".card");
  const activeTerminals = Array.from(tabs)
    .filter((item) => item.classList.contains("active"))
    .map((item) => item.dataset.terminal)
    .filter(Boolean);
  const showAll = activeTerminals.length === 0;
  cards.forEach((card) => {
    const matches = showAll
      ? true
      : activeTerminals.some((term) => card.classList.contains(`${term}-card`));
    card.classList.toggle("is-hidden", !matches);
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

const activeTab = document.querySelector(".tab.active");
if (activeTab) {
  filterUnassignedCards();
}

applyProgressColors();

const updateGotTimes = () => {
  const rows = document.querySelectorAll(".card .card-times");
  rows.forEach((times) => {
    if (times.querySelector(".got-time")) return;
    const etdSpan = Array.from(times.querySelectorAll("span")).find((span) =>
      span.textContent.trim().startsWith("ETD")
    );
    if (!etdSpan) return;
    const match = etdSpan.textContent.match(/(\d{4})hrs/);
    if (!match) return;
    const etd = `${match[1]}hrs`;
    const got = subtractMinutes(etd, 70);
    if (!got || got === "-") return;
    const span = document.createElement("span");
    span.className = "got-time";
    span.textContent = `GOT ${got}`;
    times.appendChild(span);
  });
};

updateGotTimes();

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
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="9" cy="6.5" r="2"/>
      <path d="M7 12l2.8-2 2.2 2 2.2-1.1"/>
      <path d="M6 18l2-4 2.2 1.4L12 20"/>
      <path d="M12.5 12.5l2.5 1.5 1.5 3"/>
      <path d="M15.5 8.5h6"/>
      <path d="M19 6l2.5 2.5L19 11"/>
    </svg>
  `;
  const closeIcon = `
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
      <path d="M6 4h12v16H6z"/>
      <path d="M10 4v16"/>
      <circle cx="14.5" cy="12" r="0.9"/>
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
const assignList = document.querySelector("#assign-gate-list");
const assignFs = document.querySelector("#assign-fs");
const assignSubmit = document.querySelector("#assign-submit");
const assignSummary = document.querySelector("#assign-summary");
const fsName = document.querySelector("#fs-name");

const assignments = {};

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
  const match = value.match(/(\d{2})(\d{2})/);
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

const toMinutes = (timeLabel) => {
  const parsed = parseTime(timeLabel);
  if (!parsed) return null;
  return parsed.hours * 60 + parsed.minutes;
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

const defaultGates = [
  "A1",
  "A3",
  "A5",
  "A7",
  "A9",
  "A12",
  "B1",
  "B3",
  "B5",
  "B7",
  "B9",
  "B10",
  "C1",
  "C3",
  "C5",
  "C7",
  "C9",
  "D1",
  "D2",
  "D3",
  "E1",
  "E3",
  "E5",
  "E11",
];

const getGateTimes = () => {
  const gateTimes = {};
  document.querySelectorAll(".flight-card").forEach((card) => {
    const gateEl = card.querySelector(".gate-label");
    const etdEl = card.querySelector(".flight-times span:first-child");
    if (!gateEl || !etdEl) return;
    const gate = `Gate ${gateEl.textContent.replace("Gate", "").trim()}`;
    const etd = etdEl.textContent.replace("ETD:", "").trim();
    gateTimes[gate] = etd;
  });
  if (Object.keys(gateTimes).length === 0) {
    const baseTimes = [
      "0800hrs",
      "0830hrs",
      "0900hrs",
      "0930hrs",
      "1000hrs",
      "1030hrs",
      "1100hrs",
      "1130hrs",
      "1200hrs",
    ];
    defaultGates.forEach((gate, idx) => {
      gateTimes[`Gate ${gate}`] = baseTimes[idx % baseTimes.length];
    });
  }
  return gateTimes;
};

const populateAssignGates = () => {
  if (!assignList) return;
  const gateTimes = getGateTimes();
  const gatesFromCards = Array.from(document.querySelectorAll(".gate-label"))
    .map((el) => el.textContent.replace("Gate", "").trim())
    .filter(Boolean);
  const gates = gatesFromCards.length ? gatesFromCards : defaultGates;
  assignList.innerHTML = gates
    .map((gate) => {
      const gateLabel = `Gate ${gate}`;
      const time = gateTimes[gateLabel] || "--:--";
      return `<button class="assign-gate" type="button" data-gate="${gateLabel}">
        <span class="assign-gate-label">${gateLabel}</span>
        <span class="assign-gate-time">ETD ${time}</span>
      </button>`;
    })
    .join("");
};

if (assignList) {
  assignList.addEventListener("click", (event) => {
    const btn = event.target.closest(".assign-gate");
    if (!btn) return;
    btn.classList.toggle("is-selected");
  });
}

if (assignSubmit) {
  assignSubmit.addEventListener("click", () => {
    const selected = assignFs ? assignFs.value : "";
    const selectedButtons = Array.from(
      document.querySelectorAll(".assign-gate.is-selected")
    );
    const gates = selectedButtons.map((btn) => btn.dataset.gate || btn.textContent.trim());
    if (!selected || gates.length === 0) return;
    const existing = assignments[selected] || [];
    const mergedGates = Array.from(new Set([...existing, ...gates]));
    if (fsName) {
      fsName.textContent = `${selected} (${mergedGates.join(", ")})`;
    }
    assignments[selected] = mergedGates;
    document.querySelectorAll(".flight-card").forEach((card) => {
      const gateEl = card.querySelector(".gate-label");
      const fsBadge = card.querySelector(".fs-badge");
      if (!gateEl || !fsBadge) return;
      const gateText = `Gate ${gateEl.textContent.replace("Gate", "").trim()}`;
      if (mergedGates.includes(gateText)) {
        fsBadge.textContent = `FS: ${selected.replace("FS - ", "")}`;
      }
    });
    selectedButtons.forEach((btn) => btn.remove());
    document.dispatchEvent(new Event("assignments:updated"));
    document.dispatchEvent(new Event("assignments:updated"));
  });
}

if (assignSummary) {
  const renderTimeline = () => {
    const gateTimes = getGateTimes();

    const rows = Object.entries(assignments).map(([fs, gates]) => {
      const times = gates
        .map((gate) => ({ gate, time: gateTimes[gate] || "----" }))
        .filter((item) => item.time !== "----");
      const minutes = times.map((item) => toMinutes(item.time)).filter((m) => m !== null);
      const minRaw = minutes.length ? Math.min(...minutes) : 0;
      const maxRaw = minutes.length ? Math.max(...minutes) : 1440;
      const pad = 30;
      const min = Math.max(0, minRaw - pad);
      const max = Math.min(1440, maxRaw + pad);
      const span = Math.max(60, max - min);

      const axisStart = formatTime(Math.floor(min / 60), min % 60);
      const mid = min + Math.floor(span / 2);
      const axisMid = formatTime(Math.floor(mid / 60), mid % 60);
      const axisEnd = formatTime(Math.floor((min + span) / 60), (min + span) % 60);

      const tickStep = span > 360 ? 120 : 60;
      const tickStart = Math.floor(min / tickStep) * tickStep;
      const ticks = [];
      for (let t = tickStart; t <= min + span; t += tickStep) {
        const left = Math.round(((t - min) / span) * 100);
        const clamped = Math.min(98, Math.max(2, left));
        ticks.push(
          `<span class="timeline-tick" style="left:${clamped}%">${formatTime(Math.floor(t / 60), t % 60)}</span>`
        );
      }

      let rowsCount = Math.min(4, Math.max(1, Math.ceil(times.length / 4)));
      if (times.length > 1 && rowsCount === 1) rowsCount = 2;
      const rowHeight = 18;
      const baseHeight = 34;
      const timelineHeight = baseHeight + (rowsCount - 1) * rowHeight;

      const markers = times
        .map((item, idx) => {
          const m = toMinutes(item.time);
          const left = m === null ? 0 : Math.round(((m - min) / span) * 100);
          const clamped = Math.min(98, Math.max(2, left));
          const rowIndex = rowsCount > 1 ? idx % rowsCount : 0;
          const offset = rowsCount > 1 ? (rowIndex - (rowsCount - 1) / 2) * 1.2 : 0;
          const adjusted = Math.min(98, Math.max(2, clamped + offset));
          const top = 8 + rowIndex * rowHeight;
          return `<div class="timeline-marker" style="left:${adjusted}%; top:${top}px;">
              <div class="timeline-dot"></div>
              <div class="timeline-label-small">${item.gate} ${item.time}</div>
            </div>`;
        })
        .join("");

      return `<div class="timeline-row">
          <div class="timeline-label">${fs}</div>
          <div class="timeline" style="height:${timelineHeight}px;">
            <div class="timeline-axis"><span>${axisStart}</span><span>${axisMid}</span><span>${axisEnd}</span></div>
            <div class="timeline-ticks">${ticks.join("")}</div>
            ${markers}
          </div>
        </div>`;
    });

    assignSummary.innerHTML = rows.length
      ? rows.join("")
      : "<div class=\"assign-row\"><span>No assignments</span><span>-</span></div>";
  };
  renderTimeline();
  document.addEventListener("assignments:updated", renderTimeline);
}

populateAssignGates();
