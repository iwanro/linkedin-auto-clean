// content.js
window.addEventListener("message", async (e) => {
  const { action, demo } = e.data;
  if (action === "cleanupNow" || action === "autoCleanup") {
    const messages = [...document.querySelectorAll(".msg-conversation-listitem")];
    for (let msg of messages) {
      const text = msg.innerText;
      const response = await fetch("https://YOUR_API.com/v1/rate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text })
      });
      const { score, remaining } = await response.json();
      if (score < 40 && !demo) msg.remove();
    }
  }
});
