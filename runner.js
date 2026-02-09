document.querySelectorAll(".runner-device").forEach((device) => {
  const tabs = device.querySelectorAll(".runner-tab");
  const cards = device.querySelectorAll(".runner-card");

  const setRunnerTab = (tab) => {
    tabs.forEach((item) => {
      const isActive = item === tab;
      item.classList.toggle("is-active", isActive);
      item.setAttribute("aria-selected", isActive ? "true" : "false");
    });

    const status = tab?.dataset.status || "assigned";
    cards.forEach((card) => {
      const matches = card.dataset.status === status;
      card.classList.toggle("is-hidden", !matches);
    });
  };

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => setRunnerTab(tab));
  });

  const activeTab = device.querySelector(".runner-tab.is-active") || tabs[0];
  if (activeTab) {
    setRunnerTab(activeTab);
  }
});

const modal = document.querySelector("#runner-modal");
const modalBackdrop = document.querySelector("#runner-modal-backdrop");
const modalClose = document.querySelector("#runner-modal-close");
const modalSave = document.querySelector("#runner-modal-save");
const modalTime = document.querySelector("#runner-modal-time");
const modalGate = document.querySelector("#runner-modal-gate");
const modalFlight = document.querySelector("#runner-modal-flight");
const modalRoute = document.querySelector("#runner-modal-route");
const modalStatus = document.querySelector("#runner-modal-status");
const modalChange = document.querySelector("#runner-modal-change");
const modalRemarks = document.querySelector("#runner-modal-remarks");

let activeCard = null;

const getCardDetails = (card) => {
  const time = card.querySelector(".runner-time-block")?.textContent.trim() || "--";
  const gate = card.querySelector(".runner-gate")?.textContent.trim() || "--";
  const flight = card.querySelector(".runner-flight")?.textContent.trim() || "--";
  const route = card.querySelector(".runner-route")?.textContent.trim() || "--";
  const status = card.querySelector(".runner-gate-alert")?.textContent.trim() || "ASSIGNED";
  const changeEl = card.querySelector(".runner-gate-change");
  let change = "--";
  if (changeEl) {
    change = changeEl.textContent.replace(/\s+/g, " ").trim();
  }
  return { time, gate, flight, route, status, change };
};

const getRemarkKey = (details) =>
  `runner-remark:${details.flight}|${details.time}|${details.gate}`;

const openModal = (card) => {
  if (!modal || !modalBackdrop) return;
  activeCard = card;
  const details = getCardDetails(card);
  modalTime.textContent = details.time;
  modalGate.textContent = details.gate;
  modalFlight.textContent = details.flight;
  modalRoute.textContent = details.route;
  modalStatus.textContent = details.status;
  modalChange.textContent = details.change;
  const stored = localStorage.getItem(getRemarkKey(details)) || "";
  modalRemarks.value = stored;
  modalBackdrop.classList.add("is-visible");
  modal.classList.add("is-visible");
  modalRemarks.focus();
};

const closeModal = () => {
  if (!modal || !modalBackdrop) return;
  modalBackdrop.classList.remove("is-visible");
  modal.classList.remove("is-visible");
  activeCard = null;
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
  modalClose.addEventListener("click", closeModal);
}

if (modalBackdrop) {
  modalBackdrop.addEventListener("click", closeModal);
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeModal();
});

if (modalSave) {
  modalSave.addEventListener("click", () => {
    if (!activeCard) return;
    const details = getCardDetails(activeCard);
    localStorage.setItem(getRemarkKey(details), modalRemarks.value.trim());
    closeModal();
  });
}
