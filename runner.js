const STORAGE_KEY_LIVE_FLIGHTS = "gateinterface.liveFlights";

const addRequiredMarker = (card, className, text) => {
  if (!card || card.querySelector(`.${className}`)) return;
  const requiredRow = card.querySelector(".runner-required-row");
  const route = card.querySelector(".runner-route");
  if (!requiredRow && !route) return;

  const marker = document.createElement("div");
  const staticClass = /-completed$/.test(className) ? " is-static" : "";
  marker.className = `runner-required ${className}${staticClass}`;
  marker.textContent = text;
  if (requiredRow) {
    requiredRow.appendChild(marker);
    return;
  }
  route.insertAdjacentElement("afterend", marker);
};

const normalizeStorageLabel = (value) =>
  String(value || "")
    .replace(/\s+/g, " ")
    .trim();

const parseActionFlag = (value) => value === true || value === "true";

const normalizeGateLabel = (value) => {
  const gate = normalizeStorageLabel(value).replace(/^gate\s*/i, "");
  return gate ? `Gate ${gate}` : "Gate --";
};

const normalizeGateCode = (value) =>
  normalizeGateLabel(value).replace(/^Gate\s*/i, "") || "--";

const extractGateCode = (value) => {
  const match = String(value || "")
    .toUpperCase()
    .replace(/^GATE\s*/i, "")
    .match(/^([AB])\s*(\d{1,2})$/);
  if (!match) return "";
  return `${match[1]}${Number(match[2])}`;
};

const TASKS_PER_TEAM = 24;
const TASKING_TOTAL = 24;

const clampCompletedTasks = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return null;
  return Math.max(0, Math.min(TASKS_PER_TEAM, Math.round(numeric)));
};

const shouldShowStartTaskAlert = (teams) =>
  Array.isArray(teams) &&
  teams.length > 0 &&
  teams.every((team) => (clampCompletedTasks(team?.completedTasks) ?? 0) === 0);

const selectRunnerCriticalFlightId = (flights) => {
  if (!Array.isArray(flights) || !flights.length) return "";
  const activeFlights = flights.filter((flight) => flight?.status !== "completed");
  const scopeFlights = activeFlights.length ? activeFlights : flights;
  const zeroTaskCandidates = scopeFlights.filter((flight) =>
    shouldShowStartTaskAlert(flight?.assignedTeams)
  );
  const targetFlight = zeroTaskCandidates[0] || scopeFlights[0] || null;
  return targetFlight ? targetFlight.id : "";
};

const TASKING_LIBRARY = [
  {
    title: "Start of Duty",
    instructions: ["Ensure this task is complete before starting duty."],
  },
  {
    title: "Opening of Door 9",
    instructions: ["Ensure all the team members arrived."],
    type: "Radio Button",
    customFieldTitle: "Opening of Door 9",
  },
  {
    title: "Pre Ops Briefing",
    instructions: ["TL to conduct Pre Ops briefing."],
    type: "Radio Button",
    customFieldTitle: "Pre Ops Briefing",
  },
  {
    title: "Conduct Pre Ops Self / Equipment Checks",
    instructions: [
      "Ensure number of Keys tally as per GHR Key-Set List.",
      "1. X-ray (Heimann/Nuctech)",
      "2. Panel Box",
      "3. Alarm Reset",
      "4. LAG Bin",
      "5. EFO Tablet with Charger (Serviceable Condition)",
    ],
    type: "Radio Button",
    customFieldTitle: "Pre Ops Self / Equipment checks",
  },
  {
    title: "Conduct Pre Ops Security Sweep",
    instructions: [
      "1. Ensure check the screening area.",
      "2. Check all the X Ray tunnel.",
      "3. Check Search Room.",
      "4. Ensure no unattended items inside GHR.",
      "5. Ensure all the fire hosereels /extinguishers shelf sealed.",
      "6. Check and secure Door 2,4,5.",
      "7. Ensure Anti Hijack Door(s) open.",
      "8. Placement of 'Security Screening in Progress. Do Not Enter' signage at Door 4.",
      "9. Lock & secure Door 4 key cover using the serviceable padlock available. (Default Passcode: 1-2-8)",
      "10. Always open lane 1 for ops.",
    ],
  },
  {
    title: "Check on Door 4 Lock Cover",
    instructions: [
      "To ensure Door 4 Lock Cover is locked and secured during live ops.",
    ],
  },
  {
    title: "Open Lane",
    instructions: ["Ensure officers are in ready to serve posture."],
  },
  {
    title: "Early Bunching / Queue",
    instructions: ["Queue flow."],
    type: "Radio Button",
    customFieldTitle: "Long Queue",
  },
  {
    title: "Record of PI",
    instructions: [
      "Account for all the detected PI.",
      "Please indicate total number of PI detected in the empty fill.",
    ],
  },
  {
    title: "Subtask 10",
    instructions: ["Task details not provided in current attachments."],
  },
  {
    title: "Subtask 11",
    instructions: ["Task details not provided in current attachments."],
  },
  {
    title: "Subtask 12",
    instructions: ["Task details not provided in current attachments."],
  },
  {
    title: "Subtask 13",
    instructions: ["Task details not provided in current attachments."],
  },
  {
    title: "Subtask 14",
    instructions: ["Task details not provided in current attachments."],
  },
  {
    title: "Subtask 15",
    instructions: ["Task details not provided in current attachments."],
  },
  {
    title: "No. of Prohibited item",
    instructions: [
      "Please indicate the total number of prohibited item(s) detected in the empty fill.",
    ],
  },
  {
    title: "Passenger Load",
    instructions: ["Please indicate final load for the flight in the empty fill."],
  },
  {
    title: "Random Alarm Activation",
    instructions: [
      "Please indicate total number of passengers activated random alarm in empty fill.",
    ],
  },
  {
    title: "Disposable of PI",
    instructions: ["Account for all the detected PI."],
    type: "Radio Button",
    customFieldTitle: "PI Disposal",
  },
  {
    title: "Conduct Anti-Theft Checks",
    instructions: [
      "Ensure all the team members underwent anti-theft checks before exiting Door 9.",
      "*Should there be an activation via the WTMD, frisking search must be conducted.",
      "*Discovery of any Lost & Found items must be handed over to the nearest information counter promptly as practicable.",
      "*Any retention of Lost & Found items for personal gain is an act of 'Dishonest Misappropriation of Property' and it is a chargeable offence under section 403 of the Penal Code.",
    ],
  },
  {
    title: "Conduct Post Ops Security Sweep",
    instructions: [
      "TL to deploy officers for security sweep, take Photo of:",
      "1. Aerobridge Control Panel - No Foreign Object.",
      "2. Door 3 Secure (Optional).",
      "3. Door 5 Secure.",
      "4. Removal of 'Security Screening in Progress. Do Not Enter' signage at Door 4.",
      "5. Unlock padlock at Door 4 key cover. (Default Passcode: 1-2-8)",
    ],
    type: "Radio Button",
    customFieldTitle: "Post Ops Security Sweep",
  },
  {
    title: "eFOF Submission",
    instructions: ["Submission EFOF."],
    type: "Radio Button",
    customFieldTitle: "eFOF Submission",
  },
  {
    title: "Lock and Secure Door 9",
    instructions: ["Locking of Door 9 (End Ops)."],
    type: "Radio Button",
    customFieldTitle: "Secured Door 9",
  },
  {
    title: "End of Duty",
    instructions: ["Ensure this task is complete after completing duty."],
  },
];

const escapeHtml = (value) =>
  String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");

let taskingBackdrop = null;
let taskingModal = null;
let taskingTitle = null;
let taskingProgress = null;
let taskingList = null;
let taskingClose = null;
let memberBackdrop = null;
let memberModal = null;
let memberTitle = null;
let memberSubtitle = null;
let memberList = null;
let memberClose = null;

const ensureTaskingOverlay = () => {
  if (taskingBackdrop && taskingModal) return;
  document.body.insertAdjacentHTML(
    "beforeend",
    `
      <div class="tasking-overlay-backdrop" id="runner-tasking-overlay-backdrop" aria-hidden="true"></div>
      <div class="tasking-overlay-modal" id="runner-tasking-overlay-modal" role="dialog" aria-modal="true" aria-labelledby="runner-tasking-overlay-title">
        <div class="tasking-overlay-header">
          <div>
            <h3 class="tasking-overlay-title" id="runner-tasking-overlay-title">Tasking</h3>
            <div class="tasking-overlay-progress" id="runner-tasking-overlay-progress">0 / ${TASKING_TOTAL} completed</div>
          </div>
          <button class="tasking-overlay-close" id="runner-tasking-overlay-close" type="button">Close</button>
        </div>
        <div class="tasking-overlay-body">
          <ol class="tasking-overlay-list" id="runner-tasking-overlay-list"></ol>
        </div>
      </div>
    `
  );
  taskingBackdrop = document.querySelector("#runner-tasking-overlay-backdrop");
  taskingModal = document.querySelector("#runner-tasking-overlay-modal");
  taskingTitle = document.querySelector("#runner-tasking-overlay-title");
  taskingProgress = document.querySelector("#runner-tasking-overlay-progress");
  taskingList = document.querySelector("#runner-tasking-overlay-list");
  taskingClose = document.querySelector("#runner-tasking-overlay-close");

  if (taskingClose) {
    taskingClose.addEventListener("click", () => closeTaskingOverlay());
  }
  if (taskingBackdrop) {
    taskingBackdrop.addEventListener("click", () => closeTaskingOverlay());
  }
};

const isTaskingOverlayVisible = () =>
  Boolean(taskingModal && taskingModal.classList.contains("is-visible"));

const closeTaskingOverlay = () => {
  if (!taskingBackdrop || !taskingModal) return;
  taskingBackdrop.classList.remove("is-visible");
  taskingModal.classList.remove("is-visible");
};

const openTaskingOverlay = (teamLabel, completedTasks) => {
  ensureTaskingOverlay();
  if (!taskingBackdrop || !taskingModal || !taskingList) return;
  const clampedCompleted = clampCompletedTasks(completedTasks) ?? 0;
  const safeLabel = normalizeStorageLabel(teamLabel) || "Team";
  if (taskingTitle) {
    taskingTitle.textContent = `${safeLabel} Tasking`;
  }
  if (taskingProgress) {
    taskingProgress.textContent = `${clampedCompleted} / ${TASKING_TOTAL} completed`;
  }

  taskingList.innerHTML = TASKING_LIBRARY.map((task, index) => {
    const taskNumber = index + 1;
    const isComplete = taskNumber <= clampedCompleted;
    const instructions = Array.isArray(task.instructions)
      ? task.instructions
      : [task.instructions];
    const instructionMarkup = instructions
      .filter(Boolean)
      .map((line) => escapeHtml(line))
      .join("<br />");
    const typeMarkup = task.type
      ? `<div class="tasking-overlay-meta"><span>Type</span><strong>${escapeHtml(
          task.type
        )}</strong></div>`
      : "";
    const customMarkup = task.customFieldTitle
      ? `<div class="tasking-overlay-meta"><span>Custom Field Title</span><strong>${escapeHtml(
          task.customFieldTitle
        )}</strong></div>`
      : "";
    return `
      <li class="tasking-overlay-item${isComplete ? " is-complete" : ""}">
        <div class="tasking-overlay-item-head">
          <span>Subtask ${taskNumber}</span>
          <span>${isComplete ? "Complete" : "Pending"}</span>
        </div>
        <div class="tasking-overlay-item-title">${escapeHtml(task.title)}</div>
        <div class="tasking-overlay-item-instruction">${instructionMarkup || "-"}</div>
        ${typeMarkup}
        ${customMarkup}
      </li>
    `;
  }).join("");

  taskingBackdrop.classList.add("is-visible");
  taskingModal.classList.add("is-visible");
  if (taskingClose) {
    taskingClose.focus();
  }
};

const ensureRunnerMemberOverlay = () => {
  if (memberBackdrop && memberModal) return;
  document.body.insertAdjacentHTML(
    "beforeend",
    `
      <div class="runner-member-overlay-backdrop" id="runner-member-overlay-backdrop" aria-hidden="true"></div>
      <div class="runner-member-overlay-modal" id="runner-member-overlay-modal" role="dialog" aria-modal="true" aria-labelledby="runner-member-overlay-title">
        <div class="runner-member-overlay-header">
          <div>
            <h3 class="runner-member-overlay-title" id="runner-member-overlay-title">Team Members</h3>
            <div class="runner-member-overlay-subtitle" id="runner-member-overlay-subtitle">-</div>
          </div>
          <button class="runner-member-overlay-close" id="runner-member-overlay-close" type="button">Close</button>
        </div>
        <div class="runner-member-overlay-body">
          <ul class="runner-member-overlay-list" id="runner-member-overlay-list"></ul>
        </div>
      </div>
    `
  );

  memberBackdrop = document.querySelector("#runner-member-overlay-backdrop");
  memberModal = document.querySelector("#runner-member-overlay-modal");
  memberTitle = document.querySelector("#runner-member-overlay-title");
  memberSubtitle = document.querySelector("#runner-member-overlay-subtitle");
  memberList = document.querySelector("#runner-member-overlay-list");
  memberClose = document.querySelector("#runner-member-overlay-close");

  if (memberClose) {
    memberClose.addEventListener("click", () => closeRunnerMemberOverlay());
  }
  if (memberBackdrop) {
    memberBackdrop.addEventListener("click", () => closeRunnerMemberOverlay());
  }
};

const isRunnerMemberOverlayVisible = () =>
  Boolean(memberModal && memberModal.classList.contains("is-visible"));

const closeRunnerMemberOverlay = () => {
  if (!memberBackdrop || !memberModal) return;
  memberBackdrop.classList.remove("is-visible");
  memberModal.classList.remove("is-visible");
};

const buildTaskInfoButtonMarkup = (teamLabel, completedTasks) => {
  const safeLabel = escapeHtml(teamLabel || "Team");
  const clamped = clampCompletedTasks(completedTasks) ?? 0;
  return `<button class="task-info-button" type="button" data-tasking-info="true" data-team-label="${safeLabel}" data-completed-tasks="${clamped}" aria-label="View ${safeLabel} tasking">Info</button>`;
};

const normalizeAssignedTeams = (teams) => {
  if (!Array.isArray(teams)) return [];
  return teams
    .map((team) => {
      const label = normalizeStorageLabel(team?.label || team?.team || "");
      if (!label) return null;
      let completedTasks = clampCompletedTasks(team?.completedTasks);
      if (completedTasks === null) {
        const numericSignal = Number(team?.signal);
        if (Number.isFinite(numericSignal)) {
          const clampedSignal = Math.max(1, Math.min(4, Math.round(numericSignal)));
          completedTasks = clampCompletedTasks((clampedSignal / 4) * TASKS_PER_TEAM);
        }
      }
      if (completedTasks === null) {
        completedTasks = 0;
      }
      return { label, completedTasks };
    })
    .filter(Boolean)
    .slice(0, 4);
};

const normalizeFlightNumber = (value) => {
  const raw = normalizeStorageLabel(value).toUpperCase();
  if (!raw) return "-";
  const match = raw.match(/[A-Z]{1,3}\s*\d+/);
  return match ? match[0].replace(/\s+/g, " ") : raw;
};

const normalizeAircraftType = (value) => {
  const normalized = normalizeStorageLabel(value).replace(/^type\s*:\s*/i, "");
  return normalized || "--";
};

const normalizePaxValue = (value) => {
  const normalized = normalizeStorageLabel(value).replace(/^pax\s*:\s*/i, "");
  return normalized || "--";
};

const normalizeScreeningSummary = (value) =>
  normalizeStorageLabel(value)
    .split("|")
    .map((item) => normalizeStorageLabel(item))
    .filter(Boolean)
    .join(" | ");

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

const RUNNER_UNASSIGNED_FALLBACK_COUNT = 4;

const sortRunnerFlightsByEtd = (flights) =>
  [...flights].sort((a, b) => {
    const aMinutes = parseHrsToMinutes(a.etd);
    const bMinutes = parseHrsToMinutes(b.etd);
    const aSort = aMinutes === null ? Number.MAX_SAFE_INTEGER : aMinutes;
    const bSort = bMinutes === null ? Number.MAX_SAFE_INTEGER : bMinutes;
    return aSort - bSort;
  });

const pickRandomRunnerFlights = (flights, count) => {
  const shuffled = [...flights];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [
      shuffled[randomIndex],
      shuffled[index],
    ];
  }
  return shuffled.slice(0, Math.max(0, count));
};

const getRunnerFlights = () => {
  const normalizedFlights = readLiveFlightsFromStorage()
    .filter((flight) => flight && typeof flight === "object")
    .map((flight, index) => {
      const id = normalizeStorageLabel(flight.id || `flight-${index + 1}`);
      const gate = normalizeGateLabel(flight.gate);
      const flightNo = normalizeFlightNumber(flight.flightNo);
      const etd = normalizeTimeLabel(flight.etd);
      const std = normalizeTimeLabel(flight.std);
      const route = normalizeStorageLabel(flight.route || "");
      const aircraftType = normalizeAircraftType(
        flight.aircraftType || flight.type
      );
      const pax = normalizePaxValue(flight.pax);
      const screeningSummary = normalizeScreeningSummary(
        flight.screeningSummary || flight.screening
      );
      const hasPatdown = parseActionFlag(flight.hasPatdown);
      const hasEnhanced = parseActionFlag(flight.hasEnhanced);
      const assignedFs = normalizeStorageLabel(flight.assignedFs || "");
      const remarks = normalizeStorageLabel(flight.remarks || "");
      const assignedTeams = normalizeAssignedTeams(flight.assignedTeams);
      const status = flight.status === "completed" ? "completed" : "assigned";
      const gateChanged = parseActionFlag(flight.gateChanged);
      const gateChangeOldGate = extractGateCode(flight.gateChangeOldGate);
      const pullRequired = parseActionFlag(flight.pullRequired);
      const closeRequired = parseActionFlag(flight.closeRequired);
      const pullCompleted = parseActionFlag(flight.pullCompleted);
      const closeCompleted = parseActionFlag(flight.closeCompleted);
      return {
        id,
        gate,
        flightNo,
        etd,
        std,
        route,
        aircraftType,
        pax,
        screeningSummary,
        hasPatdown,
        hasEnhanced,
        assignedFs,
        remarks,
        assignedTeams,
        status,
        gateChanged,
        gateChangeOldGate,
        pullRequired,
        closeRequired,
        pullCompleted,
        closeCompleted,
      };
    });

  const assignedFlights = normalizedFlights.filter((flight) => flight.assignedFs);
  if (assignedFlights.length) {
    return sortRunnerFlightsByEtd(assignedFlights);
  }

  const activeFlights = normalizedFlights.filter(
    (flight) => flight.status !== "completed"
  );
  const fallbackPool = activeFlights.length ? activeFlights : normalizedFlights;
  if (!fallbackPool.length) return [];

  const fallbackCount = Math.min(
    RUNNER_UNASSIGNED_FALLBACK_COUNT,
    fallbackPool.length
  );
  return sortRunnerFlightsByEtd(
    pickRandomRunnerFlights(fallbackPool, fallbackCount)
  );
};

const splitFlightsAcrossDevices = (flights, deviceCount) => {
  if (deviceCount <= 0) return [];
  const groups = Array.from({ length: deviceCount }, () => []);
  flights.forEach((flight, index) => {
    groups[index % deviceCount].push(flight);
  });
  return groups;
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
const actionTeamTabs = document.querySelector(".runner-action-team-tabs");
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
let actionTeams = [];
let actionActiveTeamIndex = 0;

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

const getTeamMemberCountFromLabel = (label) => {
  const match = String(label || "").match(/\((\d+)\)/);
  const count = match ? Number(match[1]) : 3;
  return Number.isFinite(count) && count > 0 ? count : 3;
};

const normalizeTeamLabelForMembers = (label) =>
  String(label || "")
    .replace(/\s*-\s*main team\s*$/i, "")
    .replace(/\s+/g, " ")
    .trim();

const buildAssignedTeamMembers = (teamLabel, requestedCount) => {
  const memberCount = Math.max(
    1,
    Math.min(
      runnerTeamPool.length,
      Number(requestedCount) || getTeamMemberCountFromLabel(teamLabel)
    )
  );
  const seed = hashText(normalizeTeamLabelForMembers(teamLabel));
  const members = [];
  const used = new Set();
  let cursor = seed || 1;

  while (members.length < memberCount) {
    const index = cursor % runnerTeamPool.length;
    cursor = (cursor * 13 + 17) % 2147483647;
    if (used.has(index)) continue;
    used.add(index);
    const baseMember = runnerTeamPool[index];
    members.push({
      id: baseMember.id,
      name: baseMember.name,
      phone: baseMember.phone,
      role: members.length === 0 ? "Team Leader" : "Officer",
    });
  }

  return members;
};

const openRunnerMemberOverlay = (teamLabel, memberCount) => {
  ensureRunnerMemberOverlay();
  if (!memberBackdrop || !memberModal || !memberList) return;

  const normalizedLabel = normalizeTeamLabelForMembers(teamLabel) || "Team";
  const members = buildAssignedTeamMembers(normalizedLabel, memberCount);

  if (memberTitle) {
    memberTitle.textContent = normalizedLabel;
  }
  if (memberSubtitle) {
    memberSubtitle.textContent = `${members.length} officers`;
  }
  memberList.innerHTML = members
    .map((member) => {
      const roleMarkup =
        member.role === "Team Leader"
          ? `<small class="runner-member-role">${escapeHtml(member.role)}</small>`
          : "";
      return `<li><span>${escapeHtml(member.id)} ${escapeHtml(member.name)}${roleMarkup}<br /><small>${escapeHtml(
        member.phone
      )}</small></span><span>&check;</span></li>`;
    })
    .join("");

  memberBackdrop.classList.add("is-visible");
  memberModal.classList.add("is-visible");
  if (memberClose) {
    memberClose.focus();
  }
};

const normalizePullTeamLabel = (label) =>
  String(label || "")
    .replace(/\s*-\s*main team\s*$/i, "")
    .trim();

const getCardDetails = (card) => {
  const time = card?.dataset.time || "--:--";
  const gate = card?.dataset.gate || "Gate --";
  const flight = card?.dataset.flight || "--";
  const etd = card?.dataset.etd || "-";
  return { time, gate, flight, etd };
};

const getRunnerNextCardCandidates = (card) => {
  const list = card?.closest(".runner-list");
  const cards = list
    ? Array.from(list.querySelectorAll(".runner-card"))
    : Array.from(document.querySelectorAll(".runner-card"));
  const scopedCards = cards.filter((item) => item.dataset.status !== "completed");
  const sourceCards = scopedCards.length ? scopedCards : cards;
  if (!sourceCards.length) return [];
  if (!card) return sourceCards;
  const index = sourceCards.indexOf(card);
  const rotated =
    index === -1
      ? sourceCards
      : sourceCards.slice(index + 1).concat(sourceCards.slice(0, index));
  const candidates = rotated.filter((item) => item !== card);
  return candidates.length ? candidates : [card];
};

const buildPullTeams = (card) => {
  if (!card) return [];
  const baseTeams = getAssignedTeamsForCard(card);
  if (!baseTeams.length) return [];
  const candidates = getRunnerNextCardCandidates(card);
  let candidateIndex = 0;

  return baseTeams.map((team) => {
    const nextCard = candidates[candidateIndex % (candidates.length || 1)] || card;
    candidateIndex += 1;
    const details = getCardDetails(nextCard);
    const normalizedLabel = normalizePullTeamLabel(team.label);
    const memberCount = getTeamMemberCountFromLabel(normalizedLabel);
    return {
      label: normalizedLabel,
      nextGate: normalizeGateLabel(details.gate),
      reportingTime: formatClockAsHrs(details.time),
      flightNo: details.flight || "--",
      gateOpeningTime: formatMinutesAsHrs(offsetClockByMinutes(details.time, 20)),
      members: pickRandomEntries(runnerTeamPool, memberCount),
    };
  });
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

  const flightId = card.dataset.flightId;
  updateLiveFlight(flightId, (flight) => {
    const next = {
      ...flight,
      pullRequired: parseActionFlag(flight.pullRequired),
      closeRequired: parseActionFlag(flight.closeRequired),
      pullCompleted: parseActionFlag(flight.pullCompleted),
      closeCompleted: parseActionFlag(flight.closeCompleted),
    };
    if (actionType === "pull") {
      next.pullRequired = true;
      next.pullCompleted = true;
    } else {
      next.closeRequired = true;
      next.closeCompleted = true;
    }
    return next;
  });
};

const hashText = (value) => {
  const text = String(value || "");
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) % 2147483647;
  }
  return Math.abs(hash);
};

const getStoredAssignedTeamsForCard = (card) => {
  if (!card) return [];
  const raw = String(card.dataset.assignedTeams || "").trim();
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return normalizeAssignedTeams(parsed);
  } catch (error) {
    return [];
  }
};

const getAssignedTeamsForCard = (card) => {
  const storedTeams = getStoredAssignedTeamsForCard(card);
  if (storedTeams.length) return storedTeams;

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
      completedTasks: ((teamId * 5) % TASKS_PER_TEAM) + 1,
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
      const completedTasks = clampCompletedTasks(team.completedTasks) ?? 0;
      const memberCount = getTeamMemberCountFromLabel(team.label);
      return `<li class=\"runner-team-row runner-team-row-clickable\" data-team-members=\"true\" data-team-members-label=\"${escapeHtml(
        team.label
      )}\" data-team-members-count=\"${memberCount}\" role=\"button\" tabindex=\"0\"><span class=\"runner-team-name\">${escapeHtml(
        team.label
      )}</span><div class=\"runner-team-progress-wrap\"><div class=\"runner-team-progress\">${completedTasks} / ${TASKS_PER_TEAM}</div>${buildTaskInfoButtonMarkup(
        team.label,
        completedTasks
      )}</div></li>`;
    })
    .join("");
};

if (modalTeamList) {
  modalTeamList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-tasking-info=\"true\"]");
    if (button) {
      const teamLabel = button.dataset.teamLabel || "Team";
      const completedTasks = clampCompletedTasks(button.dataset.completedTasks) ?? 0;
      openTaskingOverlay(teamLabel, completedTasks);
      return;
    }

    const row = event.target.closest("[data-team-members=\"true\"]");
    if (!row) return;
    const teamLabel = row.dataset.teamMembersLabel || "Team";
    const memberCount = Number(row.dataset.teamMembersCount);
    openRunnerMemberOverlay(teamLabel, memberCount);
  });

  modalTeamList.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    if (event.target.closest("[data-tasking-info=\"true\"]")) return;
    const row = event.target.closest("[data-team-members=\"true\"]");
    if (!row) return;
    event.preventDefault();
    const teamLabel = row.dataset.teamMembersLabel || "Team";
    const memberCount = Number(row.dataset.teamMembersCount);
    openRunnerMemberOverlay(teamLabel, memberCount);
  });
}

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

const renderActionTeamTabs = () => {
  if (!actionTeamTabs) return;
  if (!actionTeams.length) {
    actionTeamTabs.innerHTML = "";
    actionTeamTabs.classList.add("is-hidden");
    return;
  }
  actionTeamTabs.classList.remove("is-hidden");
  actionTeamTabs.innerHTML = actionTeams
    .map((team, index) => {
      const isActive = index === actionActiveTeamIndex;
      return `<button class="runner-action-team-tab${isActive ? " is-active" : ""}" type="button" role="tab" aria-selected="${isActive ? "true" : "false"}" data-index="${index}">${team.label}</button>`;
    })
    .join("");
};

const updateActionTeamSelection = (index) => {
  if (!actionTeams.length) return;
  const nextIndex = Math.max(0, Math.min(index, actionTeams.length - 1));
  actionActiveTeamIndex = nextIndex;
  renderActionTeamTabs();
  const activeTeam = actionTeams[actionActiveTeamIndex];
  if (actionGate) actionGate.textContent = activeTeam?.nextGate || "Gate --";
  if (actionReporting) {
    actionReporting.textContent = activeTeam?.reportingTime || "--";
  }
  if (actionFlight) actionFlight.textContent = activeTeam?.flightNo || "--";
  if (actionOpening) {
    actionOpening.textContent = activeTeam?.gateOpeningTime || "--";
  }
  renderActionTeamMembers(activeTeam?.members || []);
};

const setActionTeams = (teams) => {
  actionTeams = Array.isArray(teams) ? teams : [];
  actionActiveTeamIndex = 0;
  if (actionTeams.length) {
    updateActionTeamSelection(0);
  } else {
    renderActionTeamTabs();
  }
};

const clearActionTeams = () => {
  actionTeams = [];
  actionActiveTeamIndex = 0;
  renderActionTeamTabs();
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
  const isPull = mode === "pull";
  setActionSummary(details);

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
    setActionTeams(buildPullTeams(activeCard));
    if (!actionTeams.length) {
      renderActionTeamMembers(pickRandomEntries(runnerTeamPool, 3));
    }
    if (actionTeamTitle) actionTeamTitle.textContent = "Team Members";
    if (actionPrevGate) actionPrevGate.textContent = normalizeGateLabel(details.gate);
    if (actionPrevFlight) actionPrevFlight.textContent = details.flight || "-";
    if (actionPrevEtd) actionPrevEtd.textContent = details.etd || "-";
    if (actionCloseList) actionCloseList.innerHTML = "";
  } else {
    clearActionTeams();
    setActionSummary(details);
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
  closeTaskingOverlay();
  closeRunnerMemberOverlay();
  if (!modal || !modalBackdrop) return;
  modalBackdrop.classList.remove("is-visible");
  modal.classList.remove("is-visible");
  if (resetActiveCard) {
    activeCard = null;
  }
};

const createRunnerCardElement = (flight, criticalFlightId = "") => {
  const card = document.createElement("article");
  card.className = "runner-card";
  card.dataset.status = flight.status;
  card.dataset.flightId = flight.id;
  card.dataset.remarks = flight.remarks || "";
  card.dataset.time = formatHrsAsClock(flight.etd);
  card.dataset.gate = flight.gate;
  card.dataset.flight = flight.flightNo;
  card.dataset.etd = flight.etd;
  card.dataset.assignedTeams = JSON.stringify(
    Array.isArray(flight.assignedTeams) ? flight.assignedTeams : []
  );

  const hasDisplayValue = (value) => {
    const text = normalizeStorageLabel(value);
    return Boolean(text && text !== "-" && text !== "--" && text !== "--:--");
  };

  const timeText = formatHrsAsClock(flight.etd);
  const gateCode = normalizeGateCode(flight.gate);
  const oldGateCode = extractGateCode(flight.gateChangeOldGate);
  const shouldShowPull = flight.pullCompleted || flight.pullRequired;
  const shouldShowClose = flight.closeCompleted || flight.closeRequired;
  const hasStartTask =
    flight.status !== "completed" &&
    Boolean(criticalFlightId) &&
    flight.id === criticalFlightId;
  const hasGateChange =
    parseActionFlag(flight.gateChanged) &&
    hasDisplayValue(gateCode) &&
    oldGateCode &&
    oldGateCode !== gateCode;
  const gateChangeMarkup = hasGateChange
    ? `<div class="runner-gate-change"><span class="from">${oldGateCode}</span><span class="arrow">&rarr;</span><span class="to">${gateCode}</span></div>`
    : "";
  const gateAlertMarkup = [
    hasStartTask ? `<div class="runner-gate-alert task">Start Task</div>` : "",
    hasGateChange ? `<div class="runner-gate-alert change">Change Gate</div>` : "",
  ].join("");

  const flightNoText = hasDisplayValue(flight.flightNo)
    ? normalizeStorageLabel(flight.flightNo)
    : "";
  const routeLine = hasDisplayValue(flight.route)
    ? normalizeStorageLabel(flight.route)
    : "";
  const typeText = hasDisplayValue(flight.aircraftType)
    ? normalizeStorageLabel(flight.aircraftType)
    : "";
  const paxText = hasDisplayValue(flight.pax)
    ? normalizeStorageLabel(flight.pax)
    : "";
  const remarksLine = hasDisplayValue(flight.remarks)
    ? normalizeStorageLabel(flight.remarks)
    : "";
  const screeningLine = hasDisplayValue(flight.screeningSummary)
    ? normalizeStorageLabel(flight.screeningSummary)
    : flight.hasEnhanced
    ? "ENHN. SCRN"
    : "";

  const safeTimeText = escapeHtml(timeText);
  const safeGateCode = escapeHtml(gateCode);
  const safeFlightNo = escapeHtml(flightNoText);
  const safeRouteLine = escapeHtml(routeLine);
  const safeType = escapeHtml(typeText);
  const safePax = escapeHtml(paxText);
  const safeRemarks = escapeHtml(remarksLine);
  const safeScreening = escapeHtml(screeningLine);
  const patdownBadge = flight.hasPatdown
    ? `<span class="runner-inline-badge">Pat Down</span>`
    : "";
  const leftTimeMarkup = hasDisplayValue(timeText)
    ? `<div class="runner-time-block">${safeTimeText}</div>`
    : "";
  const leftGateLabelMarkup = hasDisplayValue(gateCode)
    ? `<div class="runner-gate-label">GATE</div>`
    : "";
  const leftGateMarkup = hasDisplayValue(gateCode)
    ? `<div class="runner-gate">${safeGateCode}</div>`
    : "";
  const flightRowMarkup = flightNoText || patdownBadge
    ? `<div class="runner-flight-row">${flightNoText ? `<div class="runner-flight">${safeFlightNo}</div>` : ""}${patdownBadge}</div>`
    : "";
  const routeMarkup = routeLine ? `<div class="runner-route">${safeRouteLine}</div>` : "";
  const metaMarkup = typeText || paxText
    ? `<div class="runner-meta-pair">${typeText ? `<span>Type: ${safeType}</span>` : ""}${paxText ? `<span>Pax: ${safePax}</span>` : ""}</div>`
    : "";
  const requiredRowMarkup =
    shouldShowPull || shouldShowClose ? `<div class="runner-required-row"></div>` : "";
  const remarksMarkup = remarksLine
    ? `<div class="runner-detail-line"><span class="runner-detail-label">Remarks:</span><span class="runner-detail-value">${safeRemarks}</span></div>`
    : "";
  const screeningMarkup = screeningLine
    ? `<div class="runner-detail-line runner-detail-line-screening"><span class="runner-detail-value">${safeScreening}</span></div>`
    : "";

  card.innerHTML = `
    <div class="runner-left">
      ${leftTimeMarkup}
      ${leftGateLabelMarkup}
      ${leftGateMarkup}
      ${gateAlertMarkup}
      ${gateChangeMarkup}
    </div>
    <div class="runner-main">
      <div class="runner-main-top">
        <div class="runner-flight-stack">
          ${flightRowMarkup}
          ${routeMarkup}
        </div>
        ${metaMarkup}
      </div>
      ${requiredRowMarkup}
      ${remarksMarkup}
      ${screeningMarkup}
    </div>
  `;
  if (hasStartTask) {
    card.classList.add("is-critical");
  }
  if (hasGateChange) {
    card.classList.add("is-change");
  }

  if (shouldShowClose) {
    addRequiredMarker(
      card,
      flight.closeCompleted
        ? "runner-close-gate-completed"
        : "runner-close-gate-required",
      flight.closeCompleted ? "Gate Closed" : "Close Gate required"
    );
  }
  if (shouldShowPull) {
    addRequiredMarker(
      card,
      flight.pullCompleted ? "runner-pull-completed" : "runner-pull-required",
      flight.pullCompleted ? "Pull Team Completed" : "Pull Team required"
    );
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

const renderFlightsToDevice = (device, flights, criticalFlightId = "") => {
  const list = device?.querySelector(".runner-list");
  if (!list) return;
  list.querySelectorAll(".runner-card").forEach((card) => card.remove());
  flights.forEach((flight) => {
    list.appendChild(createRunnerCardElement(flight, criticalFlightId));
  });
  const controller = runnerDeviceControllers.get(device);
  if (controller) {
    controller.refreshCurrentTab();
  }
};

const refreshRunnerBoards = () => {
  const flights = getRunnerFlights();
  const criticalFlightId = selectRunnerCriticalFlightId(flights);

  if (desktopDevices.length) {
    const grouped = splitFlightsAcrossDevices(flights, desktopDevices.length);
    desktopDevices.forEach((device, index) => {
      renderFlightsToDevice(device, grouped[index] || [], criticalFlightId);
    });
  }

  if (mobileDevice) {
    renderFlightsToDevice(mobileDevice, flights, criticalFlightId);
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

if (actionTeamTabs) {
  actionTeamTabs.addEventListener("click", (event) => {
    const tab = event.target.closest(".runner-action-team-tab");
    if (!tab) return;
    const index = Number(tab.dataset.index);
    if (!Number.isFinite(index)) return;
    updateActionTeamSelection(index);
  });
}

if (actionActionButton) {
  actionActionButton.addEventListener("click", () => {
    if (activeCard && activeActionMode === "pull") {
      setCardActionCompleted(activeCard, "pull");
    }
    if (activeCard && activeActionMode === "close") {
      setCardActionCompleted(activeCard, "close");
    }
    refreshRunnerBoards();
    closeActionModal(true);
  });
}

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  if (isRunnerMemberOverlayVisible()) {
    closeRunnerMemberOverlay();
    return;
  }
  if (isTaskingOverlayVisible()) {
    closeTaskingOverlay();
    return;
  }
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
