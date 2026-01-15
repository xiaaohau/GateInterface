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

const isPatdownCard = (card) => {
  if (!card) return false;
  if (card.classList.contains("critical")) return false;
  if (card.classList.contains("status-delayed")) return true;
  const statusEl = card.querySelector(".status");
  return Boolean(statusEl && statusEl.classList.contains("delayed"));
};

const updatePatdownCount = () => {
  const countEl = document.querySelector("#patdown-count");
  if (!countEl) return;
  const count = Array.from(document.querySelectorAll(".flight-card")).filter(isPatdownCard)
    .length;
  countEl.textContent = String(count);
};

const updateGateCount = () => {
  const gateEl = document.querySelector("#gate-count");
  if (!gateEl) return;
  const count = document.querySelectorAll(".gate-banner").length;
  gateEl.textContent = String(count);
};

const applyTeamOfficerCounts = () => {
  document.querySelectorAll(".progress-row span:first-child").forEach((span) => {
    const text = span.textContent.trim();
    const match = text.match(/^Team\s+(\d+)$/);
    if (!match) return;
    const teamId = Number(match[1]);
    if (!Number.isFinite(teamId)) return;
    const officerCount = teamId % 3 === 0 ? 2 : 3;
    span.textContent = `Team ${teamId} (${officerCount})`;
  });
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

const enableGateChangeFilter = () => {
  const tile = document.querySelector("#gate-change-count-tile");
  if (!tile) return;

  const toggleFilter = () => {
    document.body.classList.toggle("gate-change-filter-active");
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

const enablePatdownFilter = () => {
  const tile = document.querySelector("#patdown-count-tile");
  if (!tile) return;

  const updatePatdownCards = () => {
    document.querySelectorAll(".flight-card").forEach((card) => {
      const hasPatdown = isPatdownCard(card);
      card.classList.toggle("has-patdown", hasPatdown);
    });
  };

  const toggleFilter = () => {
    updatePatdownCards();
    document.body.classList.toggle("patdown-filter-active");
    tile.classList.toggle("is-active");
  };

  updatePatdownCards();
  tile.addEventListener("click", toggleFilter);
  tile.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggleFilter();
    }
  });
};

const enableAssignedTeamsCards = () => {
  const page = document.querySelector(".in-progress-page");
  if (!page) return;

  const cards = page.querySelectorAll(".flight-card");
  cards.forEach((card) => {
    card.classList.add("is-pressable");
    card.setAttribute("tabindex", "0");
    card.setAttribute("role", "button");
    const gateLabel = card.querySelector(".gate-label")?.textContent.trim();
    const label = gateLabel ? `Assigned Teams ${gateLabel}` : "Assigned Teams";
    card.setAttribute("aria-label", label);
  });

  page.addEventListener("click", (event) => {
    if (event.target.closest(".pull-team, .close-gate")) return;
    const card = event.target.closest(".flight-card");
    if (!card) return;
    openAssignedTeamsModal(card);
  });

  page.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    const card = event.target.closest(".flight-card.is-pressable");
    if (!card) return;
    event.preventDefault();
    openAssignedTeamsModal(card);
  });
};

document.addEventListener("DOMContentLoaded", () => {
  applyStatusGateColors();
  updatePullCount();
  updateGateChangeCount();
  updateEnhancedCount();
  updatePatdownCount();
  updateGateCount();
  applyTeamOfficerCounts();
  enablePullFilter();
  enableGateChangeFilter();
  enablePatdownFilter();
  enableAssignedTeamsCards();
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
  if (!document.body.classList.contains("teams-hidden")) {
    document.body.classList.add("teams-hidden");
  }
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
const modalReportingTime = document.querySelector(".modal-reporting-time");
const modalFlightNumber = document.querySelector(".modal-flight-number");
const modalGateOpeningTime = document.querySelector(".modal-gate-opening-time");
const modalTeamTabs = document.querySelector(".modal-team-tabs");
const modalTeamList = document.querySelector(".modal-team-list");
const modalCloseList = document.querySelector(".modal-close-list");
const modalTeamBlock = document.querySelector(".modal-team");
const modalCloseBlock = document.querySelector(".modal-close-team");
const modalSummary = document.querySelector(".modal-summary");
const modalAction = document.querySelector(".modal-action");
const modalTeamTitle = modalTeamBlock ? modalTeamBlock.querySelector("div") : null;
const modalSummaryLabels = modalSummary
  ? Array.from(modalSummary.querySelectorAll("div span:first-child"))
  : [];
const DEFAULT_SUMMARY_LABELS = [
  "Gate",
  "Reporting Time",
  "Flight Number",
  "Gate Opening Time",
];
const ASSIGNED_SUMMARY_LABELS = [
  "Gate",
  "Reporting Time",
  "Flight Number",
  "Gate Opening Time",
];
let modalTeams = [];
let modalActiveTeamIndex = 0;
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

const updateGotTimes = () => {
  const rows = document.querySelectorAll(".card .card-times");
  rows.forEach((times) => {
    const etdSpan = Array.from(times.querySelectorAll("span")).find((span) =>
      span.textContent.trim().startsWith("ETD")
    );
    if (!etdSpan) return;
    const match = etdSpan.textContent.match(/(\d{4})hrs/);
    if (!match) return;
    const etd = `${match[1]}hrs`;
    const card = times.closest(".card");
    if (!card) return;
    const isOfficerTask = Boolean(card.closest(".alert-section"));
    const minutesOffset = isOfficerTask ? 90 : 70;
    const timeValue = subtractMinutes(etd, minutesOffset);
    if (!timeValue || timeValue === "-") return;
    const gateEl = card.querySelector(".card-sub");
    if (!gateEl) return;
    const gateText = gateEl.dataset.gateLabel || gateEl.textContent.trim();
    gateEl.dataset.gateLabel = gateText;
    gateEl.classList.add("with-got");
    const label = isOfficerTask ? "RT" : "GOT";
    gateEl.innerHTML = `<span class="gate-label-text">${gateText}</span><span class="got-under-gate">${label} ${timeValue}</span>`;
    const oldGot = times.querySelector(".got-time");
    if (oldGot) oldGot.remove();
  });
};

const updateRtGotForInProgress = () => {
  const cards = document.querySelectorAll(".flight-card");
  cards.forEach((card) => {
    const times = card.querySelector(".flight-times");
    if (!times) return;
    times.querySelectorAll(".got-time, .rt-time").forEach((el) => el.remove());
    const etdSpan = Array.from(times.querySelectorAll("span")).find((span) =>
      span.textContent.trim().startsWith("ETD")
    );
    if (!etdSpan) return;
    const match = etdSpan.textContent.match(/(\d{4})hrs/);
    if (!match) return;
    const etd = `${match[1]}hrs`;
    const got = subtractMinutes(etd, 70);
    const rt = got && got !== "-" ? subtractMinutes(got, 20) : "-";
    if (!got || got === "-" || !rt || rt === "-") return;
    const gotEl = document.createElement("span");
    gotEl.className = "got-time";
    gotEl.textContent = `GOT: ${got}`;
    const rtEl = document.createElement("span");
    rtEl.className = "rt-time";
    rtEl.textContent = `RT: ${rt}`;
    times.appendChild(gotEl);
    times.appendChild(rtEl);
    const rtMatch = rt.match(/(\d{4})hrs/);
    if (rtMatch) {
      card.dataset.rtMinutes = String(toMinutes(`${rtMatch[1]}hrs`));
    }
    reorderInProgressTimes(times);
  });
};

document.addEventListener("DOMContentLoaded", () => {
  updateGotTimes();
  updateRtGotForInProgress();
  setTimeout(sortInProgressByRT, 0);
});

const reorderInProgressTimes = (times) => {
  if (!times) return;
  const spans = Array.from(times.querySelectorAll("span"));
  const getLabel = (el) => el.textContent.split(":")[0].trim();
  const findByLabel = (label) => spans.find((el) => getLabel(el) === label);
  const rt = findByLabel("RT");
  const got = findByLabel("GOT");
  const etd = findByLabel("ETD");
  const std = findByLabel("STD");
  times.innerHTML = "";
  [rt, got, etd, std].forEach((el) => {
    if (el) times.appendChild(el);
  });
};

const sortInProgressByRT = () => {
  const grids = document.querySelectorAll(".in-progress-page .card-grid");
  grids.forEach((grid) => {
    const cards = Array.from(grid.querySelectorAll(".flight-card"));
    if (cards.length === 0) return;
    cards.sort((a, b) => {
      const getRtMinutes = (card) => {
        const data = Number(card.dataset.rtMinutes);
        if (Number.isFinite(data) && data > 0) return data;
        const rtText = card.querySelector(".rt-time")?.textContent || "";
        const match = rtText.match(/(\d{4})hrs/);
        return match ? toMinutes(`${match[1]}hrs`) : Number.MAX_SAFE_INTEGER;
      };
      const aTime = getRtMinutes(a);
      const bTime = getRtMinutes(b);
      return aTime - bTime;
    });
    cards.forEach((card) => grid.appendChild(card));
  });
};


const updateUnassignedBadges = () => {
  const section = document.querySelector("#unassigned-flights");
  if (!section) return;
  const cards = section.querySelectorAll(".card");
  cards.forEach((card) => {
    const hasChange = card.querySelector(".change-badge, .changed-field");
    const badge = card.querySelector(".unassigned-badge");
    if (hasChange) {
      if (badge) badge.remove();
      return;
    }
    if (!badge) {
      const newBadge = document.createElement("div");
      newBadge.className = "unassigned-badge";
      newBadge.textContent = "Unassigned";
      card.insertBefore(newBadge, card.children[1] || null);
    }
  });
};

updateUnassignedBadges();

const toMinutes = (timeLabel) => {
  const parsed = parseTime(timeLabel);
  if (!parsed) return null;
  return parsed.hours * 60 + parsed.minutes;
};

const setModalSummaryLabels = (labels) => {
  if (!modalSummaryLabels.length) return;
  labels.forEach((label, index) => {
    if (modalSummaryLabels[index]) {
      modalSummaryLabels[index].textContent = label;
    }
  });
};

const setModalGatePatdown = (isPatdown) => {
  if (!modalGate) return;
  modalGate.classList.toggle("is-patdown", Boolean(isPatdown));
};

const renderModalTeamMembers = (members) => {
  if (!modalTeamList) return;
  modalTeamList.innerHTML = (members || [])
    .map(
      (member) =>
        `<li><span>${member.id} ${member.name}<br /><small>${member.phone}</small></span><span>✓</span></li>`
    )
    .join("");
};

const renderModalTeamTabs = () => {
  if (!modalTeamTabs) return;
  if (!modalTeams.length) {
    modalTeamTabs.innerHTML = "";
    modalTeamTabs.classList.add("is-hidden");
    return;
  }
  modalTeamTabs.classList.remove("is-hidden");
  modalTeamTabs.innerHTML = modalTeams
    .map((team, index) => {
      const isActive = index === modalActiveTeamIndex;
      return `<button class="modal-team-tab${isActive ? " is-active" : ""}" type="button" role="tab" aria-selected="${isActive ? "true" : "false"}" data-index="${index}">${team.label}</button>`;
    })
    .join("");
};

const updateModalTeamSelection = (index) => {
  if (!modalTeams.length) return;
  const nextIndex = Math.max(0, Math.min(index, modalTeams.length - 1));
  modalActiveTeamIndex = nextIndex;
  renderModalTeamTabs();
  const activeTeam = modalTeams[modalActiveTeamIndex];
  if (modalGate) {
    modalGate.textContent = activeTeam?.nextGate || "-";
  }
  setModalGatePatdown(activeTeam?.isPatdown);
  if (modalReportingTime) {
    modalReportingTime.textContent = activeTeam?.reportingTime || "-";
  }
  if (modalFlightNumber) {
    modalFlightNumber.textContent = activeTeam?.flightNo || "-";
  }
  if (modalGateOpeningTime) {
    modalGateOpeningTime.textContent = activeTeam?.gateOpeningTime || "-";
  }
  renderModalTeamMembers(activeTeam?.members || []);
  if (modalTeamBlock) {
    modalTeamBlock.classList.toggle(
      "is-hidden",
      !activeTeam || !activeTeam.members || activeTeam.members.length === 0
    );
  }
};

const setModalTeams = (teams) => {
  modalTeams = Array.isArray(teams) ? teams : [];
  modalActiveTeamIndex = 0;
  if (modalTeams.length) {
    updateModalTeamSelection(0);
  } else {
    renderModalTeamTabs();
  }
};

const clearModalTeams = () => {
  modalTeams = [];
  modalActiveTeamIndex = 0;
  renderModalTeamTabs();
};

if (modalTeamTabs) {
  modalTeamTabs.addEventListener("click", (event) => {
    const tab = event.target.closest(".modal-team-tab");
    if (!tab) return;
    const index = Number(tab.dataset.index);
    if (!Number.isFinite(index)) return;
    updateModalTeamSelection(index);
  });
}

const setModalLayoutForAction = () => {
  if (modalSummary) modalSummary.classList.remove("is-hidden");
  if (modalAction) modalAction.classList.remove("is-hidden");
  if (modalTeamTitle) modalTeamTitle.textContent = "Team Members";
  setModalSummaryLabels(DEFAULT_SUMMARY_LABELS);
};

const setModalLayoutForAssigned = () => {
  if (modalSummary) modalSummary.classList.remove("is-hidden");
  if (modalAction) modalAction.classList.add("is-hidden");
  if (modalCloseBlock) modalCloseBlock.classList.add("is-hidden");
  if (modalTeamTitle) modalTeamTitle.textContent = "Assigned Teams";
  setModalSummaryLabels(ASSIGNED_SUMMARY_LABELS);
  clearModalTeams();
};

const openModal = (data) => {
  if (!modal || !modalBackdrop) return;
  setModalLayoutForAction();
  const teamMembers = Array.isArray(data.teamMembers) ? data.teamMembers : [];
  const closeOfficers = Array.isArray(data.closeOfficers) ? data.closeOfficers : [];
  const teams = Array.isArray(data.teams) ? data.teams : [];
  if (modalTitle) modalTitle.textContent = data.title || "Action Details";
  if (modalGate) modalGate.textContent = data.gate || "Gate";
  if (teams.length) {
    setModalTeams(teams);
  } else {
    clearModalTeams();
    setModalGatePatdown(data.isPatdown);
    if (modalReportingTime) {
      modalReportingTime.textContent = data.reportingTime || data.reportTime || "-";
    }
    if (modalFlightNumber) {
      modalFlightNumber.textContent = data.flightNo || "-";
    }
    if (modalGateOpeningTime) {
      modalGateOpeningTime.textContent = data.gateOpeningTime || "-";
    }
    renderModalTeamMembers(teamMembers);
    if (modalTeamBlock) {
      modalTeamBlock.classList.toggle("is-hidden", teamMembers.length === 0);
    }
  }
  if (modalCloseList) {
    modalCloseList.innerHTML = closeOfficers
      .map((member) => `<li><span>${member.id} ${member.name}</span><span>✓</span></li>`)
      .join("");
  }
  if (modalCloseBlock) {
    modalCloseBlock.classList.toggle("is-hidden", closeOfficers.length === 0);
  }
  modalBackdrop.classList.add("is-visible");
  modal.classList.add("is-visible");
};
const openAssignedTeamsModal = (card) => {
  if (!modal || !modalBackdrop || !card) return;
  setModalLayoutForAssigned();
  if (modalTitle) modalTitle.textContent = "Assigned Teams";

  const gateEl = card.querySelector(".gate-label");
  const gateText = gateEl ? gateEl.textContent.trim() : "Gate";
  if (modalGate) modalGate.textContent = gateText || "Gate";
  setModalGatePatdown(false);

  const flightEl = card.querySelector(".flight-tag");
  const flightText = flightEl ? flightEl.textContent.replace("バ^", "").trim() : "-";
  if (modalFlightNumber) modalFlightNumber.textContent = flightText || "-";
  const etd = getEtdFromCard(card);
  if (modalGateOpeningTime) {
    modalGateOpeningTime.textContent = getGateOpeningTime(etd);
  }
  if (modalReportingTime) {
    modalReportingTime.textContent = getReportingTime(etd);
  }

  const assignedTeams = Array.from(
    card.querySelectorAll(".flight-progress .progress-row")
  ).map((row) => {
    const cells = row.querySelectorAll("span");
    return {
      team: cells[0]?.textContent.trim() || "-",
      progress: cells[1]?.textContent.trim() || "-",
    };
  });

  if (modalTeamList) {
    modalTeamList.innerHTML = assignedTeams.length
      ? assignedTeams
          .map(
            (team) =>
              `<li><span>${team.team}</span><span>${team.progress}</span></li>`
          )
          .join("")
      : "<li><span>No assigned teams</span><span>-</span></li>";
  }

  if (modalTeamBlock) {
    modalTeamBlock.classList.remove("is-hidden");
  }

  modalBackdrop.classList.add("is-visible");
  modal.classList.add("is-visible");
};

const normalizeGateLabel = (label) => label.replace(/\s+/g, " ").trim();

const getGateLabelForCard = (card) => {
  if (!card) return "Gate";
  const newGate = card.querySelector(".new-gate")?.textContent.trim();
  if (newGate) return `Gate ${newGate}`;
  const gateEl = card.querySelector(".gate-label");
  if (gateEl) return normalizeGateLabel(gateEl.textContent);
  const banner = card.querySelector(".gate-banner");
  if (!banner) return "Gate";
  const cleaned = banner.textContent.replace("PULL TEAM", "").replace("CLOSE GATE", "");
  return normalizeGateLabel(cleaned);
};

const formatNextGateLabel = (card) => {
  return getGateLabelForCard(card);
};

const extractFlightNumber = (text) => {
  if (!text) return "-";
  const normalized = text.replace(/\s+/g, " ").trim();
  const match = normalized.match(/[A-Z]{1,3}\s*\d+/);
  return match ? match[0].replace(/\s+/g, " ") : normalized || "-";
};

const getFlightNumberFromCard = (card) => {
  if (!card) return "-";
  const flightEl = card.querySelector(".flight-tag");
  return extractFlightNumber(flightEl ? flightEl.textContent : "");
};

const getEtdFromCard = (card) => {
  const times = card?.querySelector(".flight-times");
  if (!times) return null;
  const etdSpan = Array.from(times.querySelectorAll("span")).find((span) =>
    span.textContent.trim().startsWith("ETD")
  );
  if (!etdSpan) return null;
  const match = etdSpan.textContent.match(/(\d{4})hrs/);
  return match ? `${match[1]}hrs` : null;
};

const getGateOpeningTime = (etd) => {
  if (!etd) return "-";
  const got = subtractMinutes(etd, 70);
  return got || "-";
};

const getReportingTime = (etd) => {
  const got = getGateOpeningTime(etd);
  if (!got || got === "-") return "-";
  const rt = subtractMinutes(got, 20);
  return rt || "-";
};

const getNextGateCandidates = (card) => {
  const grid = card?.closest(".card-grid");
  const cards = grid
    ? Array.from(grid.querySelectorAll(".flight-card"))
    : Array.from(document.querySelectorAll(".flight-card"));
  if (!cards.length) return [];
  if (!card) return cards;
  const index = cards.indexOf(card);
  const rotated = index === -1 ? cards : cards.slice(index + 1).concat(cards.slice(0, index));
  const candidates = rotated.filter((item) => item !== card);
  return candidates.length ? candidates : [card];
};

const getTeamMemberCountFromLabel = (label) => {
  const match = label.match(/\((\d+)\)/);
  const count = match ? Number(match[1]) : 3;
  return Number.isFinite(count) && count > 0 ? count : 3;
};

const buildPullTeams = (card) => {
  if (!card) return [];
  const rows = Array.from(card.querySelectorAll(".flight-progress .progress-row"));
  const candidates = getNextGateCandidates(card);
  const seen = new Set();
  let candidateIndex = 0;

  return rows.reduce((acc, row) => {
    const label = row.querySelector("span:first-child")?.textContent.trim();
    if (!label || seen.has(label)) return acc;
    seen.add(label);
    const explicitGate = row.dataset.nextGate;
    const nextCard = candidates[candidateIndex % (candidates.length || 1)];
    const nextGate = explicitGate || (nextCard ? formatNextGateLabel(nextCard) : "-");
    const isPatdown = Boolean(nextCard && nextCard.querySelector(".badge-patdown"));
    const etd = nextCard ? getEtdFromCard(nextCard) : null;
    const gateOpeningTime = getGateOpeningTime(etd);
    const reportingTime = getReportingTime(etd);
    const flightNo = nextCard ? getFlightNumberFromCard(nextCard) : "-";
    const memberCount = getTeamMemberCountFromLabel(label);
    acc.push({
      label,
      nextGate,
      isPatdown,
      reportingTime,
      flightNo,
      gateOpeningTime,
      members: pickTeamMembers(memberCount),
    });
    candidateIndex += 1;
    return acc;
  }, []);
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
  const etdValue = etdText !== "-" ? etdText : null;
  const reportingTime = getReportingTime(etdValue);
  const gateOpeningTime = getGateOpeningTime(etdValue);
  const flightNo = card ? getFlightNumberFromCard(card) : flightText;
  const reportTime = reportingTime;
  const teams = pull ? buildPullTeams(card) : [];
  const teamMembers = pull && teams.length === 0 ? pickTeamMembers() : [];
  const closeOfficers = close ? pickCloseOfficers() : [];
  const isPatdown = pull ? Boolean(card && card.querySelector(".badge-patdown")) : false;

  openModal({
    title: pull ? "Pull Team Officers" : "Close Gate Officers",
    gate: gateText,
    nextGate: nextGateText,
    etd: etdText,
    std: stdText,
    flightNo,
    reportTime,
    reportingTime,
    gateOpeningTime,
    isPatdown,
    teamMembers,
    closeOfficers,
    teams,
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
