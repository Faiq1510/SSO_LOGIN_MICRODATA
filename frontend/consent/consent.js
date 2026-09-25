/** @format */

const consentForm = document.querySelector(".consent-form");
const approveButton = document.querySelector(".approve-button");

consentForm?.addEventListener("submit", () => {
  approveButton?.classList.add("is-loading");
  const label = approveButton?.querySelector("span");
  if (label) label.textContent = "Memproses...";
});
