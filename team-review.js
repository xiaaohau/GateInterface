const STORAGE_KEY_LIVE_FLIGHTS = "gateinterface.liveFlights";
const OFFICER_COUNT = 100;
const BREAK_THRESHOLD_MINUTES = 20;
const MAX_TABLE_ROWS = 100;

const SHIFT_CONFIG = {
  Morning: { start: 10 * 60, end: 22 * 60 },
  Evening: { start: 13 * 60, end: 25 * 60 },
  Night: { start: 22 * 60, end: 34 * 60 },
};

const SHIFT_TIMING_LABELS = {
  Morning: "1000hrs - 2200hrs",
  Evening: "1300hrs - 0100hrs",
  Night: "2200hrs - 1000hrs",
};

const AIRLINE_CODES = [
  "SQ",
  "NZ",
  "JL",
  "CX",
  "QR",
  "UA",
  "DL",
  "BA",
  "QF",
  "EK",
  "LH",
  "TK",
  "PR",
  "MU",
  "HU",
  "GA",
  "KE",
  "OZ",
  "VN",
  "TG",
  "MH",
  "BR",
];

const FIRST_NAME_INITIALS = ["A", "B", "C", "D", "E", "F", "H", "J", "K", "L", "M", "N", "P", "R", "S", "T", "W", "Y", "Z"];
const LAST_NAMES = [
  "Rahman",
  "Lim",
  "Wong",
  "Tan",
  "Chan",
  "Ong",
  "Lee",
  "Ng",
  "Koh",
  "Teo",
  "Goh",
  "Yeo",
  "Low",
  "Ho",
  "Luo",
  "Seah",
];

const REMARK_POOL = ["ASQ", "GOEM", "CIP", "VIP", "DM3999", ""];

const filterDate = document.querySelector("#filter-date");
const filterShift = document.querySelector("#filter-shift");
const filterTerminal = document.querySelector("#filter-terminal");
const filterStatus = document.querySelector("#filter-status");
const filterSearch = document.querySelector("#filter-search");
const filterReset = document.querySelector("#filter-reset");

const tableBody = document.querySelector("#officer-table-body");
const emptyState = document.querySelector("#officer-empty");

const kpiAvgBreaks = document.querySelector("#kpi-avg-breaks");
const kpiMissingBreak = document.querySelector("#kpi-missing-break");
const kpiMissingBreakCard = document.querySelector("#kpi-missing-break-card");

const drawer = document.querySelector("#officer-drawer");
const drawerBackdrop = document.querySelector("#officer-drawer-backdrop");
const drawerClose = document.querySelector("#drawer-close");
const drawerOfficerName = document.querySelector("#drawer-officer-name");
const drawerOfficerMeta = document.querySelector("#drawer-officer-meta");
const drawerCurrentFlight = document.querySelector("#drawer-current-flight");
const drawerCompletedFlights = document.querySelector("#drawer-completed-flights");
const drawerBreakCount = document.querySelector("#drawer-break-count");
const drawerBreakMinutes = document.querySelector("#drawer-break-minutes");
const drawerBreakList = document.querySelector("#drawer-break-list");
const drawerTimeline = document.querySelector("#drawer-timeline");

let allOfficerRecords = [];
let filteredOfficerRecords = [];
let officerRecordById = new Map();

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

const normalizeLabel = (value) =>
  String(value || "")
    .replace(/\s+/g, " ")
    .trim();

const escapeHtml = (value) =>
  String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseTimeToMinutes = (value) => {
  const match = normalizeLabel(value).match(/(\d{2})[:]?\s*(\d{2})\s*hrs?/i);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
};

const formatMinutesToHrs = (minutesValue) => {
  if (!Number.isFinite(minutesValue)) return "-";
  const normalized = ((Math.round(minutesValue) % 1440) + 1440) % 1440;
  const hours = Math.floor(normalized / 60)
    .toString()
    .padStart(2, "0");
  const minutes = (normalized % 60).toString().padStart(2, "0");
  return `${hours}${minutes}hrs`;
};

const formatMinutesToClock = (minutesValue) => {
  if (!Number.isFinite(minutesValue)) return "--:--";
  const normalized = ((Math.round(minutesValue) % 1440) + 1440) % 1440;
  const hours = Math.floor(normalized / 60)
    .toString()
    .padStart(2, "0");
  const minutes = (normalized % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}`;
};

const formatBreakRange = (start, end) =>
  Number.isFinite(start) && Number.isFinite(end)
    ? `${formatMinutesToClock(start)} - ${formatMinutesToClock(end)}`
    : "-";

const hashText = (value) => {
  const text = String(value || "");
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) % 2147483647;
  }
  return Math.abs(hash);
};

const mulberry32 = (seed) => {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let next = value;
    next = Math.imul(next ^ (next >>> 15), next | 1);
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61);
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
};

const getShiftForIndex = (index) => {
  if (index % 3 === 0) return "Morning";
  if (index % 3 === 1) return "Evening";
  return "Night";
};

const getShiftTimingLabel = (shift) =>
  SHIFT_TIMING_LABELS[shift] || "0000hrs - 0000hrs";

const getTerminalForOfficer = (index) => (index % 2 === 0 ? "A" : "B");

const buildOfficerCatalog = (count = OFFICER_COUNT) =>
  Array.from({ length: count }, (_, index) => {
    const officerNumber = 4001 + index;
    const id = `OS-${String(officerNumber).padStart(4, "0")}`;
    const initial = FIRST_NAME_INITIALS[index % FIRST_NAME_INITIALS.length];
    const lastName = LAST_NAMES[(index * 3 + 2) % LAST_NAMES.length];
    const name = `${initial}. ${lastName}`;
    const shift = getShiftForIndex(index);
    const terminal = getTerminalForOfficer(index);
    return {
      id,
      name,
      shift,
      terminal,
      seed: hashText(`${id}-${name}-${shift}`),
    };
  });

const normalizeLiveFlights = () =>
  readLiveFlightsFromStorage()
    .filter((flight) => flight && typeof flight === "object")
    .map((flight, index) => {
      const flightNo = normalizeLabel(flight.flightNo) || `FL-${index + 1}`;
      const gate = normalizeLabel(flight.gate) || "Gate --";
      const etdMinutes = parseTimeToMinutes(flight.etd);
      const rtMinutesRaw = parseTimeToMinutes(flight.rt);
      const rtMinutes =
        Number.isFinite(rtMinutesRaw)
          ? rtMinutesRaw
          : Number.isFinite(flight.rtMinutes)
            ? Number(flight.rtMinutes)
            : Number.isFinite(etdMinutes)
              ? etdMinutes - 90
              : null;
      const state = String(flight.status || "").toLowerCase() === "completed"
        ? "completed"
        : "active";
      return {
        id: normalizeLabel(flight.id) || `flight-${index + 1}`,
        flightNo,
        gate,
        remarks: normalizeLabel(flight.remarks),
        rtMinutes,
        etdMinutes,
        state,
      };
    })
    .filter((flight) => Number.isFinite(flight.rtMinutes) && Number.isFinite(flight.etdMinutes));

const buildSyntheticFlightsForOfficer = (officer, dateSeed) => {
  const rng = mulberry32(hashText(`${officer.id}-${dateSeed}`));
  const assignmentCount = 2 + Math.floor(rng() * 4);
  const baseShift = SHIFT_CONFIG[officer.shift];
  const startJitter = Math.floor(rng() * 45);
  let cursor = baseShift.start + startJitter;
  const rows = [];

  for (let index = 0; index < assignmentCount; index += 1) {
    const airlineCode = AIRLINE_CODES[Math.floor(rng() * AIRLINE_CODES.length)];
    const flightSuffix = 100 + Math.floor(rng() * 820);
    const gateLimit = officer.terminal === "A" ? 21 : 10;
    const gateNumber = 1 + Math.floor(rng() * gateLimit);
    const rtMinutes = cursor;
    const etdMinutes = rtMinutes + 90;
    const remarks = REMARK_POOL[Math.floor(rng() * REMARK_POOL.length)];

    rows.push({
      key: `${officer.id}-synth-${index}`,
      flightNo: `${airlineCode} ${flightSuffix}`,
      gate: `Gate ${officer.terminal}${gateNumber}`,
      rtMinutes,
      etdMinutes,
      remarks,
      state: "completed",
      source: "synthetic",
    });

    const breakGap = 10 + Math.floor(rng() * 65);
    cursor = etdMinutes + breakGap;
  }

  return rows;
};

const mergeLiveFlightsIntoOfficers = (officerAssignments, liveFlights, dateSeed) => {
  if (!liveFlights.length) return;
  const activeOfficerIds = Object.keys(officerAssignments);
  if (!activeOfficerIds.length) return;

  const activeFlights = liveFlights.filter((flight) => flight.state === "active");
  const completedFlights = liveFlights.filter((flight) => flight.state === "completed");

  activeFlights.forEach((flight, index) => {
    const targetIndex =
      hashText(`${flight.id}-${dateSeed}-${index}`) % activeOfficerIds.length;
    const officerId = activeOfficerIds[targetIndex];
    const assignments = officerAssignments[officerId] || [];
    const hasActive = assignments.some((item) => item.state === "active");
    if (hasActive) {
      assignments.push({
        key: `${officerId}-${flight.id}-completed-fallback`,
        flightNo: flight.flightNo,
        gate: flight.gate,
        rtMinutes: flight.rtMinutes - 120,
        etdMinutes: flight.etdMinutes - 120,
        remarks: flight.remarks,
        state: "completed",
        source: "live",
      });
    } else {
      assignments.push({
        key: `${officerId}-${flight.id}-active`,
        flightNo: flight.flightNo,
        gate: flight.gate,
        rtMinutes: flight.rtMinutes,
        etdMinutes: flight.etdMinutes,
        remarks: flight.remarks,
        state: "active",
        source: "live",
      });
    }
    officerAssignments[officerId] = assignments;
  });

  completedFlights.slice(0, 60).forEach((flight, index) => {
    const targetIndex =
      hashText(`${flight.id}-completed-${dateSeed}-${index}`) % activeOfficerIds.length;
    const officerId = activeOfficerIds[targetIndex];
    const assignments = officerAssignments[officerId] || [];
    assignments.push({
      key: `${officerId}-${flight.id}-completed`,
      flightNo: flight.flightNo,
      gate: flight.gate,
      rtMinutes: flight.rtMinutes,
      etdMinutes: flight.etdMinutes,
      remarks: flight.remarks,
      state: "completed",
      source: "live",
    });
    officerAssignments[officerId] = assignments;
  });
};

const getBreakRowsFromAssignments = (assignments) => {
  if (!assignments.length) return [];
  const sorted = [...assignments].sort((left, right) => left.rtMinutes - right.rtMinutes);
  const breakRows = [];
  for (let index = 0; index < sorted.length - 1; index += 1) {
    const current = sorted[index];
    const next = sorted[index + 1];
    const gap = next.rtMinutes - current.etdMinutes;
    if (gap >= BREAK_THRESHOLD_MINUTES) {
      breakRows.push({
        startMinutes: current.etdMinutes,
        endMinutes: next.rtMinutes,
        minutes: gap,
      });
    }
  }
  return breakRows;
};

const getCurrentStatus = ({ onBreakNow, noBreakRisk }) => {
  if (onBreakNow) return "On Break";
  if (noBreakRisk) return "No Break";
  return "On Duty";
};

const getStatusClass = (status) => {
  if (status === "No Break") return "no-break";
  if (status === "On Break") return "on-break";
  return "on-duty";
};

const getTerminalFromGate = (gate) => {
  const match = normalizeLabel(gate).match(/Gate\s*([AB])/i);
  if (!match) return "";
  return match[1].toUpperCase();
};

const buildOfficerRecords = (selectedDate) => {
  const catalog = buildOfficerCatalog(OFFICER_COUNT);
  const liveFlights = normalizeLiveFlights();
  const today = getLocalDateString();
  const dateSeed = normalizeLabel(selectedDate || today);
  const isToday = dateSeed === today;
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const officerAssignments = {};
  catalog.forEach((officer, index) => {
    officerAssignments[officer.id] = buildSyntheticFlightsForOfficer(officer, dateSeed).map((item) => ({
      ...item,
      state: isToday && item.etdMinutes >= nowMinutes - 20 && index % 17 === 0
        ? "active"
        : "completed",
    }));
  });

  if (isToday) {
    mergeLiveFlightsIntoOfficers(officerAssignments, liveFlights, dateSeed);
  }

  const records = catalog.map((officer) => {
    const absent = false;
    const assignments = (officerAssignments[officer.id] || [])
      .filter(
        (item) =>
          Number.isFinite(item.rtMinutes) &&
          Number.isFinite(item.etdMinutes) &&
          item.etdMinutes > item.rtMinutes
      )
      .sort((left, right) => left.rtMinutes - right.rtMinutes);

    const breakRows = getBreakRowsFromAssignments(assignments);
    const totalBreakMinutes = breakRows.reduce((sum, row) => sum + row.minutes, 0);
    const breakCount = breakRows.length;
    const lastBreak = breakRows.length
      ? breakRows[breakRows.length - 1]
      : null;
    const currentFlight = isToday
      ? assignments.find((item) => item.state === "active") || null
      : null;
    const onBreakNow =
      isToday &&
      !currentFlight &&
      breakRows.some(
        (row) => nowMinutes >= row.startMinutes && nowMinutes <= row.endMinutes
      );
    const flightsCompleted = assignments.filter((item) => item.state !== "active").length;
    const noBreakRisk = !absent && flightsCompleted > 0 && breakCount === 0;
    const status = getCurrentStatus({
      onBreakNow,
      noBreakRisk,
    });
    const terminalFromCurrent = currentFlight ? getTerminalFromGate(currentFlight.gate) : "";
    const terminal = terminalFromCurrent || officer.terminal;

    return {
      ...officer,
      absent,
      assignments,
      currentFlight,
      flightsCompleted,
      breakRows,
      breakCount,
      totalBreakMinutes,
      lastBreakRange: lastBreak
        ? formatBreakRange(lastBreak.startMinutes, lastBreak.endMinutes)
        : "-",
      status,
      statusClass: getStatusClass(status),
      noBreakRisk,
      terminal,
    };
  });

  return records;
};

const getCurrentFlightLabel = (record) => {
  if (!record.currentFlight) return "-";
  return `${record.currentFlight.flightNo} | ${record.currentFlight.gate} | ETD ${formatMinutesToHrs(
    record.currentFlight.etdMinutes
  )}`;
};

const renderKpis = (records) => {
  const onDuty = records.filter((record) => !record.absent).length;
  const totalFlights = records.reduce(
    (sum, record) => sum + record.assignments.length,
    0
  );
  const avgFlightsPerOfficer = onDuty > 0 ? (totalFlights / onDuty).toFixed(1) : "0.0";
  const missingBreak = records.filter((record) => record.noBreakRisk).length;

  if (kpiAvgBreaks) kpiAvgBreaks.textContent = avgFlightsPerOfficer;
  if (kpiMissingBreak) kpiMissingBreak.textContent = String(missingBreak);
};

const buildStatusBadge = (record) =>
  `<span class="officer-status ${escapeHtml(record.statusClass)}">${escapeHtml(
    record.status
  )}</span>`;

const buildRiskFlags = (record) => {
  return "";
};

const renderTableRows = (records) => {
  if (!tableBody) return;
  const rows = records.slice(0, MAX_TABLE_ROWS).map((record) => {
    const officerLabel = `${record.id} ${record.name}`;
    const currentFlight = escapeHtml(getCurrentFlightLabel(record));
    const breaksLabel = escapeHtml(
      `${record.breakCount} (${record.totalBreakMinutes} mins)`
    );
    const flags = buildRiskFlags(record);
    const officerLabelSafe = escapeHtml(officerLabel);
    return `<tr class="officer-row status-${escapeHtml(
      record.statusClass
    )}" data-officer-id="${escapeHtml(
      record.id
    )}" tabindex="0" role="button" aria-label="Open ${officerLabelSafe}">
      <td><div class="officer-cell-main">${officerLabelSafe}</div>${flags}</td>
      <td>${escapeHtml(getShiftTimingLabel(record.shift))}</td>
      <td>${currentFlight}</td>
      <td>${escapeHtml(record.flightsCompleted)}</td>
      <td>${breaksLabel}</td>
      <td>${escapeHtml(record.lastBreakRange)}</td>
      <td>${buildStatusBadge(record)}</td>
    </tr>`;
  });
  tableBody.innerHTML = rows.join("");
  if (emptyState) {
    emptyState.classList.toggle("is-hidden", records.length > 0);
  }
};

const buildTimelineRows = (record) => {
  const events = [];
  record.assignments.forEach((flight) => {
    events.push({
      startMinutes: flight.rtMinutes,
      endMinutes: flight.etdMinutes,
      type: "flight",
      title: `${flight.flightNo} - ${flight.gate}`,
      status: flight.state === "active" ? "Current Flight" : "Completed Flight",
      remarks: normalizeLabel(flight.remarks) || "-",
    });
  });
  record.breakRows.forEach((breakRow) => {
    events.push({
      startMinutes: breakRow.startMinutes,
      endMinutes: breakRow.endMinutes,
      type: "break",
      title: "Break Window",
      status: `${breakRow.minutes} mins`,
      remarks: "-",
    });
  });

  events.sort((left, right) => left.startMinutes - right.startMinutes);
  return events;
};

const openDrawer = (officerId) => {
  const record = officerRecordById.get(officerId);
  if (!record || !drawer || !drawerBackdrop) return;

  if (drawerOfficerName) {
    drawerOfficerName.textContent = `${record.id} ${record.name}`;
  }
  if (drawerOfficerMeta) {
    drawerOfficerMeta.textContent = `Shift ${getShiftTimingLabel(record.shift)} | Terminal ${record.terminal} | Status ${record.status}`;
  }
  if (drawerCurrentFlight) {
    drawerCurrentFlight.textContent = getCurrentFlightLabel(record);
  }
  if (drawerCompletedFlights) {
    drawerCompletedFlights.textContent = String(record.flightsCompleted);
  }
  if (drawerBreakCount) {
    drawerBreakCount.textContent = String(record.breakCount);
  }
  if (drawerBreakMinutes) {
    drawerBreakMinutes.textContent = `${record.totalBreakMinutes} mins`;
  }

  if (drawerBreakList) {
    if (!record.breakRows.length) {
      drawerBreakList.innerHTML = "<div class=\"officer-break-item\">No qualifying breaks recorded.</div>";
    } else {
      drawerBreakList.innerHTML = record.breakRows
        .map(
          (breakRow) =>
            `<div class="officer-break-item"><span>${escapeHtml(formatBreakRange(
              breakRow.startMinutes,
              breakRow.endMinutes
            ))}</span><span>${escapeHtml(`${breakRow.minutes} mins`)}</span></div>`
        )
        .join("");
    }
  }

  if (drawerTimeline) {
    const timelineRows = buildTimelineRows(record);
    drawerTimeline.innerHTML = timelineRows.length
      ? timelineRows
          .map(
            (event) => `<div class="officer-timeline-row ${event.type}">
              <div class="officer-timeline-time">${escapeHtml(
                formatBreakRange(
                  event.startMinutes,
                  event.endMinutes
                )
              )}</div>
              <div class="officer-timeline-main">
                <div class="officer-timeline-title">${escapeHtml(event.title)}</div>
                <div class="officer-timeline-sub">${escapeHtml(event.status)}</div>
                <div class="officer-timeline-remarks">Remarks: ${escapeHtml(
                  event.remarks
                )}</div>
              </div>
            </div>`
          )
          .join("")
      : "<div class=\"officer-timeline-empty\">No timeline records for the selected date.</div>";
  }

  drawerBackdrop.classList.add("is-visible");
  drawer.classList.add("is-visible");
  drawer.setAttribute("aria-hidden", "false");
};

const closeDrawer = () => {
  if (!drawer || !drawerBackdrop) return;
  drawerBackdrop.classList.remove("is-visible");
  drawer.classList.remove("is-visible");
  drawer.setAttribute("aria-hidden", "true");
};

const applyFilters = () => {
  const shiftValue = normalizeLabel(filterShift?.value || "all");
  const terminalValue = normalizeLabel(filterTerminal?.value || "all");
  const statusValue = normalizeLabel(filterStatus?.value || "all");
  const searchValue = normalizeLabel(filterSearch?.value || "").toLowerCase();

  filteredOfficerRecords = allOfficerRecords.filter((record) => {
    if (shiftValue !== "all" && record.shift !== shiftValue) return false;
    if (terminalValue !== "all" && record.terminal !== terminalValue) return false;
    if (statusValue !== "all" && record.status !== statusValue) return false;
    if (!searchValue) return true;
    const haystack = `${record.id} ${record.name}`.toLowerCase();
    return haystack.includes(searchValue);
  });

  renderKpis(filteredOfficerRecords);
  renderTableRows(filteredOfficerRecords);
  syncNoBreakShortcutState();
};

const applyNoBreakFilterShortcut = () => {
  if (!filterStatus) return;
  const isNoBreakActive = normalizeLabel(filterStatus.value) === "No Break";
  filterStatus.value = isNoBreakActive ? "all" : "No Break";
  applyFilters();
};

const resetFilters = () => {
  if (filterDate) {
    filterDate.value = getLocalDateString();
  }
  if (filterShift) {
    filterShift.value = "all";
  }
  if (filterTerminal) {
    filterTerminal.value = "all";
  }
  if (filterStatus) {
    filterStatus.value = "all";
  }
  if (filterSearch) {
    filterSearch.value = "";
  }
  rebuildData();
};

const syncNoBreakShortcutState = () => {
  if (!kpiMissingBreakCard || !filterStatus) return;
  const isActive = normalizeLabel(filterStatus.value) === "No Break";
  kpiMissingBreakCard.classList.toggle("is-active", isActive);
  kpiMissingBreakCard.setAttribute("aria-pressed", isActive ? "true" : "false");
};

const rebuildData = () => {
  const selectedDate = normalizeLabel(filterDate?.value || getLocalDateString());
  allOfficerRecords = buildOfficerRecords(selectedDate);
  officerRecordById = new Map(allOfficerRecords.map((record) => [record.id, record]));
  applyFilters();
};

const bindEvents = () => {
  [filterDate, filterShift, filterTerminal, filterStatus].forEach((control) => {
    if (!control) return;
    control.addEventListener("change", () => {
      if (control === filterDate) {
        rebuildData();
      } else {
        applyFilters();
      }
    });
  });

  if (filterSearch) {
    filterSearch.addEventListener("input", applyFilters);
  }

  if (filterReset) {
    filterReset.addEventListener("click", resetFilters);
  }

  if (kpiMissingBreakCard) {
    kpiMissingBreakCard.addEventListener("click", applyNoBreakFilterShortcut);
    kpiMissingBreakCard.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      applyNoBreakFilterShortcut();
    });
  }

  if (tableBody) {
    tableBody.addEventListener("click", (event) => {
      const row = event.target.closest(".officer-row");
      if (!row) return;
      openDrawer(row.dataset.officerId || "");
    });

    tableBody.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      const row = event.target.closest(".officer-row");
      if (!row) return;
      event.preventDefault();
      openDrawer(row.dataset.officerId || "");
    });
  }

  if (drawerClose) {
    drawerClose.addEventListener("click", closeDrawer);
  }
  if (drawerBackdrop) {
    drawerBackdrop.addEventListener("click", closeDrawer);
  }

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (drawer && drawer.classList.contains("is-visible")) {
      closeDrawer();
    }
  });

  window.addEventListener("storage", (event) => {
    if (event.key === STORAGE_KEY_LIVE_FLIGHTS) {
      rebuildData();
    }
  });
};

const initializeFilters = () => {
  if (filterDate && !filterDate.value) {
    filterDate.value = getLocalDateString();
  }
  syncNoBreakShortcutState();
};

document.addEventListener("DOMContentLoaded", () => {
  initializeFilters();
  bindEvents();
  rebuildData();
});
