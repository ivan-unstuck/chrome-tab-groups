importScripts("defaults.js");

// ─── Core grouping logic ───

function categorizeTab(url) {
  if (!url) return null;
  for (const [pattern, category] of Object.entries(DOMAIN_MAP)) {
    if (url.includes(pattern)) return category;
  }
  return null;
}

async function getCustomRules() {
  const { customRules } = await chrome.storage.sync.get({ customRules: [] });
  return customRules;
}

async function getSettings() {
  const defaults = {
    aiProvider: "anthropic",
    apiKey: "",
    ungroupUnmatched: false,
    customRules: [],
  };
  return chrome.storage.sync.get(defaults);
}

function categorizeTabWithRules(url, customRules) {
  if (!url) return null;

  // Custom rules take priority (first match wins)
  for (const rule of customRules) {
    if (rule.enabled !== false) {
      for (const pattern of rule.patterns) {
        if (url.includes(pattern)) return rule.group;
      }
    }
  }

  // Fall back to smart defaults
  return categorizeTab(url);
}

async function groupAllTabs() {
  const windows = await chrome.windows.getAll({ windowTypes: ["normal"] });
  const normalWindowIds = new Set(windows.map((w) => w.id));
  const allTabs = await chrome.tabs.query({});
  const normalTabs = allTabs.filter(
    (t) => normalWindowIds.has(t.windowId) && t.url
  );
  const customRules = await getCustomRules();

  // Build category → tabIds map
  const groups = {};
  for (const tab of normalTabs) {
    const category = categorizeTabWithRules(tab.url, customRules);
    if (category) {
      if (!groups[category]) groups[category] = [];
      groups[category].push(tab.id);
    }
  }

  // Remove existing TabFlow groups to avoid duplicates
  const existingGroups = await chrome.tabGroups.query({});
  const managedNames = new Set([
    ...Object.keys(CATEGORY_COLORS),
    ...customRules.map((r) => r.group),
  ]);

  for (const g of existingGroups) {
    if (managedNames.has(g.title)) {
      const tabsInGroup = normalTabs.filter((t) => t.groupId === g.id);
      for (const t of tabsInGroup) {
        try {
          await chrome.tabs.ungroup(t.id);
        } catch {}
      }
    }
  }

  // Create new groups
  const results = { success: [], failed: [] };
  for (const [category, tabIds] of Object.entries(groups)) {
    if (tabIds.length === 0) continue;

    // Group tabs by window (can't group across windows)
    const byWindow = {};
    for (const id of tabIds) {
      try {
        const tab = await chrome.tabs.get(id);
        if (!byWindow[tab.windowId]) byWindow[tab.windowId] = [];
        byWindow[tab.windowId].push(id);
      } catch {}
    }

    for (const [windowId, windowTabIds] of Object.entries(byWindow)) {
      try {
        const groupId = await chrome.tabs.group({ tabIds: windowTabIds });
        const color =
          CATEGORY_COLORS[category] ||
          customRules.find((r) => r.group === category)?.color ||
          "grey";
        await chrome.tabGroups.update(groupId, {
          title: category,
          color: color,
          collapsed: false,
        });
        results.success.push({ category, count: windowTabIds.length });
      } catch (e) {
        results.failed.push({ category, error: e.message });
      }
    }
  }

  return results;
}

// ─── AI categorization ───

async function aiCategorize() {
  const settings = await getSettings();
  if (!settings.apiKey) {
    return { error: "No API key configured. Add one in Settings." };
  }

  const windows = await chrome.windows.getAll({ windowTypes: ["normal"] });
  const normalWindowIds = new Set(windows.map((w) => w.id));
  const allTabs = await chrome.tabs.query({});
  const normalTabs = allTabs.filter(
    (t) => normalWindowIds.has(t.windowId) && t.url
  );

  // Only send uncategorized tabs to AI (save tokens)
  const customRules = await getCustomRules();
  const uncategorized = normalTabs.filter(
    (t) => !categorizeTabWithRules(t.url, customRules)
  );

  if (uncategorized.length === 0) {
    // All tabs already matched by rules — just group them
    return groupAllTabs();
  }

  // Build tab list for AI (domain + title only — no full URLs for privacy)
  const tabList = uncategorized.map((t, i) => {
    try {
      const domain = new URL(t.url).hostname;
      return `${i + 1}. ${domain} — "${t.title}"`;
    } catch {
      return `${i + 1}. ${t.url} — "${t.title}"`;
    }
  });

  const existingCategories = Object.keys(CATEGORY_COLORS).join(", ");

  const prompt = `You organize browser tabs into groups. Given these uncategorized tabs, assign each to a category.

Use one of these existing categories when possible: ${existingCategories}
You may create 1-2 new categories only if a tab truly doesn't fit any existing one.

Tabs:
${tabList.join("\n")}

Respond with ONLY a JSON object mapping tab number to category name. Example: {"1": "Dev", "2": "News"}`;

  try {
    let assignments;

    if (settings.aiProvider === "anthropic") {
      assignments = await callAnthropic(settings.apiKey, prompt);
    } else {
      assignments = await callOpenAI(settings.apiKey, prompt);
    }

    // Apply AI assignments as temporary custom rules
    const newRules = [];
    for (const [idx, category] of Object.entries(assignments)) {
      const tab = uncategorized[parseInt(idx) - 1];
      if (tab) {
        try {
          const domain = new URL(tab.url).hostname;
          const existingRule = newRules.find((r) => r.group === category);
          if (existingRule) {
            if (!existingRule.patterns.includes(domain)) {
              existingRule.patterns.push(domain);
            }
          } else {
            newRules.push({
              group: category,
              patterns: [domain],
              color: CATEGORY_COLORS[category] || "grey",
              enabled: true,
              source: "ai",
            });
          }
        } catch {}
      }
    }

    // Save AI-generated rules
    const current = await getCustomRules();
    const merged = mergeRules(current, newRules);
    await chrome.storage.sync.set({ customRules: merged });

    // Now group everything
    return groupAllTabs();
  } catch (e) {
    return { error: `AI request failed: ${e.message}` };
  }
}

function mergeRules(existing, newRules) {
  const merged = [...existing];
  for (const rule of newRules) {
    const match = merged.find((r) => r.group === rule.group);
    if (match) {
      for (const p of rule.patterns) {
        if (!match.patterns.includes(p)) {
          match.patterns.push(p);
        }
      }
    } else {
      merged.push(rule);
    }
  }
  return merged;
}

async function callAnthropic(apiKey, prompt) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Anthropic API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  const text = data.content[0].text;
  return JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] || "{}");
}

async function callOpenAI(apiKey, prompt) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
}

// ─── Message handling ───

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "groupTabs") {
    groupAllTabs().then(sendResponse);
    return true;
  }
  if (msg.action === "aiGroupTabs") {
    aiCategorize().then(sendResponse);
    return true;
  }
  if (msg.action === "getStats") {
    getTabStats().then(sendResponse);
    return true;
  }
});

async function getTabStats() {
  const allTabs = await chrome.tabs.query({});
  const windows = await chrome.windows.getAll({ windowTypes: ["normal"] });
  const normalWindowIds = new Set(windows.map((w) => w.id));
  const normalTabs = allTabs.filter(
    (t) => normalWindowIds.has(t.windowId) && t.url
  );
  const customRules = await getCustomRules();

  let matched = 0;
  let unmatched = 0;
  for (const tab of normalTabs) {
    if (categorizeTabWithRules(tab.url, customRules)) {
      matched++;
    } else {
      unmatched++;
    }
  }

  return { total: normalTabs.length, matched, unmatched };
}

// ─── Keyboard shortcut ───

chrome.commands.onCommand.addListener((command) => {
  if (command === "group-tabs") {
    groupAllTabs();
  }
});

// ─── Run on install ───

chrome.runtime.onInstalled.addListener(() => {
  groupAllTabs();
});
