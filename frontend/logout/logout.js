const logoutForm = document.querySelector("#op\.logoutForm");
const logoutActions = document.querySelector(".logout-actions");
const signoutButton = document.querySelector(".signout-button");

logoutForm?.addEventListener("submit", (event) => {
  if (event.submitter !== signoutButton) return;
  logoutActions?.classList.add("is-loading");
  if (signoutButton) signoutButton.textContent = "Logging out...";
});
