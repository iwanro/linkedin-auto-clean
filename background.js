// background.js
let JWT = null;

chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create("scheduledCleanup", {
    when: Date.now(),
    periodInMinutes: 7 * 24 * 60
  });
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "scheduledCleanup") {
    chrome.tabs.query({ url: "*://www.linkedin.com/*" }, (tabs) => {
      tabs.forEach(tab => {
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => window.postMessage({ action: "autoCleanup" }, "*")
        });
      });
    });
  }
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  switch (msg.action) {
    case "getPlan":
      fetch("https://YOUR_API.com/v1/plan", {
        headers: { Authorization: `Bearer ${JWT || ""}` }
      })
        .then(res => res.json())
        .then(sendResponse);
      return true;
    case "cleanup":
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          func: () => window.postMessage({ action: "cleanupNow", demo: msg.demo }, "*")
        });
      });
      break;
    case "getAccounts":
      // Dummy data
      sendResponse({ accounts: [{ id: "1", email: "user@example.com" }] });
      break;
    case "getUndoList":
      sendResponse(["Message 1", "Message 2"]);
      break;
    case "upgrade":
      fetch("https://YOUR_API.com/v1/billing/checkout")
        .then(res => res.json())
        .then(data => {
          JWT = data.jwt;
        });
      break;
  }
});
