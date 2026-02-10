const addRequiredMarker = (card, className, text) => {
  if (!card || card.querySelector(`.${className}`)) return;
  const route = card.querySelector(".runner-route");
  if (!route) return;

  const marker = document.createElement("div");
  marker.className = `runner-required ${className}`;
  marker.textContent = text;
  route.insertAdjacentElement("afterend", marker);
};

const combinedMobileList = document.querySelector("#runner-mobile-list");
if (combinedMobileList) {
  document
    .querySelectorAll(".runner-device-grid .runner-card")
    .forEach((card) => combinedMobileList.appendChild(card));
}

const runnerDeviceControllers = new WeakMap();

document.querySelectorAll(".runner-device").forEach((device) => {
  const tabs = device.querySelectorAll(".runner-tab");
  const cards = device.querySelectorAll(".runner-card");
  const list = device.querySelector(".runner-list");
  let emptyState = null;
  if (list) {
    emptyState = list.querySelector(".runner-empty-state");
    if (!emptyState) {
      emptyState = document.createElement("div");
      emptyState.className = "runner-empty-state is-hidden";
      emptyState.setAttribute("aria-live", "polite");
      list.appendChild(emptyState);
    }
  }

  const setRunnerTab = (tab) => {
    tabs.forEach((item) => {
      const isActive = item === tab;
      item.classList.toggle("is-active", isActive);
      item.setAttribute("aria-selected", isActive ? "true" : "false");
    });

    const status = tab?.dataset.status || "assigned";
    let visibleCards = 0;
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

  runnerDeviceControllers.set(device, { refreshCurrentTab });

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => setRunnerTab(tab));
  });

  const activeTab = device.querySelector(".runner-tab.is-active") || tabs[0];
  if (activeTab) {
    setRunnerTab(activeTab);
  }

  const eligibleCards = Array.from(cards).filter(
    (card) => card.dataset.status === "assigned"
  );
  if (eligibleCards.length > 0) {
    const randomCard =
      eligibleCards[Math.floor(Math.random() * eligibleCards.length)];
    addRequiredMarker(randomCard, "runner-pull-required", "Pull Team required");
    addRequiredMarker(
      randomCard,
      "runner-close-gate-required",
      "Close Gate required"
    );
  }
});

const modal = document.querySelector("#runner-modal");
const modalBackdrop = document.querySelector("#runner-modal-backdrop");
const modalClose = document.querySelector("#runner-modal-close");
const modalGate = document.querySelector("#runner-modal-gate");
const modalReporting = document.querySelector("#runner-modal-reporting");
const modalFlight = document.querySelector("#runner-modal-flight");
const modalOpening = document.querySelector("#runner-modal-opening");
const modalRemarks = document.querySelector("#runner-modal-remarks");
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
  const time = card.querySelector(".runner-time-block")?.textContent.trim() || "--";
  const gate =
    card.querySelector(".runner-gate")?.textContent.trim() ||
    card.querySelector(".runner-gate-change .to")?.textContent.trim() ||
    "--";
  const flight = card.querySelector(".runner-flight")?.textContent.trim() || "--";
  return { time, gate, flight };
};

const getCardRemarks = (card) => (card ? String(card.dataset.remarks || "") : "");

const isCardCompleted = (card) => card?.dataset.status === "completed";

const parseTimeToMinutes = (timeText) => {
  const match = /^(\d{1,2}):(\d{2})$/.exec(timeText);
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

const offsetTime = (timeText, deltaMinutes) => {
  const minutes = parseTimeToMinutes(timeText);
  if (minutes === null) return null;
  return minutes + deltaMinutes;
};

const formatGateLabel = (gateText) => {
  const cleaned = String(gateText || "").replace(/^gate\s*/i, "").trim();
  return cleaned ? `Gate ${cleaned}` : "Gate --";
};

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

const setModalFields = (details) => {
  if (modalGate) {
    modalGate.textContent = details.gate;
  }
  if (modalReporting) {
    modalReporting.textContent = formatMinutesAsHrs(offsetTime(details.time, 0));
  }
  if (modalFlight) {
    modalFlight.textContent = details.flight;
  }
  if (modalOpening) {
    modalOpening.textContent = formatMinutesAsHrs(offsetTime(details.time, 20));
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

const moveCardToCompleted = (card) => {
  if (!card) return;
  card.dataset.status = "completed";
  const device = card.closest(".runner-device");
  const controller = device ? runnerDeviceControllers.get(device) : null;
  if (controller) {
    controller.refreshCurrentTab();
  }
};

const saveModalRemarksToCard = () => {
  if (!activeCard || !modalRemarks) return;
  const text = modalRemarks.value.trim();
  if (text) {
    activeCard.dataset.remarks = text;
    return;
  }
  delete activeCard.dataset.remarks;
};

const setModalSaveState = (saved) => {
  if (!modalSaveButton) return;
  modalSaveButton.classList.toggle("is-saved", saved);
  modalSaveButton.textContent = saved ? "Remarks Saved" : "Save Remarks";
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
          (member) =>
            `<li><span>${member.id} ${member.name}</span><span>&check;</span></li>`
        )
        .join("")
    : "<li><span>No close gate officers</span><span>-</span></li>";
};

const setActionSummary = (details) => {
  if (actionGate) actionGate.textContent = formatGateLabel(details.gate);
  if (actionReporting) {
    actionReporting.textContent = formatMinutesAsHrs(offsetTime(details.time, 0));
  }
  if (actionFlight) actionFlight.textContent = details.flight || "--";
  if (actionOpening) {
    actionOpening.textContent = formatMinutesAsHrs(offsetTime(details.time, 20));
  }
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
    if (actionPrevGate) actionPrevGate.textContent = formatGateLabel(details.gate);
    if (actionPrevFlight) actionPrevFlight.textContent = details.flight || "-";
    if (actionPrevEtd) actionPrevEtd.textContent = details.time || "-";
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

document.querySelectorAll(".runner-card").forEach((card) => {
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
});

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
    const cardToComplete = activeCard;
    moveCardToCompleted(cardToComplete);
    closeModal();
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
