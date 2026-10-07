const loginScreen = document.getElementById("loginScreen");
const appEl = document.getElementById("app");
const OFFLINE_SESSION_KEY = "microdata.sso.offline-session";
const OFFLINE_SESSION_DURATION = 8 * 60 * 60 * 1000;
const OFFLINE_USERS_KEY = "microdata.sso.offline-users";
const OFFLINE_CLIENTS_KEY = "microdata.sso.offline-clients";

function showApp(username) {
  loginScreen.classList.add("hidden");
  appEl.classList.remove("hidden");
  document.getElementById("whoAmI").textContent = username;
  document.getElementById("accountAvatar").textContent = username
    .charAt(0)
    .toUpperCase();
  loadUsers();
  loadClients();
}
function showLogin() {
  appEl.classList.add("hidden");
  loginScreen.classList.remove("hidden");
}

function saveOfflineSession(username) {
  const now = Date.now();

  localStorage.setItem(
    OFFLINE_SESSION_KEY,
    JSON.stringify({
      username,
      authenticatedAt: now,
      expiresAt: now + OFFLINE_SESSION_DURATION,
    }),
  );
}

function getOfflineSession() {
  try {
    const rawSession = localStorage.getItem(OFFLINE_SESSION_KEY);
    if (!rawSession) return null;

    const session = JSON.parse(rawSession);

    if (
      !session.username ||
      !Number.isFinite(session.expiresAt) ||
      session.expiresAt <= Date.now()
    ) {
      localStorage.removeItem(OFFLINE_SESSION_KEY);
      return null;
    }

    return session;
  } catch {
    localStorage.removeItem(OFFLINE_SESSION_KEY);
    return null;
  }
}

function saveOfflineData(key, data) {
  localStorage.setItem(
    key,
    JSON.stringify({
      data,
      cachedAt: Date.now(),
    }),
  );
}

function getOfflineData(key) {
  try {
    const cached = JSON.parse(localStorage.getItem(key));
    if (!Array.isArray(cached?.data)) return null;
    return cached;
  } catch {
    localStorage.removeItem(key);
    return null;
  }
}

function setOfflineControlsDisabled(disabled) {
  document
    .querySelectorAll("#userForm input, #userForm button, .btn-danger")
    .forEach((control) => {
      control.disabled = disabled;
    });
}

document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target;
  const body = Object.fromEntries(new FormData(form).entries());
  const errorBox = document.getElementById("loginError");
  errorBox.classList.remove("show");
  try {
    const res = await fetch("/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Login gagal");
    form.reset();
    saveOfflineSession(data.username);
    showApp(data.username);
  } catch (err) {
    errorBox.textContent = navigator.onLine
      ? err.message
      : "Tidak ada koneksi internet";
    errorBox.classList.add("show");
  }
});

document.getElementById("logoutBtn").addEventListener("click", async () => {
  if (navigator.onLine) {
    await fetch("/admin/logout", { method: "POST" });
  }

  localStorage.removeItem(OFFLINE_SESSION_KEY);
  showLogin();
});

function showBanner(id, message, isError = true) {
  const el = document.getElementById(id);
  el.querySelector(".msg").textContent = message;
  el.classList.add("show");
  if (!isError) el.classList.remove("error");
}
function hideBanner(id) {
  document.getElementById(id).classList.remove("show");
}

async function api(path, options = {}) {
  let response;

  try {
    response = await fetch(path, {
      ...options,
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
    });
  } catch (error) {
    if (!navigator.onLine) {
      throw new Error("Koneksi internet diperlukan untuk memuat data.");
    }

    throw error;
  }

  if (response.status === 401) {
    showLogin();
    throw new Error("Sesi berakhir, silakan login lagi.");
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `Request gagal (${response.status})`);
  }

  return data;
}

document.querySelectorAll("nav button").forEach((btn) => {
  btn.addEventListener("click", () => {
    document
      .querySelectorAll("nav button")
      .forEach((b) => b.classList.remove("active"));
    document
      .querySelectorAll(".view")
      .forEach((v) => v.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById("view-" + btn.dataset.view).classList.add("active");
  });
});

async function loadUsers() {
  hideBanner("userBanner");

  let users;

  if (!navigator.onLine) {
    const cached = getOfflineData(OFFLINE_USERS_KEY);
    users = cached?.data;

    if (!users) {
      showBanner("userBanner", "Belum ada cache data user di perangkat.");
      renderUsers([]);
      setOfflineControlsDisabled(true);
      return;
    }

    showBanner(
      "userBanner",
      `Mode offline. Data terakhir disimpan ${new Date(
        cached.cachedAt,
      ).toLocaleString()}.`,
      false,
    );
  } else {
    try {
      ({ users } = await api("/admin/users"));
      saveOfflineData(OFFLINE_USERS_KEY, users);
    } catch (err) {
      showBanner("userBanner", err.message);
      return;
    }
  }

  renderUsers(users);
  setOfflineControlsDisabled(!navigator.onLine);
}

function renderUsers(users) {
  const rows = document.getElementById("userRows");
  rows.innerHTML = "";

  document.getElementById("userEmpty").style.display = users.length
    ? "none"
    : "block";

  for (const u of users) {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td class="mono">${u.id}</td>
      <td>${u.username}</td>
      <td>${u.name ?? ""}</td>
      <td>${u.email ?? ""}</td>
      <td class="mono">${new Date(u.created_at).toLocaleDateString()}</td>
      <td>
        <button class="btn btn-danger" data-id="${u.id}">
          Hapus
        </button>
      </td>
    `;

    tr.querySelector("button").addEventListener("click", () =>
      deleteUser(u.id),
    );

    rows.appendChild(tr);
  }
}

document.getElementById("userForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target;
  const body = Object.fromEntries(new FormData(form).entries());
  try {
    await api("/admin/users", {
      method: "POST",
      body: JSON.stringify(body),
    });
    form.reset();
    loadUsers();
  } catch (err) {
    showBanner("userBanner", err.message);
  }
});

async function deleteUser(id) {
  if (!confirm("Hapus user ini?")) return;
  try {
    await api(`/admin/users/${id}`, { method: "DELETE" });
    loadUsers();
  } catch (err) {
    showBanner("userBanner", err.message);
  }
}

async function loadClients() {
  hideBanner("clientBanner");

  let clients;

  if (!navigator.onLine) {
    const cached = getOfflineData(OFFLINE_CLIENTS_KEY);
    clients = cached?.data;

    if (!clients) {
      showBanner("clientBanner", "Belum ada cache data client di perangkat.");
      renderClients([]);
      setOfflineControlsDisabled(true);
      return;
    }

    showBanner(
      "clientBanner",
      `Mode offline. Data terakhir disimpan ${new Date(
        cached.cachedAt,
      ).toLocaleString()}.`,
      false,
    );
  } else {
    try {
      ({ clients } = await api("/admin/clients"));
      saveOfflineData(OFFLINE_CLIENTS_KEY, clients);
    } catch (err) {
      showBanner("clientBanner", err.message);
      return;
    }
  }

  renderClients(clients);
  setOfflineControlsDisabled(!navigator.onLine);
}

function renderClients(clients) {
  const rows = document.getElementById("clientRows");
  rows.innerHTML = "";

  document.getElementById("clientEmpty").style.display = clients.length
    ? "none"
    : "block";

  for (const c of clients) {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td class="mono">${c.client_id}</td>
      <td>${c.name ?? ""}</td>
      <td class="mono">${c.redirect_uri}</td>
      <td class="mono">${new Date(c.created_at).toLocaleDateString()}</td>
      <td>
        <button class="btn btn-danger" data-id="${c.client_id}">
          Hapus
        </button>
      </td>
    `;

    tr.querySelector("button").addEventListener("click", () =>
      deleteClient(c.client_id),
    );

    rows.appendChild(tr);
  }
}

async function deleteClient(clientId) {
  if (!confirm(`Hapus client "${clientId}"?`)) return;
  try {
    await api(`/admin/clients/${clientId}`, { method: "DELETE" });
    loadClients();
  } catch (err) {
    showBanner("clientBanner", err.message);
  }
}

async function checkAuth() {
  if (!navigator.onLine) {
    const offlineSession = getOfflineSession();

    if (offlineSession) {
      showApp(offlineSession.username);
      return;
    }

    showLogin();
    return;
  }

  try {
    const res = await fetch("/admin/me");

    if (!res.ok) {
      showLogin();
      return;
    }

    const data = await res.json();
    saveOfflineSession(data.username);
    showApp(data.username);
  } catch {
    const offlineSession = getOfflineSession();

    if (offlineSession) {
      showApp(offlineSession.username);
      return;
    }

    showLogin();
  }
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/service-worker.js")
      .then((registration) => {
        console.log("Service worker terdaftar:", registration.scope);
      })
      .catch((error) => {
        console.error("Service worker gagal didaftarkan:", error);
      });
  });
}

checkAuth();
