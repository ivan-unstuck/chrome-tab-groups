// ─── DOM refs ───
const groupBtn = document.getElementById("groupBtn");
const aiGroupBtn = document.getElementById("aiGroupBtn");
const statusEl = document.getElementById("status");
const statsEl = document.getElementById("stats");
const rulesList = document.getElementById("rulesList");
const rulesCount = document.getElementById("rulesCount");
const addRuleBtn = document.getElementById("addRuleBtn");
const ruleForm = document.getElementById("ruleForm");
const saveRuleBtn = document.getElementById("saveRuleBtn");
const cancelRuleBtn = document.getElementById("cancelRuleBtn");
const saveSettingsBtn = document.getElementById("saveSettingsBtn");
const settingsStatus = document.getElementById("settingsStatus");

let editingIndex = -1;

// ─── Init ───
document.addEventListener("DOMContentLoaded", () => {
  loadStats();
  loadRules();
  loadSettings();
});

// ─── Tab switching ───
document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach((c) => c.classList.remove("active"));
    tab.classList.add("active");
    document.getElementById(`tab-${tab.dataset.tab}`).classList.add("active");
  });
});

// ─── Stats ───
async function loadStats() {
  chrome.runtime.sendMessage({ action: "getStats" }, (stats) => {
    if (stats) {
      statsEl.textContent = `${stats.total} tabs \u00b7 ${stats.matched} matched \u00b7 ${stats.unmatched} unmatched`;
    }
  });
}

// ─── Group buttons ───
groupBtn.addEventListener("click", async () => {
  showStatus("Grouping tabs...", "loading");
  groupBtn.disabled = true;
  chrome.runtime.sendMessage({ action: "groupTabs" }, (result) => {
    groupBtn.disabled = false;
    if (result?.success) {
      const total = result.success.reduce((s, g) => s + g.count, 0);
      const groups = result.success.length;
      showStatus(`Grouped ${total} tabs into ${groups} groups`, "success");
    } else if (result?.error) {
      showStatus(result.error, "error");
    }
    loadStats();
  });
});

aiGroupBtn.addEventListener("click", async () => {
  showStatus("AI is analyzing your tabs...", "loading");
  aiGroupBtn.disabled = true;
  chrome.runtime.sendMessage({ action: "aiGroupTabs" }, (result) => {
    aiGroupBtn.disabled = false;
    if (result?.error) {
      showStatus(result.error, "error");
    } else if (result?.success) {
      const total = result.success.reduce((s, g) => s + g.count, 0);
      const groups = result.success.length;
      showStatus(`AI grouped ${total} tabs into ${groups} groups`, "success");
      loadRules();
    }
    loadStats();
  });
});

function showStatus(msg, type) {
  statusEl.textContent = msg;
  statusEl.className = `status ${type}`;
  statusEl.classList.remove("hidden");
  if (type !== "loading") {
    setTimeout(() => statusEl.classList.add("hidden"), 4000);
  }
}

// ─── Rules ───

function createRuleElement(rule, index) {
  const el = document.createElement("div");
  el.className = "rule-item";

  const infoDiv = document.createElement("div");
  infoDiv.className = "rule-info";

  const nameDiv = document.createElement("div");
  nameDiv.className = "rule-name";

  const dot = document.createElement("span");
  dot.className = `color-dot color-${rule.color || "grey"}`;
  nameDiv.appendChild(dot);

  const nameText = document.createTextNode(` ${rule.group} `);
  nameDiv.appendChild(nameText);

  if (rule.source === "ai") {
    const badge = document.createElement("span");
    badge.className = "rule-source";
    badge.textContent = "AI";
    nameDiv.appendChild(badge);
  }

  const patternsDiv = document.createElement("div");
  patternsDiv.className = "rule-patterns";
  patternsDiv.textContent = rule.patterns.join(", ");

  infoDiv.appendChild(nameDiv);
  infoDiv.appendChild(patternsDiv);

  const actionsDiv = document.createElement("div");
  actionsDiv.className = "rule-actions";

  const editBtn = document.createElement("button");
  editBtn.textContent = "\u270F\uFE0F";
  editBtn.title = "Edit";
  editBtn.addEventListener("click", () => editRule(index));

  const deleteBtn = document.createElement("button");
  deleteBtn.textContent = "\uD83D\uDDD1\uFE0F";
  deleteBtn.title = "Delete";
  deleteBtn.addEventListener("click", () => deleteRule(index));

  actionsDiv.appendChild(editBtn);
  actionsDiv.appendChild(deleteBtn);

  el.appendChild(infoDiv);
  el.appendChild(actionsDiv);

  return el;
}

async function loadRules() {
  const { customRules } = await chrome.storage.sync.get({ customRules: [] });
  rulesCount.textContent = `${customRules.length} custom rule${customRules.length !== 1 ? "s" : ""}`;

  // Clear existing children
  while (rulesList.firstChild) {
    rulesList.removeChild(rulesList.firstChild);
  }

  if (customRules.length === 0) {
    const emptyMsg = document.createElement("div");
    emptyMsg.style.cssText = "color:#666;font-size:12px;text-align:center;padding:12px;";
    emptyMsg.textContent = "No custom rules yet. Smart defaults handle 200+ domains automatically.";
    rulesList.appendChild(emptyMsg);
    return;
  }

  customRules.forEach((rule, i) => {
    rulesList.appendChild(createRuleElement(rule, i));
  });
}

addRuleBtn.addEventListener("click", () => {
  editingIndex = -1;
  document.getElementById("ruleGroup").value = "";
  document.getElementById("rulePatterns").value = "";
  document.getElementById("ruleColor").value = "grey";
  ruleForm.classList.remove("hidden");
});

cancelRuleBtn.addEventListener("click", () => {
  ruleForm.classList.add("hidden");
});

saveRuleBtn.addEventListener("click", async () => {
  const group = document.getElementById("ruleGroup").value.trim();
  const patternsStr = document.getElementById("rulePatterns").value.trim();
  const color = document.getElementById("ruleColor").value;

  if (!group || !patternsStr) return;

  const patterns = patternsStr.split(",").map((p) => p.trim()).filter(Boolean);
  const { customRules } = await chrome.storage.sync.get({ customRules: [] });

  if (editingIndex >= 0) {
    customRules[editingIndex] = { ...customRules[editingIndex], group, patterns, color };
  } else {
    customRules.push({ group, patterns, color, enabled: true });
  }

  await chrome.storage.sync.set({ customRules });
  ruleForm.classList.add("hidden");
  loadRules();
});

async function editRule(index) {
  const { customRules } = await chrome.storage.sync.get({ customRules: [] });
  const rule = customRules[index];
  if (!rule) return;

  editingIndex = index;
  document.getElementById("ruleGroup").value = rule.group;
  document.getElementById("rulePatterns").value = rule.patterns.join(", ");
  document.getElementById("ruleColor").value = rule.color || "grey";
  ruleForm.classList.remove("hidden");
}

async function deleteRule(index) {
  const { customRules } = await chrome.storage.sync.get({ customRules: [] });
  customRules.splice(index, 1);
  await chrome.storage.sync.set({ customRules });
  loadRules();
}

// ─── Settings ───
async function loadSettings() {
  const settings = await chrome.storage.sync.get({
    aiProvider: "anthropic",
    apiKey: "",
  });
  document.getElementById("aiProvider").value = settings.aiProvider;
  document.getElementById("apiKey").value = settings.apiKey;

  if (!settings.apiKey) {
    aiGroupBtn.title = "Configure API key in Settings first";
  }
}

saveSettingsBtn.addEventListener("click", async () => {
  const aiProvider = document.getElementById("aiProvider").value;
  const apiKey = document.getElementById("apiKey").value.trim();

  await chrome.storage.sync.set({ aiProvider, apiKey });

  settingsStatus.textContent = "Settings saved";
  settingsStatus.className = "status success";
  settingsStatus.classList.remove("hidden");
  setTimeout(() => settingsStatus.classList.add("hidden"), 2000);

  if (apiKey) {
    aiGroupBtn.title = "Uses AI to categorize unmatched tabs";
  } else {
    aiGroupBtn.title = "Configure API key in Settings first";
  }
});
