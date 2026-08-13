/* =========================================================
   KILAUBOT — FRONT-END APP
   - Name popup
   - Custom chat UI
   - New chat
   - Previous chat history
   - Local browser storage
   - Story "Ask Kilaubot" buttons
   ========================================================= */

const STORAGE = {
  name: "kilaubot_user_name_v2",
  chats: "kilaubot_chats_v2",
  activeChatId: "kilaubot_active_chat_v2"
};

const state = {
  name: "",
  chats: [],
  activeChatId: null,
  sending: false
};

const elements = {
  welcomeOverlay: document.getElementById("welcomeOverlay"),
  nameForm: document.getElementById("nameForm"),
  nameInput: document.getElementById("nameInput"),
  changeNameButton: document.getElementById("changeNameButton"),
  profileName: document.getElementById("profileName"),
  profileAvatar: document.getElementById("profileAvatar"),

  newChatButton: document.getElementById("newChatButton"),
  clearHistoryButton: document.getElementById("clearHistoryButton"),
  chatHistoryList: document.getElementById("chatHistoryList"),

  messages: document.getElementById("messages"),
  typingIndicator: document.getElementById("typingIndicator"),
  suggestionRow: document.getElementById("suggestionRow"),
  chatForm: document.getElementById("chatForm"),
  messageInput: document.getElementById("messageInput"),
  sendButton: document.getElementById("sendButton"),

  appSidebar: document.getElementById("appSidebar"),
  mobileMenuButton: document.getElementById("mobileMenuButton"),
  toast: document.getElementById("toast")
};

/* -------------------------
   Utilities
   ------------------------- */

function cleanName(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 40);
}

function createId(prefix = "id") {
  const random = Math.random().toString(36).slice(2, 10);
  const time = Date.now().toString(36);
  return `${prefix}-${time}-${random}`.slice(0, 36);
}

function formatTime(timestamp) {
  return new Intl.DateTimeFormat([], {
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(timestamp));
}

function formatChatDate(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();

  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  if (sameDay) return "Today";

  return new Intl.DateTimeFormat([], {
    month: "short",
    day: "numeric"
  }).format(date);
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("show");

  clearTimeout(showToast.timeout);
  showToast.timeout = setTimeout(() => {
    elements.toast.classList.remove("show");
  }, 2600);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* -------------------------
   Storage
   ------------------------- */

function loadStoredData() {
  state.name = cleanName(localStorage.getItem(STORAGE.name));

  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE.chats) || "[]");
    state.chats = Array.isArray(parsed) ? parsed : [];
  } catch {
    state.chats = [];
  }

  state.activeChatId = localStorage.getItem(STORAGE.activeChatId);

  if (
    !state.activeChatId ||
    !state.chats.some((chat) => chat.id === state.activeChatId)
  ) {
    state.activeChatId = state.chats[0]?.id || null;
  }
}

function saveChats() {
  state.chats.sort((a, b) => {
    const pinnedDifference = Number(Boolean(b.pinned)) - Number(Boolean(a.pinned));

    if (pinnedDifference !== 0) {
      return pinnedDifference;
    }

    return b.updatedAt - a.updatedAt;
  });

  localStorage.setItem(STORAGE.chats, JSON.stringify(state.chats));

  if (state.activeChatId) {
    localStorage.setItem(STORAGE.activeChatId, state.activeChatId);
  } else {
    localStorage.removeItem(STORAGE.activeChatId);
  }
}

/* -------------------------
   User name
   ------------------------- */

function applyUserName(name) {
  const clean = cleanName(name);
  if (!clean) return;

  state.name = clean;
  localStorage.setItem(STORAGE.name, clean);

  elements.profileName.textContent = clean;
  elements.profileAvatar.textContent = clean.charAt(0).toUpperCase();

  elements.welcomeOverlay.classList.remove("show");
  elements.welcomeOverlay.setAttribute("aria-hidden", "true");

  renderMessages();
}

function openNamePopup() {
  elements.nameInput.value = state.name;
  elements.welcomeOverlay.classList.add("show");
  elements.welcomeOverlay.setAttribute("aria-hidden", "false");

  setTimeout(() => elements.nameInput.focus(), 80);
}

/* -------------------------
   Chat model
   ------------------------- */

function createChat() {
  const now = Date.now();

  const chat = {
    id: createId("chat"),
    sessionId: createId("web"),
    title: "New conversation",
    pinned: false,
    createdAt: now,
    updatedAt: now,
    messages: []
  };

  state.chats.unshift(chat);
  state.activeChatId = chat.id;

  saveChats();
  renderHistory();
  renderMessages();

  elements.messageInput.focus();

  return chat;
}

function getActiveChat() {
  return state.chats.find((chat) => chat.id === state.activeChatId) || null;
}

function switchChat(chatId) {
  if (!state.chats.some((chat) => chat.id === chatId)) return;

  state.activeChatId = chatId;
  saveChats();

  renderHistory();
  renderMessages();

  elements.appSidebar.classList.remove("open");
}
function closeHistoryMenus() {
  document
    .querySelectorAll(".history-options-menu.show")
    .forEach((menu) => menu.classList.remove("show"));
}

function togglePinChat(chatId) {
  const chat = state.chats.find((chat) => chat.id === chatId);

  if (!chat) return;

  chat.pinned = !Boolean(chat.pinned);

  saveChats();
  renderHistory();

  showToast(chat.pinned ? "Chat pinned" : "Chat unpinned");
}

function renameChat(chatId) {
  const chat = state.chats.find((chat) => chat.id === chatId);

  if (!chat) return;

  const newTitle = window.prompt("Rename this chat:", chat.title);

  if (newTitle === null) return;

  const cleanTitle = String(newTitle)
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 40);

  if (!cleanTitle) {
    showToast("Chat name cannot be empty");
    return;
  }

  chat.title = cleanTitle;

  saveChats();
  renderHistory();

  showToast("Chat renamed");
}

function deleteChat(chatId) {
  const chat = state.chats.find((chat) => chat.id === chatId);

  if (!chat) return;

  const okay = window.confirm(`Delete "${chat.title}"?`);

  if (!okay) return;

  const deletingActiveChat = state.activeChatId === chatId;

  state.chats = state.chats.filter((chat) => chat.id !== chatId);

  if (deletingActiveChat) {
    state.activeChatId = null;
  }

  saveChats();

  if (!state.chats.length) {
    createChat();
  } else {
    if (!state.activeChatId) {
      state.activeChatId = state.chats[0].id;
      saveChats();
    }

    renderHistory();
    renderMessages();
  }

  showToast("Chat deleted");
}

function titleFromMessage(message) {
  const clean = message.trim().replace(/\s+/g, " ");
  return clean.length > 32 ? `${clean.slice(0, 32)}…` : clean;
}

function addMessage(role, text) {
  let chat = getActiveChat();

  if (!chat) {
    chat = createChat();
  }

  const now = Date.now();

  chat.messages.push({
    id: createId("msg"),
    role,
    text,
    createdAt: now
  });

  if (
    role === "user" &&
    (chat.title === "New conversation" || chat.messages.length <= 2)
  ) {
    chat.title = titleFromMessage(text);
  }

  chat.updatedAt = now;

  saveChats();
  renderHistory();
  renderMessages();

  return chat;
}

/* -------------------------
   Render history
   ------------------------- */
function renderHistory() {
  if (!state.chats.length) {
    elements.chatHistoryList.innerHTML = `
      <div class="history-empty">
        Your conversations will appear here after you start chatting.
      </div>
    `;
    return;
  }

  elements.chatHistoryList.innerHTML = state.chats
    .map((chat) => {
      const isActive = chat.id === state.activeChatId ? "active" : "";
      const pinLabel = chat.pinned ? "Unpin" : "Pin";
      const historyIcon = chat.pinned ? "📌" : "◌";

      return `
        <div class="history-item-wrapper">
          <button
            class="history-item ${isActive}"
            type="button"
            data-chat-id="${escapeHtml(chat.id)}"
            title="${escapeHtml(chat.title)}"
          >
            <span class="history-item-icon">${historyIcon}</span>

            <span class="history-item-copy">
              <strong>${escapeHtml(chat.title)}</strong>
              <small>${escapeHtml(formatChatDate(chat.updatedAt))}</small>
            </span>
          </button>

          <button
            class="history-options-button"
            type="button"
            data-menu-button="${escapeHtml(chat.id)}"
            aria-label="Options for ${escapeHtml(chat.title)}"
            title="Chat options"
          >
            •••
          </button>

          <div
            class="history-options-menu"
            data-menu="${escapeHtml(chat.id)}"
            role="menu"
          >
            <button
              type="button"
              data-action="pin"
              data-action-chat-id="${escapeHtml(chat.id)}"
              role="menuitem"
            >
              ${pinLabel}
            </button>

            <button
              type="button"
              data-action="rename"
              data-action-chat-id="${escapeHtml(chat.id)}"
              role="menuitem"
            >
              Rename
            </button>

            <button
              type="button"
              class="danger"
              data-action="delete"
              data-action-chat-id="${escapeHtml(chat.id)}"
              role="menuitem"
            >
              Delete
            </button>
          </div>
        </div>
      `;
    })
    .join("");

  elements.chatHistoryList
    .querySelectorAll("[data-chat-id]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        closeHistoryMenus();
        switchChat(button.dataset.chatId);
      });
    });

  elements.chatHistoryList
    .querySelectorAll("[data-menu-button]")
    .forEach((button) => {
      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();

        const chatId = button.dataset.menuButton;
        const menu = elements.chatHistoryList.querySelector(
          `[data-menu="${chatId}"]`
        );

        if (!menu) return;

        const wasOpen = menu.classList.contains("show");

        closeHistoryMenus();

        if (!wasOpen) {
          menu.classList.add("show");
        }
      });
    });

  elements.chatHistoryList
    .querySelectorAll("[data-action]")
    .forEach((button) => {
      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();

        const action = button.dataset.action;
        const chatId = button.dataset.actionChatId;

        closeHistoryMenus();

        if (action === "pin") {
          togglePinChat(chatId);
          return;
        }

        if (action === "rename") {
          renameChat(chatId);
          return;
        }

        if (action === "delete") {
          deleteChat(chatId);
        }
      });
    });
}

/* -------------------------
   Render messages
   ------------------------- */

function renderMessages() {
  const chat = getActiveChat();

  const firstName = state.name || "there";

  let html = `
 <section class="welcome-message">
  <img
    src="./assets/kilaubot-avatar.png"
    alt="Kilaubot avatar"
    class="bot-avatar"
  />
  <h3>Hi ${escapeHtml(firstName)} — I’m Kilaubot.</h3>
  <p>
    Read the story beside me or ask a question directly.
    You can follow up naturally with questions like “why did that matter?”
    or “what happened after that?”
  </p>
</section>
  `;

  if (chat?.messages?.length) {
    html += chat.messages
      .map((message) => {
        const isUser = message.role === "user";

        return `
          <div class="message-row ${isUser ? "user" : "bot"}">
            ${
              isUser
                ? ""
                : `<img
     src="./assets/kilaubot-avatar.png"
     alt="Kilaubot avatar"
     class="message-avatar"
   />`
            }
            <div class="message-content">
              <div class="message-bubble">${escapeHtml(message.text)}</div>
              <div class="message-meta">${escapeHtml(formatTime(message.createdAt))}</div>
            </div>
          </div>
        `;
      })
      .join("");
  }

  elements.messages.innerHTML = html;

  requestAnimationFrame(() => {
    elements.messages.scrollTop = elements.messages.scrollHeight;
  });
}

/* -------------------------
   API
   ------------------------- */

async function sendToKilaubot(message) {
  let chat = getActiveChat();

  if (!chat) {
    chat = createChat();
  }

  const response = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      message,
      sessionId: chat.sessionId
    })
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.error ||
      "Kilaubot could not connect. Check the website backend configuration."
    );
  }

  return data;
}

async function sendMessage(rawMessage) {
  const message = String(rawMessage || "").trim();

  if (!message || state.sending) return;

  state.sending = true;

  elements.messageInput.value = "";
  resizeComposer();

  addMessage("user", message);

  elements.sendButton.disabled = true;
  elements.typingIndicator.classList.remove("hidden");
  elements.suggestionRow.classList.add("hidden");

  try {
    const data = await sendToKilaubot(message);

    addMessage(
      "bot",
      data.reply || "I could not produce a response for that question."
    );
  } catch (error) {
    console.error(error);

    addMessage(
      "bot",
      `I couldn't connect to the Kilaubot backend yet. ${error.message}`
    );
  } finally {
    state.sending = false;
    elements.sendButton.disabled = false;
    elements.typingIndicator.classList.add("hidden");
    elements.suggestionRow.classList.remove("hidden");
    elements.messageInput.focus();
  }
}

/* -------------------------
   Composer
   ------------------------- */

function resizeComposer() {
  const field = elements.messageInput;

  field.style.height = "auto";
  field.style.height = `${Math.min(field.scrollHeight, 130)}px`;
}

function prefillQuestion(question) {
  elements.messageInput.value = question;
  resizeComposer();

  if (window.innerWidth <= 820) {
    document.getElementById("chatPane").scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }

  setTimeout(() => {
    elements.messageInput.focus();
    elements.messageInput.setSelectionRange(
      elements.messageInput.value.length,
      elements.messageInput.value.length
    );
  }, 280);
}

/* -------------------------
   Story navigation highlighting
   ------------------------- */

function setupStoryObserver() {
  const sections = [
    "storyTop",
    "beforeResistance",
    "whyResistance",
    "keyFigures",
    "timeline",
    "return1969",
    "legacy",
    "sources"
  ];

  const links = [...document.querySelectorAll(".story-nav-link")];

  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (!visible) return;

      links.forEach((link) => {
        const target = link.getAttribute("href")?.slice(1);
        link.classList.toggle("active", target === visible.target.id);
      });
    },
    {
      root: document.getElementById("storyPane"),
      threshold: [0.2, 0.45, 0.7]
    }
  );

  sections.forEach((id) => {
    const element = document.getElementById(id);
    if (element) observer.observe(element);
  });
}

/* -------------------------
   Events
   ------------------------- */

elements.nameForm.addEventListener("submit", (event) => {
  event.preventDefault();
  applyUserName(elements.nameInput.value);
});

elements.changeNameButton.addEventListener("click", openNamePopup);

elements.newChatButton.addEventListener("click", () => {
  createChat();
  showToast("New chat started");
  elements.appSidebar.classList.remove("open");
});

elements.clearHistoryButton.addEventListener("click", () => {
  const okay = window.confirm(
    "Clear all locally saved Kilaubot chat history from this browser?"
  );

  if (!okay) return;

  state.chats = [];
  state.activeChatId = null;

  saveChats();
  createChat();

  showToast("Chat history cleared");
});

elements.chatForm.addEventListener("submit", (event) => {
  event.preventDefault();
  sendMessage(elements.messageInput.value);
});

elements.messageInput.addEventListener("input", resizeComposer);

elements.messageInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    sendMessage(elements.messageInput.value);
  }
});

document.querySelectorAll("[data-question]").forEach((button) => {
  button.addEventListener("click", () => {
    prefillQuestion(button.dataset.question);
  });
});

elements.mobileMenuButton.addEventListener("click", () => {
  elements.appSidebar.classList.toggle("open");
});

document.querySelectorAll(".story-nav-link").forEach((link) => {
  link.addEventListener("click", () => {
    elements.appSidebar.classList.remove("open");
  });
});

document.addEventListener("click", (event) => {
  if (!event.target.closest(".history-item-wrapper")) {
    closeHistoryMenus();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeHistoryMenus();
  }
});

/* -------------------------
   Boot
   ------------------------- */

function boot() {
  loadStoredData();

  if (!state.activeChatId) {
    createChat();
  } else {
    renderHistory();
    renderMessages();
  }

  if (state.name) {
    applyUserName(state.name);
  } else {
    openNamePopup();
  }

  setupStoryObserver();
  resizeComposer();
}

boot();
