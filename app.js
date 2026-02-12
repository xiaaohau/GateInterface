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

const getInProgressCards = () => {
  const page = document.querySelector(".in-progress-page");
  if (!page) return [];
  const mainGrid = page.querySelector(".card-grid:not(.history-grid)");
  const scope = mainGrid || page;
  return Array.from(scope.querySelectorAll(".flight-card"));
};

const getVisibleInProgressCards = () =>
  getInProgressCards().filter((card) => !card.classList.contains("is-hidden"));

const PULL_TEAM_ICON = `
  <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="9" cy="6.5" r="2"/>
    <path d="M7 12l2.8-2 2.2 2 2.2-1.1"/>
    <path d="M6 18l2-4 2.2 1.4L12 20"/>
    <path d="M12.5 12.5l2.5 1.5 1.5 3"/>
    <path d="M15.5 8.5h6"/>
    <path d="M19 6l2.5 2.5L19 11"/>
  </svg>
`;

const CLOSE_GATE_ICON = `
  <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
    <path d="M6 4h12v16H6z"/>
    <path d="M10 4v16"/>
    <circle cx="14.5" cy="12" r="0.9"/>
  </svg>
`;

const getFsAlertCandidateCards = () => {
  const visibleCards = getVisibleInProgressCards();
  if (visibleCards.length) return visibleCards;
  return getInProgressCards();
};

const pickPreferredAlertCard = (cards, predicate) => {
  if (!Array.isArray(cards) || cards.length === 0) return null;
  if (typeof predicate === "function") {
    const preferred = cards.find((card) => predicate(card));
    if (preferred) return preferred;
  }
  return cards[Math.floor(Math.random() * cards.length)] || null;
};

const ensureGateBadgesContainer = (card) => {
  if (!card) return null;
  const banner = card.querySelector(".gate-banner");
  if (!banner) return null;
  let badges = banner.querySelector(".gate-badges");
  if (badges) return badges;
  badges = document.createElement("div");
  badges.className = "gate-badges";
  const actions = banner.querySelector(".gate-actions");
  if (actions) {
    banner.insertBefore(badges, actions);
  } else {
    banner.appendChild(badges);
  }
  return badges;
};

const ensureGateActionsContainer = (card) => {
  if (!card) return null;
  const banner = card.querySelector(".gate-banner");
  if (!banner) return null;
  let actions = banner.querySelector(".gate-actions");
  if (actions) return actions;
  actions = document.createElement("div");
  actions.className = "gate-actions";
  banner.appendChild(actions);
  return actions;
};

const updatePullCount = () => {
  const countEl = document.querySelector("#pull-count");
  if (!countEl) return;
  const count = getVisibleInProgressCards().filter((card) =>
    card.querySelector(".pull-team")
  ).length;
  countEl.textContent = String(count);
};

const updateGateChangeCount = () => {
  const countEl = document.querySelector("#gate-change-count");
  if (!countEl) return;
  const count = getVisibleInProgressCards().filter((card) =>
    card.classList.contains("gate-changed")
  ).length;
  countEl.textContent = String(count);
};

const updateEnhancedCount = () => {
  const countEl = document.querySelector("#enhanced-count");
  if (!countEl) return;
  const count = getVisibleInProgressCards().filter((card) =>
    card.classList.contains("has-screening")
  ).length;
  countEl.textContent = String(count);
};

const isPatdownCard = (card) => {
  if (!card) return false;
  return Boolean(card.querySelector(".badge-patdown"));
};

const updatePatdownCount = () => {
  const countEl = document.querySelector("#patdown-count");
  if (!countEl) return;
  const count = getVisibleInProgressCards().filter(isPatdownCard).length;
  countEl.textContent = String(count);
};

const updateGateCount = () => {
  const gateEl = document.querySelector("#gate-count");
  if (!gateEl) return;
  const count = getVisibleInProgressCards().length;
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

const applyPatdownGateBanner = () => {
  document.querySelectorAll(".flight-card").forEach((card) => {
    const hasPatdownBadge = Boolean(card.querySelector(".badge-patdown"));
    card.classList.toggle("patdown-gate", hasPatdownBadge);
  });
};

const clearGateChangeField = (card) => {
  if (!card) return;
  const gateLabel = card.querySelector(".gate-label");
  card.querySelectorAll(".gate-change-field").forEach((el) => el.remove());
  const currentGateCode = getFlightCardGateCode(card);
  if (gateLabel && currentGateCode) {
    gateLabel.textContent = `Gate ${currentGateCode}`;
  }
};

const getPreviousGateCodeForChange = (newGateCode, preferredOldCode = "") => {
  const normalizedNew = normalizeAllowedGateCode(newGateCode);
  const normalizedPreferred = normalizeAllowedGateCode(preferredOldCode);
  if (normalizedPreferred && normalizedPreferred !== normalizedNew) {
    return normalizedPreferred;
  }
  const index = ALLOWED_GATE_CODES.indexOf(normalizedNew);
  if (index === -1) return "";
  if (index > 0) return ALLOWED_GATE_CODES[index - 1];
  return ALLOWED_GATE_CODES[index + 1] || "";
};

const renderGateChangeField = (card, oldGateCode, newGateCode) => {
  if (!card) return;
  clearGateChangeField(card);
  const oldCode = normalizeAllowedGateCode(oldGateCode);
  const newCode = normalizeAllowedGateCode(newGateCode);
  if (!oldCode || !newCode || oldCode === newCode) return;
  const gateLabel = card.querySelector(".gate-label");
  if (!gateLabel) return;
  card.dataset.currentGateCode = newCode;
  gateLabel.innerHTML = `Gate <span class="gate-change-field"><span class="old">${oldCode}</span><span class="arrow">&rarr;</span><span class="new">${newCode}</span></span>`;
};

const applySingleGateChangeAlert = () => {
  const cards = getInProgressCards();
  if (!cards.length) {
    updateGateChangeCount();
    return;
  }
  const candidates = getFsAlertCandidateCards();
  const target = pickPreferredAlertCard(
    candidates,
    (card) =>
      card.dataset.gateChangeAlert === "true" || card.classList.contains("gate-changed")
  );
  const targetGateCode = target ? getFlightCardGateCode(target) : "";
  const oldGateCode = target
    ? getPreviousGateCodeForChange(targetGateCode, target.dataset.gateChangeOldGate || "")
    : "";

  cards.forEach((card) => {
    card.classList.remove("gate-changed");
    card.dataset.gateChangeAlert = "false";
    card.dataset.gateChangeOldGate = "";
    const gateLabel = card.querySelector(".gate-label");
    if (gateLabel) gateLabel.classList.remove("gate-change-alert");
    clearGateChangeField(card);
  });

  if (target) {
    target.classList.add("gate-changed");
    target.dataset.gateChangeAlert = "true";
    if (oldGateCode) {
      target.dataset.gateChangeOldGate = oldGateCode;
    }
    const gateLabel = target.querySelector(".gate-label");
    if (gateLabel) {
      gateLabel.classList.add("gate-change-alert");
    }
    renderGateChangeField(target, oldGateCode, targetGateCode);
  }

  updateGateChangeCount();
};

const applySinglePatdownAlert = () => {
  const cards = getInProgressCards();
  if (!cards.length) {
    updatePatdownCount();
    return;
  }
  const candidates = getFsAlertCandidateCards();
  const target = pickPreferredAlertCard(
    candidates,
    (card) =>
      card.dataset.patdownAlert === "true" || Boolean(card.querySelector(".badge-patdown"))
  );

  cards.forEach((card) => {
    card.dataset.patdownAlert = "false";
    card.querySelectorAll(".badge-patdown").forEach((badge) => badge.remove());
    card.classList.remove("has-patdown");
  });

  if (target) {
    const badges = ensureGateBadgesContainer(target);
    if (badges) {
      const badge = document.createElement("span");
      badge.className = "badge badge-patdown";
      badge.textContent = "Patdown";
      badges.appendChild(badge);
      target.dataset.patdownAlert = "true";
      target.classList.add("has-patdown");
    }
  }

  applyPatdownGateBanner();
  updatePatdownCount();
};

const applySinglePullAlert = () => {
  const cards = getInProgressCards();
  if (!cards.length) {
    updatePullCount();
    return;
  }

  const candidates = getFsAlertCandidateCards();
  const target = pickPreferredAlertCard(
    candidates,
    (card) => card.dataset.pullAlert === "true" || Boolean(card.querySelector(".pull-team"))
  );

  cards.forEach((card) => {
    card.dataset.pullAlert = "false";
    card.querySelectorAll(".pull-team, .close-gate").forEach((badge) => badge.remove());
    card.classList.remove("has-pull");
  });

  if (target) {
    const actions = ensureGateActionsContainer(target);
    if (actions) {
      const pull = document.createElement("button");
      pull.type = "button";
      pull.className = "pull-team";
      pull.setAttribute("aria-label", "Pull Team");
      pull.setAttribute("data-label", "Pull Team");
      pull.innerHTML = PULL_TEAM_ICON;

      const close = document.createElement("button");
      close.type = "button";
      close.className = "close-gate";
      close.setAttribute("aria-label", "Close Gate");
      close.setAttribute("data-label", "Close Gate");
      close.innerHTML = CLOSE_GATE_ICON;

      actions.appendChild(pull);
      actions.appendChild(close);
      target.classList.add("has-pull");
      target.dataset.pullAlert = "true";
    }
  }

  updatePullCount();
  syncLiveFlightsFromPage();
};

const DOCKS_PER_ROW = 4;

const getDockCountForCard = (card) => {
  if (!card) return 0;
  const stored = Number(card.dataset.dockCount);
  if (Number.isFinite(stored) && stored >= 0 && stored <= DOCKS_PER_ROW) {
    return stored;
  }
  const randomCount = Math.floor(Math.random() * DOCKS_PER_ROW) + 1;
  card.dataset.dockCount = String(randomCount);
  return randomCount;
};

const buildDockMeterMarkup = (dockCount) => {
  const clamped = Math.max(0, Math.min(DOCKS_PER_ROW, dockCount));
  const docks = Array.from({ length: DOCKS_PER_ROW }, (_, idx) => {
    const activeClass = idx < clamped ? " is-active" : "";
    return `<span class="progress-dock${activeClass}"></span>`;
  }).join("");
  return `<span class="dock-meter" aria-hidden="true">${docks}</span>`;
};

const applyAssignedTeamDocks = () => {
  const page = document.querySelector(".in-progress-page");
  if (!page) return;
  page.querySelectorAll(".flight-card").forEach((card) => {
    const dockCount = getDockCountForCard(card);
    card.querySelectorAll(".flight-progress .progress-row").forEach((row) => {
      const spans = Array.from(row.children).filter(
        (child) => child.tagName === "SPAN"
      );
      let indicator = spans[spans.length - 1];
      if (!indicator) {
        indicator = document.createElement("span");
        row.appendChild(indicator);
      }
      indicator.classList.add("dock-meter");
      indicator.innerHTML = "";
      for (let i = 0; i < DOCKS_PER_ROW; i += 1) {
        const dock = document.createElement("span");
        dock.className = "progress-dock";
        if (i < dockCount) dock.classList.add("is-active");
        indicator.appendChild(dock);
      }
    });
  });
};

const ZONE_A_GATES = Array.from({ length: 21 }, (_, idx) => `A${idx + 1}`);
const ZONE_B_GATES = Array.from({ length: 10 }, (_, idx) => `B${idx + 1}`);
const ALLOWED_GATE_CODES = [...ZONE_A_GATES, ...ZONE_B_GATES];
const GATE_CONFLICT_WINDOW_MINUTES = 90;
const RT_FORWARD_WINDOW_MINUTES = 90;

const normalizeAllowedGateCode = (value) => {
  const normalized = String(value || "")
    .toUpperCase()
    .replace(/^GATE\s*/i, "")
    .replace(/\s+/g, "")
    .trim();
  const match = normalized.match(/^([AB])(\d{1,2})$/);
  if (!match) return "";
  const zone = match[1];
  const number = Number(match[2]);
  if (zone === "A" && number >= 1 && number <= 21) return `A${number}`;
  if (zone === "B" && number >= 1 && number <= 10) return `B${number}`;
  return "";
};

const getCircularMinutesDiff = (first, second) => {
  if (!Number.isFinite(first) || !Number.isFinite(second)) return Number.MAX_SAFE_INTEGER;
  const diff = Math.abs(first - second);
  return Math.min(diff, 1440 - diff);
};

const getFlightCardGateCode = (card) => {
  if (!card) return "";
  const stored = normalizeAllowedGateCode(card.dataset.currentGateCode || "");
  if (stored) return stored;
  const labelText = String(card.querySelector(".gate-label")?.textContent || "");
  const matches = labelText.toUpperCase().match(/[AB]\s*\d{1,2}/g);
  const fallback = matches && matches.length ? matches[matches.length - 1] : labelText;
  const normalized = normalizeAllowedGateCode(fallback);
  if (normalized) {
    card.dataset.currentGateCode = normalized;
  }
  return normalized;
};

const setFlightCardGateCode = (card, gateCode) => {
  if (!card || !gateCode) return;
  const gateLabel = card.querySelector(".gate-label");
  card.dataset.currentGateCode = gateCode;
  if (gateLabel) {
    gateLabel.textContent = `Gate ${gateCode}`;
  }
  const label = gateLabel ? gateLabel.textContent.trim() : `Gate ${gateCode}`;
  card.setAttribute("aria-label", `Assigned Teams ${label}`);
};

const hasGateConflictInWindow = (allocations, gateCode, etdMinutes) =>
  allocations.some(
    (entry) =>
      entry.gateCode === gateCode &&
      getCircularMinutesDiff(entry.etdMinutes, etdMinutes) <=
        GATE_CONFLICT_WINDOW_MINUTES
  );

const enforceInProgressGatePolicy = () => {
  const page = document.querySelector(".in-progress-page");
  if (!page) return;
  const cards = getInProgressCards();
  if (!cards.length) return;

  const allocations = [];
  const ordered = cards
    .map((card, index) => ({
      card,
      index,
      gateCode: getFlightCardGateCode(card),
      etdMinutes: toMinutes(getTimeLabelFromCard(card, "ETD")),
    }))
    .sort((left, right) => {
      const leftMinutes = Number.isFinite(left.etdMinutes)
        ? left.etdMinutes
        : Number.MAX_SAFE_INTEGER;
      const rightMinutes = Number.isFinite(right.etdMinutes)
        ? right.etdMinutes
        : Number.MAX_SAFE_INTEGER;
      if (leftMinutes !== rightMinutes) return leftMinutes - rightMinutes;
      return left.index - right.index;
    });

  ordered.forEach((entry, index) => {
    const candidates = Array.from(
      new Set([entry.gateCode, ...ALLOWED_GATE_CODES].filter(Boolean))
    );

    let selected = candidates.find((candidate) => {
      if (!ALLOWED_GATE_CODES.includes(candidate)) return false;
      if (!Number.isFinite(entry.etdMinutes)) {
        return !allocations.some((item) => item.gateCode === candidate);
      }
      return !hasGateConflictInWindow(allocations, candidate, entry.etdMinutes);
    });

    if (!selected) {
      selected = ALLOWED_GATE_CODES[index % ALLOWED_GATE_CODES.length];
    }

    setFlightCardGateCode(entry.card, selected);
    allocations.push({ gateCode: selected, etdMinutes: entry.etdMinutes });
  });
};

const enablePullFilter = () => {
  const tile = document.querySelector("#pull-count-tile");
  if (!tile) return;

  getInProgressCards().forEach((card) => {
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

const enableEnhancedFilter = () => {
  const tile = document.querySelector("#enhanced-count-tile");
  if (!tile) return;

  const toggleFilter = () => {
    document.body.classList.toggle("enhanced-filter-active");
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
    getInProgressCards().forEach((card) => {
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
    const gateCode = getFlightCardGateCode(card);
    const label = gateCode ? `Assigned Teams Gate ${gateCode}` : "Assigned Teams";
    card.setAttribute("aria-label", label);
  });

  page.addEventListener("click", (event) => {
    if (event.target.closest(".pull-team, .close-gate, .edit-flight")) return;
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

let editingFlightCard = null;

const normalizeGateInput = (value) =>
  String(value || "")
    .replace(/^gate\s*/i, "")
    .trim();

const formatGateLabel = (value) => {
  const gate = normalizeGateInput(value);
  return gate ? `Gate ${gate}` : "Gate --";
};

const normalizeFlightNumber = (value) => {
  const trimmed = String(value || "").trim().toUpperCase();
  if (!trimmed) return "";
  const extracted = extractFlightNumber(trimmed);
  const normalized = extracted && extracted !== "-" ? extracted : trimmed;
  return normalized.replace(/^([A-Z]{1,3})(\d+)/, "$1 $2");
};

const getFlightTagPrefix = () => {
  const sample = document.querySelector(".flight-card .flight-tag");
  if (!sample) return "";
  const raw = sample.textContent || "";
  const flightNo = extractFlightNumber(raw);
  if (!flightNo || flightNo === "-") return "";
  const prefix = raw.replace(flightNo, "").trim();
  return prefix ? `${prefix} ` : "";
};

const formatFlightTag = (flightNo) => {
  const prefix = getFlightTagPrefix();
  const normalized = normalizeFlightNumber(flightNo);
  return `${prefix}${normalized || "--"}`;
};

const normalizeTimeInput = (value) => {
  const digitsRaw = String(value || "").replace(/\D/g, "");
  if (!digitsRaw) return "";
  const digits = digitsRaw.length === 3 ? `0${digitsRaw}` : digitsRaw;
  if (digits.length !== 4) return "";
  return `${digits}hrs`;
};

const extractTimeDigits = (value) => {
  const match = String(value || "").match(/(\d{4})hrs/);
  return match ? match[1] : "";
};

const normalizePaxInput = (value) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? String(parsed) : "";
};

const getExistingRemarkForCard = (card) => {
  if (!card) return "";
  if (card.hasAttribute("data-remarks")) {
    return normalizeRemarkValue(card.dataset.remarks);
  }
  const existing = card.querySelector(".flight-remarks");
  return existing ? normalizeRemarkValue(existing.textContent) : "";
};

const setTimeSpan = (timesEl, label, value) => {
  if (!timesEl) return;
  const spans = Array.from(timesEl.querySelectorAll("span"));
  let target = spans.find((span) => span.textContent.trim().startsWith(label));
  if (!target) {
    target = document.createElement("span");
    timesEl.appendChild(target);
  }
  target.textContent = `${label}: ${value || "--"}`;
};

const ensureFlightMeta = (metaEl) => {
  if (!metaEl) return [];
  const spans = Array.from(metaEl.querySelectorAll("span"));
  while (spans.length < 2) {
    const span = document.createElement("span");
    metaEl.appendChild(span);
    spans.push(span);
  }
  return spans;
};

const buildProgressRows = () => {
  const usedTeams = new Set();
  const rows = [];
  for (let i = 0; i < 4; i += 1) {
    let teamId = Math.floor(Math.random() * 24) + 1;
    while (usedTeams.has(teamId)) {
      teamId = Math.floor(Math.random() * 24) + 1;
    }
    usedTeams.add(teamId);
    const pct = (Math.floor(Math.random() * 8) + 2) * 10;
    rows.push(
      `<div class="progress-row"><span>Team ${teamId}</span><span>${pct}%</span></div>`
    );
    rows.push(`<div class="progress-bar"><span style="width: ${pct}%"></span></div>`);
  }
  return rows.join("");
};

const createFlightCardElement = (data) => {
  const card = document.createElement("article");
  card.className = "card flight-card";
  card.dataset.userCreated = "true";
  card.dataset.remarks = data.remarks || "";
  const normalizedGateCode = normalizeAllowedGateCode(data.gate);
  if (normalizedGateCode) {
    card.dataset.currentGateCode = normalizedGateCode;
  }
  card.innerHTML = `
    <div class="gate-banner">
      <span class="gate-label">${formatGateLabel(data.gate)}</span>
      <div class="gate-badges"></div>
      <div class="gate-actions"></div>
    </div>
    <div class="fs-badge">FS: Unassigned</div>
    <div class="flight-top">
      <div class="flight-tag">${formatFlightTag(data.flightNo)}</div>
      <div class="card-sub">TBD</div>
      <div class="status on-time">On-Time</div>
    </div>
    <div class="flight-details">
      <div class="flight-times">
        <span>ETD: ${data.etd || "--"}</span>
        <span>STD: ${data.std || "--"}</span>
      </div>
      <div class="flight-meta"><span>Type: --</span><span>Pax: ${
        data.pax || "--"
      }</span></div>
    </div>
    <div class="flight-progress">
      <div class="card-sub">Assigned Teams</div>
      ${buildProgressRows()}
    </div>
  `;
  return card;
};

const setCardPressable = (card) => {
  if (!card) return;
  card.classList.add("is-pressable");
  card.setAttribute("tabindex", "0");
  card.setAttribute("role", "button");
  const gateCode = getFlightCardGateCode(card);
  const label = gateCode ? `Assigned Teams Gate ${gateCode}` : "Assigned Teams";
  card.setAttribute("aria-label", label);
};

const ensureEditButtons = () => {
  const page = document.querySelector(".in-progress-page");
  if (!page) return;
  page.querySelectorAll(".flight-card").forEach((card) => {
    const banner = card.querySelector(".gate-banner");
    if (!banner) return;
    const isUserCreated = card.dataset.userCreated === "true";
    let actions = banner.querySelector(".gate-actions");
    if (!actions) {
      if (!isUserCreated) return;
      actions = document.createElement("div");
      actions.className = "gate-actions";
      banner.appendChild(actions);
    }
    const existing = actions.querySelector(".edit-flight");
    if (!isUserCreated) {
      if (existing) existing.remove();
      return;
    }
    if (existing) return;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "edit-flight";
    button.textContent = "Edit";
    button.setAttribute("aria-label", "Edit Flight");
    actions.appendChild(button);
  });
};

const openFlightEditor = (card) => {
  const panel = document.querySelector("#flight-editor-panel");
  const title = document.querySelector("#flight-editor-title");
  const save = document.querySelector("#flight-editor-save");
  const gateInput = document.querySelector("#flight-gate");
  const numberInput = document.querySelector("#flight-number");
  const etdInput = document.querySelector("#flight-etd");
  const stdInput = document.querySelector("#flight-std");
  const paxInput = document.querySelector("#flight-pax");
  const remarksInput = document.querySelector("#flight-remarks");
  if (!panel || !title || !save || !gateInput || !numberInput || !etdInput || !stdInput || !paxInput || !remarksInput) {
    return;
  }

  editingFlightCard = card || null;
  title.textContent = editingFlightCard ? "Edit Flight" : "Create Flight";
  save.textContent = editingFlightCard ? "Save Changes" : "Save Flight";

  const existingGateCode = editingFlightCard ? getFlightCardGateCode(editingFlightCard) : "";
  const gateLabel = editingFlightCard
    ? editingFlightCard.querySelector(".gate-label")?.textContent || ""
    : "";
  gateInput.value = existingGateCode || normalizeGateInput(gateLabel);

  const tagText = editingFlightCard
    ? editingFlightCard.querySelector(".flight-tag")?.textContent || ""
    : "";
  numberInput.value = normalizeFlightNumber(tagText);

  const times = editingFlightCard?.querySelector(".flight-times");
  const spans = times ? Array.from(times.querySelectorAll("span")) : [];
  const etdSpan = spans.find((span) => span.textContent.trim().startsWith("ETD"));
  const stdSpan = spans.find((span) => span.textContent.trim().startsWith("STD"));
  etdInput.value = extractTimeDigits(etdSpan ? etdSpan.textContent : "");
  stdInput.value = extractTimeDigits(stdSpan ? stdSpan.textContent : "");

  const paxText = editingFlightCard
    ? editingFlightCard.querySelector(".flight-meta span:last-child")?.textContent || ""
    : "";
  const paxMatch = paxText.match(/(\d+)/);
  paxInput.value = paxMatch ? paxMatch[1] : "";

  remarksInput.value = editingFlightCard ? getExistingRemarkForCard(editingFlightCard) : "";

  panel.classList.remove("is-hidden");
  gateInput.focus();
};

const closeFlightEditor = () => {
  const panel = document.querySelector("#flight-editor-panel");
  const gateInput = document.querySelector("#flight-gate");
  const numberInput = document.querySelector("#flight-number");
  const etdInput = document.querySelector("#flight-etd");
  const stdInput = document.querySelector("#flight-std");
  const paxInput = document.querySelector("#flight-pax");
  const remarksInput = document.querySelector("#flight-remarks");
  if (!panel || !gateInput || !numberInput || !etdInput || !stdInput || !paxInput || !remarksInput) {
    return;
  }

  editingFlightCard = null;
  gateInput.value = "";
  numberInput.value = "";
  etdInput.value = "";
  stdInput.value = "";
  paxInput.value = "";
  remarksInput.value = "";
  panel.classList.add("is-hidden");
};

const saveFlightEditor = () => {
  const gateInput = document.querySelector("#flight-gate");
  const numberInput = document.querySelector("#flight-number");
  const etdInput = document.querySelector("#flight-etd");
  const stdInput = document.querySelector("#flight-std");
  const paxInput = document.querySelector("#flight-pax");
  const remarksInput = document.querySelector("#flight-remarks");
  if (!gateInput || !numberInput || !etdInput || !stdInput || !paxInput || !remarksInput) {
    return;
  }

  if (!gateInput.reportValidity() || !numberInput.reportValidity()) return;

  const etd = normalizeTimeInput(etdInput.value);
  const std = normalizeTimeInput(stdInput.value) || etd;
  const pax = normalizePaxInput(paxInput.value);
  const remarks = normalizeRemarkValue(remarksInput.value);
  const data = {
    gate: gateInput.value,
    flightNo: numberInput.value,
    etd,
    std,
    pax,
    remarks,
  };

  let card = editingFlightCard;
  if (!card) {
    card = createFlightCardElement(data);
    const grid = document.querySelector(".in-progress-page .card-grid");
    if (grid) grid.appendChild(card);
  } else {
    const normalizedGateCode = normalizeAllowedGateCode(data.gate);
    const gateLabel = card.querySelector(".gate-label");
    if (normalizedGateCode) {
      setFlightCardGateCode(card, normalizedGateCode);
    } else if (gateLabel) {
      gateLabel.textContent = formatGateLabel(data.gate);
      card.dataset.currentGateCode = "";
    }
    const flightTag = card.querySelector(".flight-tag");
    if (flightTag) flightTag.textContent = formatFlightTag(data.flightNo);
    const times = card.querySelector(".flight-times");
    if (times) {
      setTimeSpan(times, "ETD", data.etd || "--");
      setTimeSpan(times, "STD", data.std || "--");
    }
    const meta = card.querySelector(".flight-meta");
    if (meta) {
      const spans = ensureFlightMeta(meta);
      if (spans[0]) spans[0].textContent = spans[0].textContent || "Type: --";
      if (spans[1]) spans[1].textContent = `Pax: ${data.pax || "--"}`;
    }
  }

  if (card) {
    card.dataset.remarks = data.remarks || "";
    setCardPressable(card);
  }

  ensureEditButtons();
  applyRemarksToCards();
  applyTeamOfficerCounts();
  applyPatdownGateBanner();
  applyAssignedTeamDocks();
  applyProgressColors();
  applyStatusGateColors();
  enforceInProgressGatePolicy();
  applyAssignmentsToCards();
  syncLiveFlightsFromPage();
  movePastEtdToHistory();
  updateGateCount();
  updatePatdownCount();
  updatePullCount();
  updateGateChangeCount();
  updateEnhancedCount();
  updateRtGotForInProgress();
  syncLiveFlightsFromPage();
  setTimeout(sortInProgressByRT, 0);
  closeFlightEditor();
};

const setupFlightEditor = () => {
  const trigger = document.querySelector("#create-flight");
  const cancel = document.querySelector("#flight-editor-cancel");
  const save = document.querySelector("#flight-editor-save");
  const panel = document.querySelector("#flight-editor-panel");
  if (!trigger || !cancel || !save || !panel) return;

  ensureEditButtons();

  trigger.addEventListener("click", () => openFlightEditor(null));
  cancel.addEventListener("click", closeFlightEditor);
  save.addEventListener("click", saveFlightEditor);

  panel.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeFlightEditor();
    }
  });

  document.addEventListener("click", (event) => {
    const edit = event.target.closest(".edit-flight");
    if (!edit) return;
    const card = edit.closest(".flight-card");
    if (!card) return;
    openFlightEditor(card);
  });
};

document.addEventListener("DOMContentLoaded", () => {
  applyStatusGateColors();
  randomizeRemarksForCards();
  applyRemarksToCards();
  enforceInProgressGatePolicy();
  updateScreeningTypes();
  applySingleGateChangeAlert();
  applySinglePatdownAlert();
  updateGateCount();
  applyAssignmentsToCards();
  applyTeamOfficerCounts();
  applyAssignedTeamDocks();
  setupFsLeaderAssignment();
  enableAssignClose();
  enablePullFilter();
  enableGateChangeFilter();
  enableEnhancedFilter();
  enablePatdownFilter();
  enableAssignedTeamsCards();
  ensureEditButtons();
  setupFlightEditor();
  enablePullRandom();
  enableTeamsToggle();
  setupHistoryModal();
  syncLiveFlightsFromPage();
  movePastEtdToHistory();
  syncLiveFlightsFromPage();
  setInterval(movePastEtdToHistory, 60000);
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

const setupHistoryModal = () => {
  const trigger = document.querySelector("#toggle-history");
  if (!trigger || !historyModal || !historyBackdrop || !historyClose) return;
  trigger.addEventListener("click", openHistoryModal);
  historyClose.addEventListener("click", closeHistoryModal);
  historyBackdrop.addEventListener("click", closeHistoryModal);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && historyModal.classList.contains("is-visible")) {
      closeHistoryModal();
    }
  });
};

const enableAssignClose = () => {
  const button = document.querySelector("#assign-close");
  if (!button) return;
  button.addEventListener("click", () => {
    window.close();
    if (!window.closed) {
      window.history.back();
    }
  });
};

const setupFsLeaderAssignment = () => {
  const trigger = document.querySelector("#assign-fs-leader");
  const panel = document.querySelector("#fs-leader-panel");
  const list = document.querySelector("#fs-leader-list");
  const save = document.querySelector("#fs-leader-save");
  const cancel = document.querySelector("#fs-leader-cancel");
  if (!trigger || !panel || !list || !save || !cancel) return;

  const leaders = ["A. Rahman", "S. Lim", "K. Wong", "J. Tan"];
  let selectedName = "";

  const normalizeName = (value) =>
    String(value || "").replace(/^FS\s*-\s*/i, "").trim();

  const setSelected = (name) => {
    selectedName = name;
    list.querySelectorAll(".fs-leader-option").forEach((btn) => {
      btn.classList.toggle("is-selected", btn.dataset.name === name);
    });
  };

  list.innerHTML = leaders
    .map(
      (name) =>
        `<button class="assign-gate fs-leader-option" type="button" data-name="${name}">FS - ${name}</button>`
    )
    .join("");

  const storedName = loadFsLeaderFromStorage();
  const currentName = storedName || normalizeName(fsName ? fsName.textContent : "");
  if (currentName) applyFsLeaderToPage(currentName);
  if (leaders.includes(currentName)) setSelected(currentName);

  list.addEventListener("click", (event) => {
    const btn = event.target.closest(".fs-leader-option");
    if (!btn) return;
    setSelected(btn.dataset.name || "");
  });

  const hidePanel = () => panel.classList.add("is-hidden");

  trigger.addEventListener("click", () => {
    panel.classList.toggle("is-hidden");
  });

  cancel.addEventListener("click", hidePanel);

  save.addEventListener("click", () => {
    if (!selectedName) return;
    applyFsLeaderToPage(selectedName);
    saveFsLeaderToStorage(selectedName);
    hidePanel();
  });
};

const enablePullRandom = () => {
  const button = document.querySelector("#pull-random");
  if (button) {
    button.addEventListener("click", applySinglePullAlert);
  }
  applySinglePullAlert();
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
const modalPreviousBlock = document.querySelector(".modal-previous-flight");
const modalPrevGate = modalPreviousBlock
  ? modalPreviousBlock.querySelector(".modal-prev-gate")
  : null;
const modalPrevFlight = modalPreviousBlock
  ? modalPreviousBlock.querySelector(".modal-prev-flight")
  : null;
const modalPrevEtd = modalPreviousBlock
  ? modalPreviousBlock.querySelector(".modal-prev-etd")
  : null;
const modalSummary = document.querySelector(".modal-summary");
const modalAction = modal ? modal.querySelector(".modal-action") : null;
const modalTeamTitle = modalTeamBlock ? modalTeamBlock.querySelector("div") : null;
const historyModal = document.querySelector(".history-modal");
const historyBackdrop = document.querySelector(".history-backdrop");
const historyClose = document.querySelector(".history-close");
const historyModalGrid = historyModal
  ? historyModal.querySelector(".history-modal-grid")
  : null;
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

const STORAGE_KEYS = {
  fsLeader: "gateinterface.fsLeader",
  assignments: "gateinterface.assignments",
  liveFlights: "gateinterface.liveFlights",
};

const normalizeFsLeaderName = (value) =>
  String(value || "").replace(/^FS\s*-\s*/i, "").trim();

const normalizeStorageLabel = (value) =>
  String(value || "")
    .replace(/\s+/g, " ")
    .trim();

const normalizeStorageGateLabel = (value) => {
  const allowedCode = normalizeAllowedGateCode(value);
  if (allowedCode) return `Gate ${allowedCode}`;
  const gate = normalizeStorageLabel(value).replace(/^gate\s*/i, "");
  return gate ? `Gate ${gate}` : "Gate --";
};

const normalizeStorageFlightNumber = (value) => {
  const raw = normalizeStorageLabel(value).toUpperCase();
  if (!raw) return "-";
  const match = raw.match(/[A-Z]{1,3}\s*\d+/);
  return match ? match[0].replace(/\s+/g, " ") : raw;
};

const normalizeStorageTime = (value) => {
  const match = String(value || "").match(/(\d{4})hrs/i);
  return match ? `${match[1]}hrs` : "-";
};

const parseStorageTimeToMinutes = (value) => {
  const match = normalizeStorageTime(value).match(/(\d{2})(\d{2})hrs/);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
};

const normalizeMinutesValue = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return null;
  return ((Math.trunc(numeric) % 1440) + 1440) % 1440;
};

const deriveRtMinutesFromEtd = (etdValue) => {
  const etdMinutes = parseStorageTimeToMinutes(etdValue);
  if (etdMinutes === null) return null;
  return ((etdMinutes - 90) % 1440 + 1440) % 1440;
};

const getLiveFlightRtMinutes = (flight) => {
  if (!flight || typeof flight !== "object") return null;
  const fromStored = normalizeMinutesValue(flight.rtMinutes);
  if (fromStored !== null) return fromStored;

  const rtMatch = String(flight.rt || "").match(/(\d{4})hrs/i);
  if (rtMatch) {
    const parsed = parseStorageTimeToMinutes(`${rtMatch[1]}hrs`);
    if (parsed !== null) return parsed;
  }

  return deriveRtMinutesFromEtd(flight.etd);
};

const isWithinForwardRtWindow = (rtMinutes, windowMinutes = RT_FORWARD_WINDOW_MINUTES) => {
  const normalizedRt = normalizeMinutesValue(rtMinutes);
  if (normalizedRt === null) return false;
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const minutesUntilRt = (normalizedRt - nowMinutes + 1440) % 1440;
  return minutesUntilRt <= windowMinutes;
};

const extractStorageTimeFromCard = (card, label) => {
  const times = card?.querySelector(".flight-times");
  if (!times) return "-";
  const span = Array.from(times.querySelectorAll("span")).find((item) =>
    item.textContent.trim().startsWith(label)
  );
  if (!span) return "-";
  return normalizeStorageTime(span.textContent);
};

const readLiveFlightsFromStorage = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.liveFlights);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
};

const writeLiveFlightsToStorage = (flights) => {
  try {
    localStorage.setItem(STORAGE_KEYS.liveFlights, JSON.stringify(flights));
  } catch (error) {
    // Ignore storage errors.
  }
};

const normalizeAssignmentRef = (value) => normalizeStorageLabel(value);

const buildFlightRefAssigneeMap = () => {
  const assigneeMap = new Map();
  Object.entries(assignments).forEach(([fsLabel, refs]) => {
    if (!Array.isArray(refs)) return;
    const normalizedFs = normalizeFsLeaderName(fsLabel);
    if (!normalizedFs || /unassigned/i.test(normalizedFs)) return;
    refs.forEach((ref) => {
      const normalizedRef = normalizeAssignmentRef(ref);
      if (!normalizedRef || assigneeMap.has(normalizedRef)) return;
      assigneeMap.set(normalizedRef, normalizedFs);
    });
  });
  return assigneeMap;
};

const getAssignedFsForFlightRef = (
  flightRef,
  assigneeMap = buildFlightRefAssigneeMap()
) => {
  const normalizedRef = normalizeAssignmentRef(flightRef);
  if (!normalizedRef) return "";
  return assigneeMap.get(normalizedRef) || "";
};

const applyAssignmentsToLiveFlights = () => {
  const flights = readLiveFlightsFromStorage();
  if (!flights.length) return;
  const assigneeMap = buildFlightRefAssigneeMap();
  let changed = false;
  const nextFlights = flights.map((flight) => {
    const flightRef = normalizeAssignmentRef(flight?.id);
    const assignedFs = flightRef ? assigneeMap.get(flightRef) || "" : "";
    if ((flight.assignedFs || "") === assignedFs) return flight;
    changed = true;
    return { ...flight, assignedFs };
  });
  if (changed) {
    writeLiveFlightsToStorage(nextFlights);
  }
};

const createStorageFlightId = ({ gate, flightNo, etd }) => {
  const gateId = normalizeStorageGateLabel(gate).toLowerCase().replace(/\s+/g, "-");
  const flightId = normalizeStorageFlightNumber(flightNo)
    .toLowerCase()
    .replace(/\s+/g, "-");
  const etdId = normalizeStorageTime(etd).toLowerCase().replace(/\s+/g, "-");
  return `${flightId}_${gateId}_${etdId}`.replace(/[^a-z0-9_-]/g, "");
};

const getCardStorageFlightId = (card, fallbackIndex = 0) => {
  if (!card) return "";
  const stored = normalizeStorageLabel(card.dataset.flightId || "");
  if (stored) return stored;
  const gateCode = getFlightCardGateCode(card);
  const gateText =
    gateCode
      ? `Gate ${gateCode}`
      : card.querySelector(".gate-label")?.textContent ||
        card.querySelector(".gate-banner")?.textContent ||
        "Gate --";
  const flightText = card.querySelector(".flight-tag")?.textContent || "-";
  const etd = extractStorageTimeFromCard(card, "ETD");
  const generated =
    createStorageFlightId({
      gate: gateText,
      flightNo: flightText,
      etd,
    }) || `flight-${fallbackIndex + 1}`;
  card.dataset.flightId = generated;
  return generated;
};

const getAssignedFsFromCard = (
  card,
  flightRef,
  assigneeMap = buildFlightRefAssigneeMap()
) => {
  const fromAssignment = getAssignedFsForFlightRef(flightRef, assigneeMap);
  if (fromAssignment) return fromAssignment;
  const badgeText = card?.querySelector(".fs-badge")?.textContent || "";
  const match = badgeText.match(/FS:\s*(.+)$/i);
  const fromBadge = normalizeFsLeaderName(match ? match[1] : "");
  if (fromBadge && !/unassigned/i.test(fromBadge)) {
    return fromBadge;
  }
  return "";
};

const collectLiveFlightsFromPage = () => {
  const page = document.querySelector(".in-progress-page");
  if (!page) return [];
  const historyGrid = document.querySelector("#history-grid");
  const mainCards = Array.from(page.querySelectorAll(".flight-card"));
  const historyCards = historyGrid
    ? Array.from(historyGrid.querySelectorAll(".flight-card"))
    : [];
  const cards = Array.from(new Set([...mainCards, ...historyCards]));
  if (!cards.length) return [];

  const existingMap = new Map(
    readLiveFlightsFromStorage()
      .filter((flight) => flight && typeof flight === "object" && flight.id)
      .map((flight) => [flight.id, flight])
  );
  const assigneeMap = buildFlightRefAssigneeMap();
  const uniqueIds = new Set();

  return cards.map((card, index) => {
    const gateCode = getFlightCardGateCode(card);
    const gateLabel = gateCode
      ? `Gate ${gateCode}`
      : normalizeStorageGateLabel(
          card.querySelector(".gate-label")?.textContent ||
            card.querySelector(".gate-banner")?.textContent ||
            "Gate --"
        );
    const flightNo = normalizeStorageFlightNumber(
      card.querySelector(".flight-tag")?.textContent || "-"
    );
    const etd = extractStorageTimeFromCard(card, "ETD");
    const std = extractStorageTimeFromCard(card, "STD");
    const rt = extractStorageTimeFromCard(card, "RT");
    const rtMinutes =
      normalizeMinutesValue(card.dataset.rtMinutes) ?? deriveRtMinutesFromEtd(etd);
    let id = getCardStorageFlightId(card, index);
    while (uniqueIds.has(id)) {
      id = `${id}-${index + 1}`;
    }
    uniqueIds.add(id);
    card.dataset.flightId = id;

    const stored = existingMap.get(id);
    const isInHistory = Boolean(historyGrid && historyGrid.contains(card));
    const status =
      isInHistory || card.classList.contains("history-card") || stored?.status === "completed"
        ? "completed"
        : "assigned";

    return {
      id,
      gate: gateLabel,
      flightNo,
      route: normalizeStorageLabel(card.querySelector(".flight-top .card-sub")?.textContent || ""),
      etd,
      std,
      rt,
      rtMinutes,
      assignedFs: getAssignedFsFromCard(card, id, assigneeMap),
      status,
      remarks: normalizeStorageLabel(card.dataset.remarks || ""),
    };
  });
};

const syncLiveFlightsFromPage = () => {
  const flights = collectLiveFlightsFromPage();
  if (!flights.length) return;
  const existing = readLiveFlightsFromStorage();
  if (JSON.stringify(existing) === JSON.stringify(flights)) return;
  writeLiveFlightsToStorage(flights);
};

const applyLiveFlightStatusesToPage = () => {
  const page = document.querySelector(".in-progress-page");
  const historyGrid = document.querySelector("#history-grid");
  if (!page || !historyGrid) return;
  const mainGrid = page.querySelector(".card-grid:not(.history-grid)");
  if (!mainGrid) return;

  const statusById = new Map(
    readLiveFlightsFromStorage()
      .filter((flight) => flight && typeof flight === "object" && flight.id)
      .map((flight) => [flight.id, flight.status])
  );
  if (!statusById.size) return;

  const cards = Array.from(
    new Set([
      ...Array.from(page.querySelectorAll(".flight-card")),
      ...Array.from(historyGrid.querySelectorAll(".flight-card")),
    ])
  );

  cards.forEach((card, index) => {
    const id = getCardStorageFlightId(card, index);
    const status = statusById.get(id);
    if (status === "completed") {
      card.classList.add("history-card");
      if (card.parentElement !== historyGrid) {
        historyGrid.appendChild(card);
      }
      return;
    }
    if (card.parentElement === historyGrid && status !== "completed") {
      card.classList.remove("history-card");
      mainGrid.appendChild(card);
    }
  });

  if (historyModal && historyModal.classList.contains("is-visible")) {
    renderHistoryCards();
  }
};

const getActiveLiveFlights = () =>
  readLiveFlightsFromStorage().filter(
    (flight) => flight && flight.status !== "completed"
  );

const getWindowedActiveLiveFlights = () =>
  getActiveLiveFlights().filter((flight) =>
    isWithinForwardRtWindow(getLiveFlightRtMinutes(flight))
  );

const loadFsLeaderFromStorage = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.fsLeader);
    return raw ? normalizeFsLeaderName(raw) : "";
  } catch (error) {
    return "";
  }
};

const saveFsLeaderToStorage = (name) => {
  const normalized = normalizeFsLeaderName(name);
  if (!normalized) return;
  try {
    localStorage.setItem(STORAGE_KEYS.fsLeader, normalized);
  } catch (error) {
    // Ignore storage errors.
  }
};

const applyFsLeaderToPage = (name) => {
  const label = name || "Not Assigned";
  if (fsName) fsName.textContent = label;
};

const loadAssignmentsFromStorage = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.assignments);
    if (!raw) {
      Object.keys(assignments).forEach((key) => delete assignments[key]);
      return;
    }
    const data = JSON.parse(raw);
    if (!data || typeof data !== "object") {
      Object.keys(assignments).forEach((key) => delete assignments[key]);
      return;
    }
    Object.keys(assignments).forEach((key) => delete assignments[key]);
    Object.entries(data).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        const normalizedRefs = Array.from(
          new Set(
            value
              .map((ref) => normalizeAssignmentRef(ref))
              .filter((ref) => ref && !/^gate\s*[ab]\d+$/i.test(ref))
          )
        );
        if (normalizedRefs.length) {
          assignments[key] = normalizedRefs;
        }
      }
    });
  } catch (error) {
    // Ignore storage errors.
  }
};

const saveAssignmentsToStorage = () => {
  try {
    localStorage.setItem(STORAGE_KEYS.assignments, JSON.stringify(assignments));
  } catch (error) {
    // Ignore storage errors.
  }
  applyAssignmentsToLiveFlights();
};

const applyAssignmentsToCards = () => {
  const page = document.querySelector(".in-progress-page");
  if (!page) return;
  const assigneeMap = buildFlightRefAssigneeMap();
  page.querySelectorAll(".flight-card").forEach((card, index) => {
    const fsBadge = card.querySelector(".fs-badge");
    if (!fsBadge) return;
    const flightRef = getCardStorageFlightId(card, index);
    const assignedFs = getAssignedFsForFlightRef(flightRef, assigneeMap);
    if (assignedFs) {
      fsBadge.textContent = `FS: ${assignedFs.replace("FS - ", "")}`;
    } else {
      fsBadge.textContent = "FS: Unassigned";
    }
  });
  syncLiveFlightsFromPage();
  applyAssignmentsToLiveFlights();
};

const refreshAssignmentsFromStorage = () => {
  loadAssignmentsFromStorage();
  applyAssignmentsToCards();
  applyAssignmentsToLiveFlights();
  document.dispatchEvent(new Event("assignments:updated"));
};

const refreshFsLeaderFromStorage = () => {
  const stored = loadFsLeaderFromStorage();
  applyFsLeaderToPage(stored);
};

const isPageReload = () => {
  const navEntry = performance.getEntriesByType
    ? performance.getEntriesByType("navigation")[0]
    : null;
  if (navEntry && navEntry.type) {
    return navEntry.type === "reload";
  }
  if (performance.navigation) {
    return performance.navigation.type === 1;
  }
  return false;
};

const resetPersistentStateOnReload = () => {
  if (!isPageReload()) return false;
  try {
    localStorage.removeItem(STORAGE_KEYS.fsLeader);
    localStorage.removeItem(STORAGE_KEYS.assignments);
  } catch (error) {
    // Ignore storage errors.
  }
  applyFsLeaderToPage("");
  Object.keys(assignments).forEach((key) => delete assignments[key]);
  applyAssignmentsToCards();
  applyAssignmentsToLiveFlights();
  document.dispatchEvent(new Event("assignments:updated"));
  return true;
};

const initializePersistentState = () => {
  const didReset = resetPersistentStateOnReload();
  if (!didReset) {
    loadAssignmentsFromStorage();
    applyFsLeaderToPage(loadFsLeaderFromStorage());
    applyAssignmentsToCards();
    applyAssignmentsToLiveFlights();
    document.dispatchEvent(new Event("assignments:updated"));
  }
};

initializePersistentState();

window.addEventListener("storage", (event) => {
  if (event.key === STORAGE_KEYS.assignments) {
    refreshAssignmentsFromStorage();
  }
  if (event.key === STORAGE_KEYS.fsLeader) {
    refreshFsLeaderFromStorage();
  }
  if (event.key === STORAGE_KEYS.liveFlights) {
    applyLiveFlightStatusesToPage();
    applyRtWindowFilter();
    if (assignList) {
      populateAssignGates();
    }
  }
});

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
    const statusEl = card.querySelector(".status");
    const setStatus = (value) => {
      if (!statusEl) return;
      statusEl.textContent = value;
      statusEl.classList.remove("on-time", "delayed");
      statusEl.classList.add("rt-status");
    };
    const times = card.querySelector(".flight-times");
    if (!times) {
      setStatus("RT --");
      return;
    }
    times.querySelectorAll(".got-time, .rt-time").forEach((el) => el.remove());
    const etdSpan = Array.from(times.querySelectorAll("span")).find((span) =>
      span.textContent.trim().startsWith("ETD")
    );
    if (!etdSpan) {
      setStatus("RT --");
      return;
    }
    const match = etdSpan.textContent.match(/(\d{4})hrs/);
    if (!match) {
      setStatus("RT --");
      return;
    }
    const etd = `${match[1]}hrs`;
    const got = subtractMinutes(etd, 70);
    const rt = got && got !== "-" ? subtractMinutes(got, 20) : "-";
    if (!got || got === "-" || !rt || rt === "-") {
      setStatus("RT --");
      return;
    }
    const gotEl = document.createElement("span");
    gotEl.className = "got-time";
    gotEl.textContent = `GOT: ${got}`;
    const rtEl = document.createElement("span");
    rtEl.className = "rt-time";
    rtEl.textContent = `RT: ${rt}`;
    times.appendChild(gotEl);
    times.appendChild(rtEl);
    setStatus(`RT ${rt}`);
    const rtMatch = rt.match(/(\d{4})hrs/);
    if (rtMatch) {
      card.dataset.rtMinutes = String(toMinutes(`${rtMatch[1]}hrs`));
    }
    reorderInProgressTimes(times);
  });
  applyRtWindowFilter();
};

document.addEventListener("DOMContentLoaded", () => {
  updateGotTimes();
  updateRtGotForInProgress();
  syncLiveFlightsFromPage();
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
  const isActive = Boolean(isPatdown);
  modalGate.classList.toggle("is-patdown", isActive);
  const gateBox = modalGate.closest("div");
  if (gateBox) gateBox.classList.toggle("is-patdown", isActive);
};

const setModalPreviousFlight = (flight) => {
  if (!modalPreviousBlock) return;
  if (!flight) {
    modalPreviousBlock.classList.add("is-hidden");
    return;
  }
  const etdValue = flight.etd || flight.estimatedDepartureTime || "-";
  if (modalPrevGate) modalPrevGate.textContent = flight.gate || "-";
  if (modalPrevFlight) modalPrevFlight.textContent = flight.flightNo || "-";
  if (modalPrevEtd) modalPrevEtd.textContent = etdValue;
  modalPreviousBlock.classList.remove("is-hidden");
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
  if (modalAction && data.actionLabel) {
    modalAction.textContent = data.actionLabel;
  }
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
  setModalPreviousFlight(data.previousFlight || null);
  modalBackdrop.classList.add("is-visible");
  modal.classList.add("is-visible");
};
const openAssignedTeamsModal = (card) => {
  if (!modal || !modalBackdrop || !card) return;
  setModalLayoutForAssigned();
  if (modalAction) modalAction.classList.add("is-hidden");
  if (modalTitle) modalTitle.textContent = "Assigned Teams";

  const gateCode = getFlightCardGateCode(card);
  const gateEl = card.querySelector(".gate-label");
  const gateText = gateCode
    ? `Gate ${gateCode}`
    : gateEl
      ? gateEl.textContent.trim()
      : "Gate";
  if (modalGate) modalGate.textContent = gateText || "Gate";
  setModalGatePatdown(false);

  const flightEl = card.querySelector(".flight-tag");
  const flightText = extractFlightNumber(flightEl ? flightEl.textContent : "");
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
    const withMainTag = assignedTeams.map((team) => ({
      ...team,
      label: team.team,
    }));
    const eligible = withMainTag
      .map((team, index) => ({ ...team, index }))
      .filter((team) => /\(3\)/.test(team.team));
    if (eligible.length) {
      const picked = eligible[Math.floor(Math.random() * eligible.length)];
      withMainTag[picked.index].label = `${picked.team} - Main Team`;
    }
    const dockMarkup = buildDockMeterMarkup(getDockCountForCard(card));
    modalTeamList.innerHTML = withMainTag.length
      ? withMainTag
          .map(
            (team) =>
              `<li><span>${team.label}</span>${dockMarkup}</li>`
          )
          .join("")
      : "<li><span>No assigned teams</span><span>-</span></li>";
  }

  if (modalTeamBlock) {
    modalTeamBlock.classList.remove("is-hidden");
  }

  setModalPreviousFlight(null);
  modalBackdrop.classList.add("is-visible");
  modal.classList.add("is-visible");
};

const normalizeGateLabel = (label) => label.replace(/\s+/g, " ").trim();

const getGateLabelForCard = (card) => {
  if (!card) return "Gate";
  const newGate = card.querySelector(".new-gate")?.textContent.trim();
  if (newGate) return `Gate ${newGate}`;
  const gateCode = getFlightCardGateCode(card);
  if (gateCode) return `Gate ${gateCode}`;
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

const SCREENING_LOGICS = [
  { id: "1", cont: true, enh: "55%", palm: "" },
  { id: "2", cont: true, enh: "27%", palm: "" },
  { id: "3", cont: false, enh: "27%", palm: "" },
  { id: "4", cont: false, enh: "17%", palm: "" },
  { id: "5", cont: false, enh: "12%", palm: "10%" },
];

const getScreeningLogicForCard = (card) => {
  if (!card) return null;
  const stored = String(card.dataset.screeningLogic || "").trim();
  if (stored) {
    const normalized = stored.replace(/^logic-?/i, "").trim();
    const match = SCREENING_LOGICS.find((logic) => logic.id === normalized);
    if (match) return match;
  }
  const picked = SCREENING_LOGICS[Math.floor(Math.random() * SCREENING_LOGICS.length)];
  card.dataset.screeningLogic = picked.id;
  return picked;
};

const updateScreeningTypes = () => {
  const cards = Array.from(
    document.querySelectorAll(".in-progress-page .flight-card")
  );
  if (!cards.length) return;

  const candidates = getFsAlertCandidateCards();
  const selectedCard = pickPreferredAlertCard(
    candidates,
    (card) =>
      card.dataset.screeningShow === "true" || card.classList.contains("has-screening")
  );

  cards.forEach((card) => {
    const shouldShow = card === selectedCard;
    card.dataset.screeningShow = shouldShow ? "true" : "false";
    card.classList.toggle("has-screening", shouldShow);
    const badges = ensureGateBadgesContainer(card);
    if (badges) {
      badges.querySelectorAll(".badge-enhanced").forEach((badge) => badge.remove());
      if (shouldShow) {
        const badge = document.createElement("span");
        badge.className = "badge badge-enhanced";
        badge.textContent = "Enhanced";
        badges.appendChild(badge);
      }
    }
  });

  cards.forEach((card) => {
    const details = card.querySelector(".flight-details");
    if (!details) return;
    let container = details.querySelector(".flight-screening");
    if (!container) {
      container = document.createElement("div");
      container.className = "flight-screening";
      details.appendChild(container);
    }

    if (card.dataset.screeningShow !== "true") {
      container.classList.add("is-hidden");
      container.innerHTML = "";
      return;
    }

    const logic = getScreeningLogicForCard(card);
    const lines = [];
    if (logic?.cont) {
      lines.push({ text: "CONT. SWAB", className: "screening-left" });
    }
    if (logic?.enh) {
      lines.push({
        text: `ENHN. SCRN: ${logic.enh}`,
        className: "screening-middle",
      });
    }
    if (logic?.palm) {
      lines.push({
        text: `PALM SWAB: ${logic.palm}`,
        className: "screening-right",
      });
    }

    if (!lines.length) {
      container.classList.add("is-hidden");
      container.innerHTML = "";
      return;
    }

    container.classList.remove("is-hidden");
    container.innerHTML = lines
      .map((line) => `<span class="${line.className}">${line.text}</span>`)
      .join("");
  });

  updateEnhancedCount();
};

const REMARK_OPTIONS = ["ASQ", "GOEM", "CIP", "VIP", "DM3999"];

const getRandomRemark = () =>
  REMARK_OPTIONS[Math.floor(Math.random() * REMARK_OPTIONS.length)];

const normalizeRemarkValue = (value) => {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";
  const withoutLabel = trimmed.replace(/^remarks\s*:\s*/i, "").trim();
  const normalized = withoutLabel.toLowerCase();
  if (normalized === "-" || normalized === "n/a" || normalized === "na" || normalized === "none") {
    return "";
  }
  return withoutLabel;
};

const randomizeRemarksForCards = () => {
  const cards = Array.from(document.querySelectorAll(".flight-card"));
  const eligible = cards.filter((card) => !card.hasAttribute("data-remarks"));
  if (!eligible.length) return;
  const count = Math.max(1, Math.floor(eligible.length / 3));
  const picks = eligible.sort(() => 0.5 - Math.random()).slice(0, count);
  eligible.forEach((card) => {
    card.dataset.remarks = picks.includes(card) ? getRandomRemark() : "";
  });
};

const getRemarkForCard = (card) => {
  if (!card) return "";
  if (card.hasAttribute("data-remarks")) {
    return normalizeRemarkValue(card.dataset.remarks);
  }
  const existing = card.querySelector(".flight-remarks");
  if (existing) {
    return normalizeRemarkValue(existing.textContent);
  }
  if (!card.dataset.remarks) {
    card.dataset.remarks = getRandomRemark();
  }
  return normalizeRemarkValue(card.dataset.remarks);
};

const applyRemarksToCards = () => {
  document.querySelectorAll(".flight-card").forEach((card) => {
    const details = card.querySelector(".flight-details");
    const meta = card.querySelector(".flight-meta");
    if (!details || !meta) return;

    const remark = getRemarkForCard(card);
    const existing = details.querySelector(".flight-remarks");
    if (!remark) {
      if (existing) existing.remove();
      return;
    }

    const remarksEl = existing || document.createElement("div");
    remarksEl.className = "flight-remarks";
    remarksEl.textContent = `Remarks: ${remark}`;
    meta.insertAdjacentElement("afterend", remarksEl);
  });
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

const getTimeLabelFromCard = (card, label) => {
  const times = card?.querySelector(".flight-times");
  if (!times) return "-";
  const span = Array.from(times.querySelectorAll("span")).find((item) =>
    item.textContent.trim().startsWith(label)
  );
  if (!span) return "-";
  return span.textContent.replace(`${label}:`, "").trim();
};

const renderHistoryCards = () => {
  if (!historyModalGrid) return;
  const historyGrid = document.querySelector("#history-grid");
  if (!historyGrid) return;
  const cards = Array.from(historyGrid.querySelectorAll(".flight-card"));
  if (!cards.length) {
    historyModalGrid.innerHTML = "<div class=\"history-empty\">No history yet</div>";
    return;
  }
  historyModalGrid.innerHTML = "";
  cards.forEach((card) => {
    const clone = card.cloneNode(true);
    clone.classList.remove("is-pressable");
    clone.removeAttribute("tabindex");
    clone.removeAttribute("role");
    clone.removeAttribute("aria-label");
    historyModalGrid.appendChild(clone);
  });
};

const openHistoryModal = () => {
  if (!historyModal || !historyBackdrop) return;
  renderHistoryCards();
  historyBackdrop.classList.add("is-visible");
  historyModal.classList.add("is-visible");
};

const closeHistoryModal = () => {
  if (!historyModal || !historyBackdrop) return;
  historyBackdrop.classList.remove("is-visible");
  historyModal.classList.remove("is-visible");
};

const getCurrentClockMinutes = () => {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
};

const getCardRtMinutes = (card) => {
  const stored = Number(card?.dataset.rtMinutes);
  if (Number.isFinite(stored) && stored >= 0) return stored;

  const rtText =
    card?.querySelector(".rt-time")?.textContent ||
    card?.querySelector(".status")?.textContent ||
    "";
  const match = rtText.match(/(\d{4})hrs/);
  if (!match) return null;
  return toMinutes(`${match[1]}hrs`);
};

const applyRtWindowFilter = () => {
  if (!document.querySelector(".in-progress-page")) return;
  const nowMinutes = getCurrentClockMinutes();
  const cards = getInProgressCards();
  cards.forEach((card) => {
    const rtMinutes = getCardRtMinutes(card);
    if (!Number.isFinite(rtMinutes)) {
      card.classList.add("is-hidden");
      return;
    }
    const minutesUntilRt = (rtMinutes - nowMinutes + 1440) % 1440;
    const isWithinWindow = minutesUntilRt <= RT_FORWARD_WINDOW_MINUTES;
    card.classList.toggle("is-hidden", !isWithinWindow);
  });
  applySinglePullAlert();
  applySingleGateChangeAlert();
  updateScreeningTypes();
  applySinglePatdownAlert();
  updateGateCount();
  updatePullCount();
  updateGateChangeCount();
  updateEnhancedCount();
  updatePatdownCount();
};

const movePastEtdToHistory = () => {
  const page = document.querySelector(".in-progress-page");
  const historyGrid = document.querySelector("#history-grid");
  if (!page || !historyGrid) return;
  applyLiveFlightStatusesToPage();
  applyRtWindowFilter();
  syncLiveFlightsFromPage();
  if (historyModal && historyModal.classList.contains("is-visible")) {
    renderHistoryCards();
  }
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
  const flightText = card ? getFlightNumberFromCard(card) : "-";
  const etdText = card ? getTimeLabelFromCard(card, "ETD") : "-";
  const stdText = card ? getTimeLabelFromCard(card, "STD") : "-";
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
  const actionLabel = pull ? "Pull Team Completed" : "Gate Closed";
  const previousFlight = pull
    ? { gate: gateText, flightNo, etd: etdText }
    : null;

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
    actionLabel,
    teamMembers,
    previousFlight,
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

const defaultGates = ALLOWED_GATE_CODES.slice();

const getGateTimes = () => {
  const gateTimes = {};
  getWindowedActiveLiveFlights().forEach((flight) => {
    const gateCode = normalizeAllowedGateCode(flight.gate);
    if (!gateCode) return;
    const gate = `Gate ${gateCode}`;
    const etd = normalizeStorageTime(flight.etd);
    if (gate !== "Gate --" && etd !== "-") {
      gateTimes[gate] = etd;
    }
  });
  if (Object.keys(gateTimes).length > 0) {
    return gateTimes;
  }
  if (getActiveLiveFlights().length > 0) {
    return gateTimes;
  }
  document.querySelectorAll(".flight-card").forEach((card) => {
    const gateCode = getFlightCardGateCode(card);
    const etdEl = card.querySelector(".flight-times span:first-child");
    if (!gateCode || !etdEl) return;
    const gate = `Gate ${gateCode}`;
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
  const activeFlights = getActiveLiveFlights();
  const liveFlights = getWindowedActiveLiveFlights()
    .map((flight, index) => {
      const gateCode =
        normalizeAllowedGateCode(flight.gate) ||
        ALLOWED_GATE_CODES[index % ALLOWED_GATE_CODES.length];
      const flightRef =
        normalizeAssignmentRef(flight.id) ||
        createStorageFlightId({
          gate: `Gate ${gateCode}`,
          flightNo: flight.flightNo || "-",
          etd: flight.etd || "-",
        });
      return {
        ref: flightRef,
        gate: `Gate ${gateCode}`,
        flightNo: normalizeStorageFlightNumber(flight.flightNo || "-"),
        etd: normalizeStorageTime(flight.etd),
      };
    })
    .filter((flight) => flight.ref && flight.gate !== "Gate --");

  if (liveFlights.length) {
    assignList.innerHTML = liveFlights
      .map(
        (flight) => `<button class="assign-gate" type="button" data-gate="${flight.gate}" data-flight-ref="${flight.ref}">
        <span class="assign-gate-label">${flight.gate}</span>
        <span class="assign-gate-time">Flight ${flight.flightNo}</span>
        <span class="assign-gate-time">ETD ${flight.etd}</span>
      </button>`
      )
      .join("");
    return;
  }

  if (activeFlights.length > 0) {
    assignList.innerHTML =
      "<div class=\"assign-row\"><span>No flights within RT current time + 90 mins</span><span>-</span></div>";
    return;
  }

  const gateTimes = getGateTimes();
  assignList.innerHTML = defaultGates
    .map((gate) => {
      const gateLabel = `Gate ${gate}`;
      const time = gateTimes[gateLabel] || "--:--";
      return `<button class="assign-gate" type="button" data-gate="${gateLabel}">
        <span class="assign-gate-label">${gateLabel}</span>
        <span class="assign-gate-time">Flight -</span>
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
    const selectedRefs = Array.from(
      new Set(
        selectedButtons
          .map((btn) => normalizeAssignmentRef(btn.dataset.flightRef))
          .filter(Boolean)
      )
    );
    if (!selected || selectedRefs.length === 0) return;

    const selectedRefSet = new Set(selectedRefs);
    Object.keys(assignments).forEach((fsKey) => {
      const refs = Array.isArray(assignments[fsKey]) ? assignments[fsKey] : [];
      const remaining = refs
        .map((ref) => normalizeAssignmentRef(ref))
        .filter((ref) => ref && !selectedRefSet.has(ref));
      if (remaining.length) {
        assignments[fsKey] = Array.from(new Set(remaining));
      } else {
        delete assignments[fsKey];
      }
    });

    const existing = Array.isArray(assignments[selected]) ? assignments[selected] : [];
    const mergedRefs = Array.from(
      new Set([...existing.map((ref) => normalizeAssignmentRef(ref)).filter(Boolean), ...selectedRefs])
    );
    if (fsName) {
      fsName.textContent = `${selected} (${mergedRefs.length} flights)`;
    }
    assignments[selected] = mergedRefs;
    applyAssignmentsToCards();
    selectedButtons.forEach((btn) => btn.classList.remove("is-selected"));
    saveAssignmentsToStorage();
    document.dispatchEvent(new Event("assignments:updated"));
    populateAssignGates();
  });
}

if (assignSummary) {
  const renderTimeline = () => {
    const liveFlightMap = new Map(
      readLiveFlightsFromStorage()
        .filter((flight) => flight && typeof flight === "object")
        .map((flight) => [normalizeAssignmentRef(flight.id), flight])
    );

    const rows = Object.entries(assignments).map(([fs, refs]) => {
      const times = (Array.isArray(refs) ? refs : [])
        .map((ref) => liveFlightMap.get(normalizeAssignmentRef(ref)))
        .filter(Boolean)
        .map((flight) => ({
          gate: normalizeStorageGateLabel(flight.gate),
          time: normalizeStorageTime(flight.etd),
          flightNo: normalizeStorageFlightNumber(flight.flightNo || "-"),
        }))
        .filter((item) => item.time !== "----" && item.time !== "-");
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
              <div class="timeline-label-small">${item.flightNo} ${item.gate} ${item.time}</div>
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
