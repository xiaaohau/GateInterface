const STORAGE_KEY_LIVE_FLIGHTS = "gateinterface.liveFlights";

const addRequiredMarker = (card, className, text) => {
  if (!card || card.querySelector(`.${className}`)) return;
  const route = card.querySelector(".runner-route");
  if (!route) return;

  const marker = document.createElement("div");
  marker.className = `runner-required ${className}`;
  marker.textContent = text;
  route.insertAdjacentElement("afterend", marker);
};

const normalizeStorageLabel = (value) =>
  String(value || "")
    .replace(/\s+/g, " ")
    .trim();

const normalizeGateLabel = (value) => {
  const gate = normalizeStorageLabel(value).replace(/^gate\s*/i, "");
  return gate ? `Gate ${gate}` : "Gate --";
};

const normalizeGateCode = (value) =>
  normalizeGateLabel(value).replace(/^Gate\s*/i, "") || "--";

const normalizeFlightNumber = (value) => {
  const raw = normalizeStorageLabel(value).toUpperCase();
  if (!raw) return "-";
  const match = raw.match(/[A-Z]{1,3}\s*\d+/);
  return match ? match[0].replace(/\s+/g, " ") : raw;
};

const normalizeTimeLabel = (value) => {
  const match = String(value || "").match(/(\d{4})hrs/i);
  return match ? `${match[1]}hrs` : "-";
};

const parseHrsToMinutes = (value) => {
  const match = normalizeTimeLabel(value).match(/(\d{2})(\d{2})hrs/);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
};

const formatHrsAsClock = (value) => {
  const match = normalizeTimeLabel(value).match(/(\d{2})(\d{2})hrs/);
  if (!match) return "--:--";
  return `${match[1]}:${match[2]}`;
};

const formatClockAsHrs = (value) => {
  const match = String(value || "").match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return "--";
  const hours = Number(match[1]).toString().padStart(2, "0");
  const minutes = match[2];
  return `${hours}${minutes}hrs`;
};

const parseClockToMinutes = (value) => {
  const match = String(value || "").match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  return hours * 60 + minutes;
};

const formatMinutesAsHrs = (totalMinutes) => {
  if (totalMinutes === null) return "--";
  const safeMinutes = ((totalMinutes % 1440) + 1440) % 1440;
  const hours = Math.floor(safeMinutes / 60)
    .toString()
    .padStart(2, "0");
  const minutes = (safeMinutes % 60).toString().padStart(2, "0");
  return `${hours}${minutes}hrs`;
};

const offsetClockByMinutes = (clock, deltaMinutes) => {
  const minutes = parseClockToMinutes(clock);
  if (minutes === null) return null;
  return minutes + deltaMinutes;
};

const readLiveFlightsFromStorage = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LIVE_FLIGHTS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
};

const writeLiveFlightsToStorage = (flights) => {
  try {
    localStorage.setItem(STORAGE_KEY_LIVE_FLIGHTS, JSON.stringify(flights));
  } catch (error) {
    // Ignore storage errors.
  }
};

const updateLiveFlight = (flightId, updater) => {
  if (!flightId || typeof updater !== "function") return null;
  const flights = readLiveFlightsFromStorage();
  const index = flights.findIndex((flight) => flight && flight.id === flightId);
  if (index === -1) return null;
  const current = flights[index];
  const next = updater(current);
  if (!next || typeof next !== "object") return null;
  flights[index] = next;
  writeLiveFlightsToStorage(flights);
  return next;
};

const desktopDevices = Array.from(
  document.querySelectorAll(".runner-device-grid .runner-device")
);
const mobileDevice = document.querySelector(".runner-mobile-device");
const allDevices = mobileDevice ? [...desktopDevices, mobileDevice] : [...desktopDevices];
const runnerDeviceControllers = new WeakMap();

const ensureDeviceEmptyState = (list) => {
  if (!list) return null;
  let emptyState = list.querySelector(".runner-empty-state");
  if (!emptyState) {
    emptyState = document.createElement("div");
    emptyState.className = "runner-empty-state is-hidden";
    emptyState.setAttribute("aria-live", "polite");
    list.appendChild(emptyState);
  }
  return emptyState;
};

const setupRunnerDevice = (device) => {
  if (!device || device.dataset.runnerReady === "true") return;
  device.dataset.runnerReady = "true";

  const tabs = Array.from(device.querySelectorAll(".runner-tab"));
  const list = device.querySelector(".runner-list");
  const emptyState = ensureDeviceEmptyState(list);

  const setRunnerTab = (tab) => {
    tabs.forEach((item) => {
      const isActive = item === tab;
      item.classList.toggle("is-active", isActive);
      item.setAttribute("aria-selected", isActive ? "true" : "false");
    });

    const status = tab?.dataset.status || "assigned";
    let visibleCards = 0;
    const cards = list ? Array.from(list.querySelectorAll(".runner-card")) : [];

    cards.forEach((card) => {
      const matches = card.dataset.status === status;
      card.classList.toggle("is-hidden", !matches);
      if (matches) visibleCards += 1;
    });

    if (emptyState) {
      emptyState.textContent =
        status === "completed" ? "No completed flights yet" : "No flights available";
      emptyState.classList.toggle("is-hidden", visibleCards > 0);
    }
  };

  const refreshCurrentTab = () => {
    const activeTab = device.querySelector(".runner-tab.is-active") || tabs[0];
    if (activeTab) setRunnerTab(activeTab);
  };

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => setRunnerTab(tab));
  });

  runnerDeviceControllers.set(device, { refreshCurrentTab });
  refreshCurrentTab();
};

allDevices.forEach(setupRunnerDevice);

const getRunnerFlights = () =>
  readLiveFlightsFromStorage()
    .filter((flight) => flight && typeof flight === "object")
    .map((flight, index) => {
      const id = normalizeStorageLabel(flight.id || `flight-${index + 1}`);
      const gate = normalizeGateLabel(flight.gate);
      const flightNo = normalizeFlightNumber(flight.flightNo);
      const etd = normalizeTimeLabel(flight.etd);
      const std = normalizeTimeLabel(flight.std);
      const route = normalizeStorageLabel(flight.route || "");
      const assignedFs = normalizeStorageLabel(flight.assignedFs || "");
      const remarks = normalizeStorageLabel(flight.remarks || "");
      const status = flight.status === "completed" ? "completed" : "assigned";
      return {
        id,
        gate,
        flightNo,
        etd,
        std,
        route,
        assignedFs,
        remarks,
        status,
      };
    })
    .filter((flight) => flight.assignedFs)
    .sort((a, b) => {
      const aMinutes = parseHrsToMinutes(a.etd);
      const bMinutes = parseHrsToMinutes(b.etd);
      const aSort = aMinutes === null ? Number.MAX_SAFE_INTEGER : aMinutes;
      const bSort = bMinutes === null ? Number.MAX_SAFE_INTEGER : bMinutes;
      return aSort - bSort;
    });

const splitFlightsAcrossDevices = (flights, deviceCount) => {
  if (deviceCount <= 0) return [];
  const groups = Array.from({ length: deviceCount }, () => []);
  flights.forEach((flight, index) => {
    groups[index % deviceCount].push(flight);
  });
  return groups;
};

const getRequiredActionTargets = (flights) => {
  const assignedFlights = flights.filter((flight) => flight.status === "assigned");
  if (!assignedFlights.length) {
    return { pullId: "", closeId: "" };
  }
  const pullId = assignedFlights[0].id;
  const closeId =
    assignedFlights.length > 1 ? assignedFlights[1].id : assignedFlights[0].id;
  return { pullId, closeId };
};

const modal = document.querySelector("#runner-modal");
const modalBackdrop = document.querySelector("#runner-modal-backdrop");
const modalClose = document.querySelector("#runner-modal-close");
const modalGate = document.querySelector("#runner-modal-gate");
const modalReporting = document.querySelector("#runner-modal-reporting");
const modalFlight = document.querySelector("#runner-modal-flight");
const modalOpening = document.querySelector("#runner-modal-opening");
const modalRemarks = document.querySelector("#runner-modal-remarks");
const modalTeamList = document.querySelector("#runner-modal-team-list");
const modalSaveButton = document.querySelector("#runner-modal-save");
const modalCompleteButton = document.querySelector("#runner-modal-complete");
const modalTeamActions = document.querySelector(".runner-modal-team-actions");
const modalPullTeamAction = document.querySelector(".runner-team-action-pull");
const modalCloseGateAction = document.querySelector(".runner-team-action-close");

const actionModal = document.querySelector("#runner-action-modal");
const actionBackdrop = document.querySelector("#runner-action-modal-backdrop");
const actionClose = document.querySelector("#runner-action-modal-close");
const actionTitle = document.querySelector("#runner-action-modal-title");
const actionGate = document.querySelector("#runner-action-gate");
const actionReporting = document.querySelector("#runner-action-reporting");
const actionFlight = document.querySelector("#runner-action-flight");
const actionOpening = document.querySelector("#runner-action-opening");
const actionTeamBlock = document.querySelector("#runner-action-team");
const actionTeamTitle = document.querySelector("#runner-action-team-title");
const actionTeamList = document.querySelector("#runner-action-team-list");
const actionPreviousBlock = document.querySelector("#runner-action-previous");
const actionPrevGate = document.querySelector("#runner-action-prev-gate");
const actionPrevFlight = document.querySelector("#runner-action-prev-flight");
const actionPrevEtd = document.querySelector("#runner-action-prev-etd");
const actionCloseBlock = document.querySelector("#runner-action-close-team");
const actionCloseList = document.querySelector("#runner-action-close-list");
const actionActionButton = document.querySelector("#runner-action-action");

let activeCard = null;
let activeActionMode = null;

const runnerTeamPool = [
  { id: "OS-1142", name: "A. Rahman", phone: "+65 9123 4567" },
  { id: "OS-2098", name: "S. Lim", phone: "+65 9345 6789" },
  { id: "OS-3315", name: "K. Wong", phone: "+65 9234 7788" },
  { id: "OS-4481", name: "J. Tan", phone: "+65 9788 1122" },
  { id: "OS-5576", name: "M. Chan", phone: "+65 9555 3344" },
  { id: "OS-6689", name: "R. Ong", phone: "+65 9666 5566" },
];

const runnerClosePool = [
  { id: "CG-1180", name: "R. Goh" },
  { id: "CG-2231", name: "T. Noor" },
  { id: "CG-3094", name: "H. Yeo" },
  { id: "CG-4172", name: "J. Lee" },
];

const pickRandomEntries = (pool, count) =>
  [...pool].sort(() => Math.random() - 0.5).slice(0, count);

const getCardDetails = (card) => {
  const time = card?.dataset.time || "--:--";
  const gate = card?.dataset.gate || "Gate --";
  const flight = card?.dataset.flight || "--";
  const etd = card?.dataset.etd || "-";
  return { time, gate, flight, etd };
};

const getCardRemarks = (card) => (card ? String(card.dataset.remarks || "") : "");

const isCardCompleted = (card) => card?.dataset.status === "completed";

const getCardActionState = (card) => ({
  hasPull: !!card?.querySelector(".runner-pull-required, .runner-pull-completed"),
  hasClose: !!card?.querySelector(
    ".runner-close-gate-required, .runner-close-gate-completed"
  ),
  pullCompleted: !!card?.querySelector(".runner-pull-completed"),
  closeCompleted: !!card?.querySelector(".runner-close-gate-completed"),
});

const setCardActionCompleted = (card, actionType) => {
  if (!card) return;

  const config =
    actionType === "pull"
      ? {
          requiredClass: "runner-pull-required",
          completedClass: "runner-pull-completed",
          completedText: "Pull Team Completed",
        }
      : {
          requiredClass: "runner-close-gate-required",
          completedClass: "runner-close-gate-completed",
          completedText: "Gate Closed",
        };

  let marker = card.querySelector(
    `.${config.requiredClass}, .${config.completedClass}`
  );
  if (!marker) {
    const route = card.querySelector(".runner-route");
    if (!route) return;
    marker = document.createElement("div");
    route.insertAdjacentElement("afterend", marker);
  }

  marker.className = `runner-required ${config.completedClass} is-static`;
  marker.textContent = config.completedText;
};

const hashText = (value) => {
  const text = String(value || "");
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) % 2147483647;
  }
  return Math.abs(hash);
};

const getAssignedTeamsForCard = (card) => {
  const source = card?.dataset.flightId || card?.dataset.flight || "";
  const seed = hashText(source);
  const teams = [];
  const used = new Set();
  let cursor = seed || 1;
  while (teams.length < 4) {
    const teamId = (cursor % 24) + 1;
    cursor = (cursor * 13 + 17) % 2147483647;
    if (used.has(teamId)) continue;
    used.add(teamId);
    teams.push({
      label: `Team ${teamId} (${teamId % 3 === 0 ? 2 : 3})`,
      signal: (teamId % 4) + 1,
    });
  }
  const mainTeamIndex = seed % teams.length;
  teams[mainTeamIndex].label = `${teams[mainTeamIndex].label} - Main Team`;
  return teams;
};

const renderAssignedTeams = (card) => {
  if (!modalTeamList) return;
  const teams = getAssignedTeamsForCard(card);
  modalTeamList.innerHTML = teams
    .map((team) => {
      const signal = Array.from({ length: 4 }, (_, index) => {
        const activeClass = index < team.signal ? " class=\"is-on\"" : "";
        return `<span${activeClass}></span>`;
      }).join("");
      return `<li class=\"runner-team-row\"><span class=\"runner-team-name\">${team.label}</span><div class=\"runner-team-signal\">${signal}</div></li>`;
    })
    .join("");
};

const setModalFields = (details) => {
  if (modalGate) {
    modalGate.textContent = details.gate;
  }
  if (modalReporting) {
    modalReporting.textContent = formatClockAsHrs(details.time);
  }
  if (modalFlight) {
    modalFlight.textContent = details.flight || "--";
  }
  if (modalOpening) {
    modalOpening.textContent = formatMinutesAsHrs(
      offsetClockByMinutes(details.time, 20)
    );
  }
};

const setModalRemarks = (card) => {
  if (!modalRemarks) return;
  modalRemarks.value = getCardRemarks(card);
};

const setModalCompleteState = (card) => {
  if (!modalCompleteButton) return;
  const completed = isCardCompleted(card);
  modalCompleteButton.classList.toggle("is-completed", completed);
  modalCompleteButton.disabled = completed;
  modalCompleteButton.textContent = completed ? "Completed" : "Complete";
};

const setModalActionVisibility = (card) => {
  const state = getCardActionState(card);
  const completed = isCardCompleted(card);

  if (modalPullTeamAction) {
    modalPullTeamAction.classList.toggle("is-hidden", completed || !state.hasPull);
    modalPullTeamAction.classList.toggle("is-completed", state.pullCompleted);
  }
  if (modalCloseGateAction) {
    modalCloseGateAction.classList.toggle("is-hidden", completed || !state.hasClose);
    modalCloseGateAction.classList.toggle("is-completed", state.closeCompleted);
  }
  if (modalTeamActions) {
    modalTeamActions.classList.toggle(
      "is-hidden",
      completed || (!state.hasPull && !state.hasClose)
    );
  }
};

const setModalSaveState = (saved) => {
  if (!modalSaveButton) return;
  modalSaveButton.classList.toggle("is-saved", saved);
  modalSaveButton.textContent = saved ? "Remarks Saved" : "Save Remarks";
};

const saveModalRemarksToCard = () => {
  if (!activeCard || !modalRemarks) return;
  const text = modalRemarks.value.trim();
  const flightId = activeCard.dataset.flightId;
  activeCard.dataset.remarks = text;
  updateLiveFlight(flightId, (flight) => ({ ...flight, remarks: text }));
};

const setActionSummary = (details) => {
  if (actionGate) actionGate.textContent = normalizeGateLabel(details.gate);
  if (actionReporting) {
    actionReporting.textContent = formatClockAsHrs(details.time);
  }
  if (actionFlight) actionFlight.textContent = details.flight || "--";
  if (actionOpening) {
    actionOpening.textContent = formatMinutesAsHrs(
      offsetClockByMinutes(details.time, 20)
    );
  }
};

const renderActionTeamMembers = (members) => {
  if (!actionTeamList) return;
  actionTeamList.innerHTML = members.length
    ? members
        .map(
          (member) =>
            `<li><span>${member.id} ${member.name}<br /><small>${member.phone}</small></span><span>&check;</span></li>`
        )
        .join("")
    : "<li><span>No officers assigned</span><span>-</span></li>";
};

const renderActionCloseOfficers = (members) => {
  if (!actionCloseList) return;
  actionCloseList.innerHTML = members.length
    ? members
        .map(
          (member) => `<li><span>${member.id} ${member.name}</span><span>&check;</span></li>`
        )
        .join("")
    : "<li><span>No close gate officers</span><span>-</span></li>";
};

const openActionModal = (mode) => {
  if (!actionModal || !actionBackdrop || !activeCard) return;
  activeActionMode = mode;
  const details = getCardDetails(activeCard);
  const state = getCardActionState(activeCard);
  const isCompleted = mode === "pull" ? state.pullCompleted : state.closeCompleted;
  setActionSummary(details);

  const isPull = mode === "pull";

  if (actionTitle) {
    actionTitle.textContent = isPull ? "Pull Team Officers" : "Close Gate Officers";
  }
  if (actionActionButton) {
    actionActionButton.classList.toggle("is-completed", isCompleted);
    actionActionButton.textContent = isPull
      ? isCompleted
        ? "Pull Team Completed"
        : "Pull Team Complete"
      : "Gate Closed";
  }

  if (actionTeamBlock) actionTeamBlock.classList.toggle("is-hidden", !isPull);
  if (actionPreviousBlock) actionPreviousBlock.classList.toggle("is-hidden", !isPull);
  if (actionCloseBlock) actionCloseBlock.classList.toggle("is-hidden", isPull);

  if (isPull) {
    const teamMembers = pickRandomEntries(runnerTeamPool, 3);
    renderActionTeamMembers(teamMembers);
    if (actionTeamTitle) actionTeamTitle.textContent = "Team Members";
    if (actionPrevGate) actionPrevGate.textContent = normalizeGateLabel(details.gate);
    if (actionPrevFlight) actionPrevFlight.textContent = details.flight || "-";
    if (actionPrevEtd) actionPrevEtd.textContent = details.etd || "-";
    if (actionCloseList) actionCloseList.innerHTML = "";
  } else {
    renderActionCloseOfficers(pickRandomEntries(runnerClosePool, 2));
    if (actionTeamList) actionTeamList.innerHTML = "";
    if (actionPrevGate) actionPrevGate.textContent = "-";
    if (actionPrevFlight) actionPrevFlight.textContent = "-";
    if (actionPrevEtd) actionPrevEtd.textContent = "-";
  }

  actionBackdrop.classList.add("is-visible");
  actionModal.classList.add("is-visible");
  if (actionClose) actionClose.focus();
};

const closeActionModal = (returnToDetails = false) => {
  if (!actionModal || !actionBackdrop) return;
  actionBackdrop.classList.remove("is-visible");
  actionModal.classList.remove("is-visible");
  activeActionMode = null;
  if (returnToDetails && activeCard) {
    openModal(activeCard);
    return;
  }
  activeCard = null;
};

const openModal = (card) => {
  if (!modal || !modalBackdrop) return;
  activeCard = card;
  const details = getCardDetails(card);
  setModalFields(details);
  renderAssignedTeams(card);
  setModalRemarks(card);
  setModalSaveState(Boolean(getCardRemarks(card)));
  setModalCompleteState(card);
  setModalActionVisibility(card);
  modalBackdrop.classList.add("is-visible");
  modal.classList.add("is-visible");
  if (modalClose) {
    modalClose.focus();
  }
};

const closeModal = (resetActiveCard = true) => {
  if (!modal || !modalBackdrop) return;
  modalBackdrop.classList.remove("is-visible");
  modal.classList.remove("is-visible");
  if (resetActiveCard) {
    activeCard = null;
  }
};

const createRunnerCardElement = (flight, requiredTargets) => {
  const card = document.createElement("article");
  card.className = "runner-card";
  card.dataset.status = flight.status;
  card.dataset.flightId = flight.id;
  card.dataset.remarks = flight.remarks || "";
  card.dataset.time = formatHrsAsClock(flight.etd);
  card.dataset.gate = flight.gate;
  card.dataset.flight = flight.flightNo;
  card.dataset.etd = flight.etd;

  const routeLine = flight.route
    ? `${flight.route} | FS ${flight.assignedFs}`
    : `FS ${flight.assignedFs}`;

  card.innerHTML = `
    <div class="runner-left">
      <div class="runner-time-block">${formatHrsAsClock(flight.etd)}</div>
      <div class="runner-gate-label">GATE</div>
      <div class="runner-gate">${normalizeGateCode(flight.gate)}</div>
    </div>
    <div class="runner-main">
      <div class="runner-flight">${flight.flightNo}</div>
      <div class="runner-route">${routeLine}</div>
    </div>
  `;

  if (flight.status !== "completed" && requiredTargets?.pullId === flight.id) {
    addRequiredMarker(card, "runner-pull-required", "Pull Team required");
  }
  if (flight.status !== "completed" && requiredTargets?.closeId === flight.id) {
    addRequiredMarker(card, "runner-close-gate-required", "Close Gate required");
  }

  card.classList.add("is-clickable");
  card.setAttribute("tabindex", "0");
  card.setAttribute("role", "button");
  card.addEventListener("click", () => openModal(card));
  card.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openModal(card);
    }
  });

  return card;
};

const renderFlightsToDevice = (device, flights, requiredTargets) => {
  const list = device?.querySelector(".runner-list");
  if (!list) return;
  list.querySelectorAll(".runner-card").forEach((card) => card.remove());
  flights.forEach((flight) => {
    list.appendChild(createRunnerCardElement(flight, requiredTargets));
  });
  const controller = runnerDeviceControllers.get(device);
  if (controller) {
    controller.refreshCurrentTab();
  }
};

const refreshRunnerBoards = () => {
  const flights = getRunnerFlights();
  const requiredTargets = getRequiredActionTargets(flights);

  if (desktopDevices.length) {
    const grouped = splitFlightsAcrossDevices(flights, desktopDevices.length);
    desktopDevices.forEach((device, index) => {
      renderFlightsToDevice(device, grouped[index] || [], requiredTargets);
    });
  }

  if (mobileDevice) {
    renderFlightsToDevice(mobileDevice, flights, requiredTargets);
  }
};

const refreshRunnerClock = () => {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, "0");
  const minutes = now.getMinutes().toString().padStart(2, "0");
  document
    .querySelectorAll(".runner-time")
    .forEach((clock) => (clock.textContent = `${hours}:${minutes}`));
};

if (modalClose) {
  modalClose.addEventListener("click", () => closeModal());
}

if (modalBackdrop) {
  modalBackdrop.addEventListener("click", () => closeModal());
}

if (modalPullTeamAction) {
  modalPullTeamAction.addEventListener("click", () => {
    if (!activeCard || modalPullTeamAction.classList.contains("is-hidden")) return;
    closeModal(false);
    openActionModal("pull");
  });
}

if (modalCloseGateAction) {
  modalCloseGateAction.addEventListener("click", () => {
    if (!activeCard || modalCloseGateAction.classList.contains("is-hidden")) return;
    closeModal(false);
    openActionModal("close");
  });
}

if (modalCompleteButton) {
  modalCompleteButton.addEventListener("click", () => {
    if (!activeCard || isCardCompleted(activeCard)) return;
    saveModalRemarksToCard();
    setModalSaveState(true);
    const flightId = activeCard.dataset.flightId;
    updateLiveFlight(flightId, (flight) => ({ ...flight, status: "completed" }));
    closeModal();
    refreshRunnerBoards();
  });
}

if (modalSaveButton) {
  modalSaveButton.addEventListener("click", () => {
    if (!activeCard) return;
    saveModalRemarksToCard();
    setModalSaveState(true);
  });
}

if (modalRemarks) {
  modalRemarks.addEventListener("input", () => {
    setModalSaveState(false);
  });
}

if (actionClose) {
  actionClose.addEventListener("click", () => closeActionModal(true));
}

if (actionBackdrop) {
  actionBackdrop.addEventListener("click", () => closeActionModal(true));
}

if (actionActionButton) {
  actionActionButton.addEventListener("click", () => {
    if (activeCard && activeActionMode === "pull") {
      setCardActionCompleted(activeCard, "pull");
    }
    if (activeCard && activeActionMode === "close") {
      setCardActionCompleted(activeCard, "close");
    }
    closeActionModal(true);
  });
}

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  if (actionModal && actionModal.classList.contains("is-visible")) {
    closeActionModal(true);
    return;
  }
  closeModal();
});

window.addEventListener("storage", (event) => {
  if (event.key === STORAGE_KEY_LIVE_FLIGHTS) {
    refreshRunnerBoards();
  }
});

refreshRunnerClock();
setInterval(refreshRunnerClock, 30000);
refreshRunnerBoards();
