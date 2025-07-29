// popup.js
let isDemo = false;

document.addEventListener("DOMContentLoaded", async () => {
  const themeToggle = document.getElementById("themeToggle");
  const body = document.documentElement;
  themeToggle.addEventListener("change", () => {
    const theme = themeToggle.checked ? "light" : "dark";
    body.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  });

  const savedTheme = localStorage.getItem("theme") || "dark";
  themeToggle.checked = savedTheme === "light";
  body.setAttribute("data-theme", savedTheme);

  document.getElementById("isDemo").addEventListener("change", (e) => {
    isDemo = e.target.checked;
  });

  document.getElementById("startCleanup").addEventListener("click", () => {
    chrome.runtime.sendMessage({ action: "cleanup", demo: isDemo });
  });

  document.getElementById("upgradeBtn").addEventListener("click", () => {
    chrome.runtime.sendMessage({ action: "upgrade" });
  });

  chrome.runtime.sendMessage({ action: "getPlan" }, (res) => {
    document.getElementById("status").innerText = res.plan;
    document.getElementById("remaining").innerText = res.remaining;
  });

  chrome.runtime.sendMessage({ action: "getAccounts" }, (res) => {
    const sel = document.getElementById("accountSelector");
    res.accounts.forEach(acc => {
      const opt = document.createElement("option");
      opt.value = acc.id;
      opt.innerText = acc.email;
      sel.appendChild(opt);
    });
  });

  chrome.runtime.sendMessage({ action: "getUndoList" }, (res) => {
    const list = document.getElementById("undoList");
    res.forEach(item => {
      const li = document.createElement("li");
      li.innerText = item;
      list.appendChild(li);
    });
  });
});
