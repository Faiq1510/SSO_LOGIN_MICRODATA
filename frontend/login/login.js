/** @format */

const form = document.querySelector(".login-form");
const passwordInput = document.querySelector("#password");
const passwordToggle = document.querySelector(".password-toggle");
const submitButton = document.querySelector(".submit-button");
const usernameInput = document.querySelector("#username");

passwordToggle?.addEventListener("click", () => {
  const isVisible = passwordInput.type === "text";
  passwordInput.type = isVisible ? "password" : "text";
  passwordToggle.textContent = isVisible ? "Lihat" : "Sembunyikan";
  passwordToggle.setAttribute("aria-pressed", String(!isVisible));
  passwordToggle.setAttribute(
    "aria-label",
    isVisible ? "Tampilkan password" : "Sembunyikan password",
  );
});

[usernameInput, passwordInput].forEach((input) => {
  input?.addEventListener("input", () => {
    input
      .closest(".input-wrap")
      ?.classList.toggle("has-value", Boolean(input.value));
  });
});

form?.addEventListener("submit", () => {
  submitButton?.classList.add("is-loading");
  const label = submitButton?.querySelector(".button-label");
  if (label) label.textContent = "Memverifikasi...";
});
