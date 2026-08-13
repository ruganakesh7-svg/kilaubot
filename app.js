/* =========================================================
   KILAUBOT — FINAL FRONT-END APP
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

/* =========================================================
   QUIZ
   Runs locally so Dialogflow cannot break the quiz flow.
   ========================================================= */

const QUIZ_QUESTIONS = [
  {
    question: "Who was Mat Kilau's father?",
    answers: ["tok gajah", "imam perang rasu"],
    explanation:
      "Tok Gajah, also known as Imam Perang Rasu, was Mat Kilau's father."
  },
  {
    question: "Who was known as the Orang Kaya Semantan?",
    answers: [
      "dato bahaman",
      "dato' bahaman",
      "datuk bahaman",
      "bahaman"
    ],
    explanation:
      "Dato' Bahaman was known as the Orang Kaya Semantan."
  },
  {
    question:
      "In which state did Mat Kilau and the resistance movement operate?",
    answers: ["pahang"],
    explanation:
      "The resistance involving Mat Kilau took place in Pahang."
  },
  {
    question:
      "Name one major issue that contributed to resistance against British administration in Pahang.",
    answers: [
      "british interference",
      "interference",
      "resident system",
      "resident",
      "tax",
      "taxation",
      "loss of authority",
      "loss of power",
      "reduced authority",
      "traditional authority",
      "traditional rights"
    ],
    explanation:
      "British administrative interference, taxation, the Resident system and reduced traditional authority were important causes of resistance."
  },
  {
    question:
      "In what year did Mat Kilau publicly reappear and claim his identity?",
    answers: ["1969"],
    explanation:
      "Mat Kilau publicly reappeared and claimed his identity in 1969."
  }
];

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[^a-z0-9']/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isQuizStartCommand(text) {
  const value = normalizeText(text);

  return [
    "quiz",
    "quiz me",
    "start quiz",
    "start the quiz",
    "begin quiz",
    "begin the quiz",
    "give me a quiz",
    "take a quiz",
    "test my knowledge"
  ].includes(value);
}

function isQuizCancelCommand(text) {
  const value = normalizeText(text);

  return [
    "cancel quiz",
    "stop quiz",
    "quit quiz",
    "exit quiz",
    "end quiz"
  ].includes(value);
}

function quizAnswerCorrect(userAnswer, acceptedAnswers) {
  const user = normalizeText(userAnswer);

  return acceptedAnswers.some((answer) => {
    const accepted = normalizeText(answer);

    return (
      user === accepted ||
      user.includes(accepted)
    );
  });
}

function startLocalQuiz() {
  const chat = getActiveChat();

  if (!chat) {
    return null;
  }

  chat.quizState = {
    questionIndex: 0,
    score: 0
  };

  saveChats();

  return (
    "Kilaubot Knowledge Quiz\n\n" +
    "There are 5 open-ended questions. Type your answers normally.\n\n" +
    "Score: 0/5\n\n" +
    "Question 1 of 5:\n" +
    QUIZ_QUESTIONS[0].question +
    '\n\nType "cancel quiz" at any time to stop.'
  );
}

function handleLocalQuiz(message) {
  const chat = getActiveChat();

  if (!chat) {
    return null;
  }

  /* Start or restart quiz */
  if (isQuizStartCommand(message)) {
    return startLocalQuiz();
  }

  /* Cancel quiz */
  if (isQuizCancelCommand(message)) {
    if (!chat.quizState) {
      return 'There is no active quiz. Type "quiz me" to start one.';
    }

    delete chat.quizState;

    saveChats();

    return (
      "Quiz cancelled.\n\n" +
      "You can continue asking me questions about Mat Kilau."
    );
  }

  /* No active quiz */
  if (!chat.quizState) {
    return null;
  }

  const quizState = chat.quizState;

  const current =
    QUIZ_QUESTIONS[
      quizState.questionIndex
    ];

  if (!current) {
    delete chat.quizState;

    saveChats();

    return (
      'The quiz has ended. Type "quiz me" to start again.'
    );
  }

  const correct =
    quizAnswerCorrect(
      message,
      current.answers
    );

  if (correct) {
    quizState.score += 1;
  }

  const feedback =
    correct
      ? "Correct! " +
        current.explanation
      : "Not quite. " +
        current.explanation;

  quizState.questionIndex += 1;

  /* Quiz finished */
  if (
    quizState.questionIndex >=
    QUIZ_QUESTIONS.length
  ) {
    const finalScore =
      quizState.score;

    delete chat.quizState;

    saveChats();

    let result;

    if (finalScore === 5) {
      result =
        "Excellent! Perfect score.";
    } else if (finalScore >= 3) {
      result =
        "Good job! You have a solid understanding of Mat Kilau and the Pahang resistance.";
    } else {
      result =
        "Keep exploring Kilaubot's historical material and try the quiz again.";
    }

    return (
      feedback +
      "\n\nQuiz Complete!" +
      "\n\nFinal Score: " +
      finalScore +
      "/5" +
      "\n\n" +
      result +
      '\n\nType "quiz me" to try again.'
    );
  }

  saveChats();

  return (
    feedback +
    "\n\nScore: " +
    quizState.score +
    "/5" +
    "\n\nQuestion " +
    (quizState.questionIndex + 1) +
    " of 5:\n" +
    QUIZ_QUESTIONS[
      quizState.questionIndex
    ].question
  );
}

/* =========================================================
   LOCAL CONTROL RESPONSES
   ========================================================= */

function handleLocalControl(message) {
  const value =
    normalizeText(message);

  /* Greeting */
  if (
    [
      "hi",
      "hello",
      "hey",
      "good morning",
      "good afternoon",
      "good evening"
    ].includes(value)
  ) {
    return (
      "Hello! I'm Kilaubot, an educational chatbot about Mat Kilau and the Pahang resistance. " +
      'Ask me a historical question, type "help" for examples, or type "quiz me" to start the quiz.'
    );
  }

  /* Help */
  if (
    [
      "help",
      "help me",
      "what can you do",
      "what can i ask"
    ].includes(value)
  ) {
    return (
      "You can ask me about Mat Kilau, Tok Gajah, Dato' Bahaman, the causes of the Pahang resistance, important events, dates, historical sources and Mat Kilau's legacy.\n\n" +
      'Examples: "Who was Mat Kilau?", "Why did the resistance begin?", "Who was Tok Gajah?", or "What happened in 1895?".\n\n' +
      'Type "quiz me" to test your knowledge.'
    );
  }

  /* Goodbye */
  if (
    [
      "goodbye",
      "bye",
      "see you",
      "see you later",
      "thanks goodbye",
      "thank you goodbye"
    ].includes(value)
  ) {
    return (
      "Goodbye! Thank you for learning about Mat Kilau and the Pahang resistance with Kilaubot."
    );
  }

  /* Sources */
  if (
    value === "sources" ||
    value === "source" ||
    value.includes(
      "where does your information come from"
    ) ||
    value.includes(
      "where do you get your information"
    ) ||
    value.includes(
      "what are your sources"
    ) ||
    value.includes(
      "historical sources"
    )
  ) {
    return (
      "Kilaubot uses a curated, source-aware knowledge base about Mat Kilau and the Pahang resistance. " +
      "The project prioritises verified historical material from archival, government and academic sources, and disputed details are treated cautiously rather than presented as certain."
    );
  }

  /* Obvious unrelated questions */
  if (
    (
      value.includes("spider man") ||
      value.includes("spiderman") ||
      value.includes("batman") ||
      value.includes("today's weather") ||
      value.includes("todays weather")
    ) &&
    !value.includes("mat kilau")
  ) {
    return (
      "That question is outside Kilaubot's historical scope. " +
      "I specialise in Mat Kilau and the Pahang resistance, so please ask me about that topic instead."
    );
  }

  /* Recommendation */
  if (
    value.includes(
      "what should i learn about next"
    ) ||
    value.includes(
      "what should i learn next"
    ) ||
    value.includes(
      "recommend a topic"
    ) ||
    value.includes(
      "recommend something"
    ) ||
    value.includes(
      "learning recommendation"
    )
  ) {
    return (
      "A useful next topic is the wider Pahang resistance: first learn why resistance developed, then compare the roles of Dato' Bahaman, Tok Gajah and Mat Kilau, and finally review the major events from 1891 to 1895."
    );
  }

  return null;
}

/* =========================================================
   DOM ELEMENTS
   ========================================================= */

const elements = {
  welcomeOverlay:
    document.getElementById(
      "welcomeOverlay"
    ),

  nameForm:
    document.getElementById(
      "nameForm"
    ),

  nameInput:
    document.getElementById(
      "nameInput"
    ),

  changeNameButton:
    document.getElementById(
      "changeNameButton"
    ),

  profileName:
    document.getElementById(
      "profileName"
    ),

  profileAvatar:
    document.getElementById(
      "profileAvatar"
    ),

  newChatButton:
    document.getElementById(
      "newChatButton"
    ),

  clearHistoryButton:
    document.getElementById(
      "clearHistoryButton"
    ),

  chatHistoryList:
    document.getElementById(
      "chatHistoryList"
    ),

  messages:
    document.getElementById(
      "messages"
    ),

  typingIndicator:
    document.getElementById(
      "typingIndicator"
    ),

  suggestionRow:
    document.getElementById(
      "suggestionRow"
    ),

  chatForm:
    document.getElementById(
      "chatForm"
    ),

  messageInput:
    document.getElementById(
      "messageInput"
    ),

  sendButton:
    document.getElementById(
      "sendButton"
    ),

  appSidebar:
    document.getElementById(
      "appSidebar"
    ),

  mobileMenuButton:
    document.getElementById(
      "mobileMenuButton"
    ),

  toast:
    document.getElementById(
      "toast"
    )
};

/* =========================================================
   UTILITIES
   ========================================================= */

function cleanName(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 40);
}

function createId(prefix = "id") {
  const random =
    Math.random()
      .toString(36)
      .slice(2, 10);

  const time =
    Date.now()
      .toString(36);

  return `${prefix}-${time}-${random}`
    .slice(0, 36);
}

function formatTime(timestamp) {
  return new Intl.DateTimeFormat(
    [],
    {
      hour: "2-digit",
      minute: "2-digit"
    }
  ).format(
    new Date(timestamp)
  );
}

function formatChatDate(timestamp) {
  const date =
    new Date(timestamp);

  const now =
    new Date();

  const sameDay =
    date.getFullYear() ===
      now.getFullYear() &&
    date.getMonth() ===
      now.getMonth() &&
    date.getDate() ===
      now.getDate();

  if (sameDay) {
    return "Today";
  }

  return new Intl.DateTimeFormat(
    [],
    {
      month: "short",
      day: "numeric"
    }
  ).format(date);
}

function showToast(message) {
  if (!elements.toast) {
    return;
  }

  elements.toast.textContent =
    message;

  elements.toast.classList.add(
    "show"
  );

  clearTimeout(
    showToast.timeout
  );

  showToast.timeout =
    setTimeout(
      () => {
        elements.toast
          .classList.remove(
            "show"
          );
      },
      2600
    );
}

function escapeHtml(value) {
  return String(value)
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    )
    .replaceAll(
      '"',
      "&quot;"
    )
    .replaceAll(
      "'",
      "&#039;"
    );
}

function formatMessageText(value) {
  return escapeHtml(value)
    .replace(
      /\r?\n/g,
      "<br>"
    );
}

function on(
  element,
  eventName,
  handler
) {
  if (element) {
    element.addEventListener(
      eventName,
      handler
    );
  }
}

/* =========================================================
   STORAGE
   ========================================================= */

function loadStoredData() {
  state.name =
    cleanName(
      localStorage.getItem(
        STORAGE.name
      )
    );

  try {
    const parsed =
      JSON.parse(
        localStorage.getItem(
          STORAGE.chats
        ) || "[]"
      );

    state.chats =
      Array.isArray(parsed)
        ? parsed
        : [];
  } catch {
    state.chats = [];
  }

  state.activeChatId =
    localStorage.getItem(
      STORAGE.activeChatId
    );

  if (
    !state.activeChatId ||
    !state.chats.some(
      (chat) =>
        chat.id ===
        state.activeChatId
    )
  ) {
    state.activeChatId =
      state.chats[0]?.id ||
      null;
  }
}

function saveChats() {
  state.chats.sort(
    (a, b) => {
      const aPinned =
        Boolean(a.pinned);

      const bPinned =
        Boolean(b.pinned);

      if (
        aPinned !== bPinned
      ) {
        return (
          bPinned -
          aPinned
        );
      }

      return (
        (b.updatedAt || 0) -
        (a.updatedAt || 0)
      );
    }
  );

  localStorage.setItem(
    STORAGE.chats,
    JSON.stringify(
      state.chats
    )
  );

  if (state.activeChatId) {
    localStorage.setItem(
      STORAGE.activeChatId,
      state.activeChatId
    );
  } else {
    localStorage.removeItem(
      STORAGE.activeChatId
    );
  }
}

/* =========================================================
   USER NAME
   ========================================================= */

function applyUserName(name) {
  const clean =
    cleanName(name);

  if (!clean) {
    return;
  }

  state.name =
    clean;

  localStorage.setItem(
    STORAGE.name,
    clean
  );

  if (elements.profileName) {
    elements.profileName
      .textContent =
      clean;
  }

  if (elements.profileAvatar) {
    elements.profileAvatar
      .textContent =
      clean
        .charAt(0)
        .toUpperCase();
  }

  if (elements.welcomeOverlay) {
    elements.welcomeOverlay
      .classList
      .remove(
        "show"
      );

    elements.welcomeOverlay
      .setAttribute(
        "aria-hidden",
        "true"
      );
  }

  renderMessages();
}

function openNamePopup() {
  if (
    !elements.welcomeOverlay ||
    !elements.nameInput
  ) {
    return;
  }

  elements.nameInput.value =
    state.name;

  elements.welcomeOverlay
    .classList
    .add(
      "show"
    );

  elements.welcomeOverlay
    .setAttribute(
      "aria-hidden",
      "false"
    );

  setTimeout(
    () => {
      elements.nameInput
        .focus();
    },
    80
  );
}

/* =========================================================
   CHAT MODEL
   ========================================================= */

function createChat() {
  const now =
    Date.now();

  const chat = {
    id:
      createId(
        "chat"
      ),

    sessionId:
      createId(
        "web"
      ),

    title:
      "New conversation",

    pinned:
      false,

    createdAt:
      now,

    updatedAt:
      now,

    messages:
      []
  };

  state.chats.unshift(
    chat
  );

  state.activeChatId =
    chat.id;

  saveChats();

  renderHistory();

  renderMessages();

  elements.messageInput
    ?.focus();

  return chat;
}

function getActiveChat() {
  return (
    state.chats.find(
      (chat) =>
        chat.id ===
        state.activeChatId
    ) || null
  );
}

function switchChat(chatId) {
  if (
    !state.chats.some(
      (chat) =>
        chat.id ===
        chatId
    )
  ) {
    return;
  }

  state.activeChatId =
    chatId;

  saveChats();

  renderHistory();

  renderMessages();

  elements.appSidebar
    ?.classList
    .remove(
      "open"
    );
}

function togglePinChat(chatId) {
  const chat =
    state.chats.find(
      (item) =>
        item.id ===
        chatId
    );

  if (!chat) {
    return;
  }

  chat.pinned =
    !Boolean(
      chat.pinned
    );

  saveChats();

  renderHistory();

  showToast(
    chat.pinned
      ? "Chat pinned"
      : "Chat unpinned"
  );
}

function renameChat(chatId) {
  const chat =
    state.chats.find(
      (item) =>
        item.id ===
        chatId
    );

  if (!chat) {
    return;
  }

  const newTitle =
    window.prompt(
      "Rename this chat:",
      chat.title
    );

  if (
    newTitle === null
  ) {
    return;
  }

  const cleanTitle =
    String(newTitle)
      .trim()
      .replace(
        /\s+/g,
        " "
      )
      .slice(
        0,
        40
      );

  if (!cleanTitle) {
    return;
  }

  chat.title =
    cleanTitle;

  chat.updatedAt =
    Date.now();

  saveChats();

  renderHistory();

  showToast(
    "Chat renamed"
  );
}

function deleteChat(chatId) {
  const chat =
    state.chats.find(
      (item) =>
        item.id ===
        chatId
    );

  if (!chat) {
    return;
  }

  const okay =
    window.confirm(
      `Delete "${chat.title}"?`
    );

  if (!okay) {
    return;
  }

  const deletingActiveChat =
    state.activeChatId ===
    chatId;

  state.chats =
    state.chats.filter(
      (item) =>
        item.id !==
        chatId
    );

  if (
    deletingActiveChat
  ) {
    state.activeChatId =
      state.chats[0]?.id ||
      null;
  }

  saveChats();

  if (
    !state.activeChatId
  ) {
    createChat();
  } else {
    renderHistory();

    renderMessages();
  }

  showToast(
    "Chat deleted"
  );
}

function titleFromMessage(message) {
  const clean =
    String(
      message || ""
    )
      .trim()
      .replace(
        /\s+/g,
        " "
      );

  return (
    clean.length > 32
      ? `${clean.slice(
          0,
          32
        )}…`
      : clean
  );
}

function addMessage(
  role,
  text
) {
  let chat =
    getActiveChat();

  if (!chat) {
    chat =
      createChat();
  }

  const now =
    Date.now();

  chat.messages.push({
    id:
      createId(
        "msg"
      ),

    role,

    text:
      String(
        text ?? ""
      ),

    createdAt:
      now
  });

  if (
    role === "user" &&
    (
      chat.title ===
        "New conversation" ||
      chat.messages.length <= 2
    )
  ) {
    chat.title =
      titleFromMessage(
        text
      );
  }

  chat.updatedAt =
    now;

  saveChats();

  renderHistory();

  renderMessages();

  return chat;
}

/* =========================================================
   HISTORY
   ========================================================= */

function closeAllHistoryMenus() {
  document
    .querySelectorAll(
      ".history-options-menu.show"
    )
    .forEach(
      (menu) =>
        menu.classList.remove(
          "show"
        )
    );
}

function renderHistory() {
  if (
    !elements.chatHistoryList
  ) {
    return;
  }

  if (
    !state.chats.length
  ) {
    elements.chatHistoryList
      .innerHTML = `
        <div class="history-empty">
          Your conversations will appear here after you start chatting.
        </div>
      `;

    return;
  }

  elements.chatHistoryList
    .innerHTML =
    state.chats
      .map(
        (chat) => {
          const isActive =
            chat.id ===
            state.activeChatId
              ? "active"
              : "";

          return `
            <div class="history-item-wrapper">

              <button
                class="history-item ${isActive}"
                type="button"
                data-chat-id="${escapeHtml(
                  chat.id
                )}"
                title="${escapeHtml(
                  chat.title
                )}"
              >

                <span class="history-item-icon">
                  ${
                    chat.pinned
                      ? "◆"
                      : "◌"
                  }
                </span>

                <span class="history-item-copy">

                  <strong>
                    ${escapeHtml(
                      chat.title
                    )}
                  </strong>

                  <small>
                    ${escapeHtml(
                      formatChatDate(
                        chat.updatedAt
                      )
                    )}
                  </small>

                </span>

              </button>

              <button
                class="history-options-button"
                type="button"
                data-menu-button="${escapeHtml(
                  chat.id
                )}"
                aria-label="Chat options"
                title="Chat options"
              >
                •••
              </button>

              <div
                class="history-options-menu"
                data-menu="${escapeHtml(
                  chat.id
                )}"
              >

                <button
                  type="button"
                  data-action="pin"
                  data-action-chat-id="${escapeHtml(
                    chat.id
                  )}"
                >
                  ${
                    chat.pinned
                      ? "Unpin"
                      : "Pin"
                  }
                </button>

                <button
                  type="button"
                  data-action="rename"
                  data-action-chat-id="${escapeHtml(
                    chat.id
                  )}"
                >
                  Rename
                </button>

                <button
                  type="button"
                  class="danger"
                  data-action="delete"
                  data-action-chat-id="${escapeHtml(
                    chat.id
                  )}"
                >
                  Delete
                </button>

              </div>

            </div>
          `;
        }
      )
      .join("");

  /* Open previous chat */
  elements.chatHistoryList
    .querySelectorAll(
      "[data-chat-id]"
    )
    .forEach(
      (button) => {
        button.addEventListener(
          "click",
          () => {
            switchChat(
              button
                .dataset
                .chatId
            );
          }
        );
      }
    );

  /* Three-dot menu */
  elements.chatHistoryList
    .querySelectorAll(
      "[data-menu-button]"
    )
    .forEach(
      (button) => {
        button.addEventListener(
          "click",
          (event) => {
            event.preventDefault();

            event.stopPropagation();

            const chatId =
              button
                .dataset
                .menuButton;

            const menu =
              elements
                .chatHistoryList
                .querySelector(
                  `[data-menu="${chatId}"]`
                );

            elements
              .chatHistoryList
              .querySelectorAll(
                ".history-options-menu.show"
              )
              .forEach(
                (openMenu) => {
                  if (
                    openMenu !==
                    menu
                  ) {
                    openMenu
                      .classList
                      .remove(
                        "show"
                      );
                  }
                }
              );

            menu
              ?.classList
              .toggle(
                "show"
              );
          }
        );
      }
    );

  /* Pin / Rename / Delete */
  elements.chatHistoryList
    .querySelectorAll(
      "[data-action]"
    )
    .forEach(
      (button) => {
        button.addEventListener(
          "click",
          (event) => {
            event.preventDefault();

            event.stopPropagation();

            const action =
              button
                .dataset
                .action;

            const chatId =
              button
                .dataset
                .actionChatId;

            if (
              action === "pin"
            ) {
              togglePinChat(
                chatId
              );
            } else if (
              action ===
              "rename"
            ) {
              renameChat(
                chatId
              );
            } else if (
              action ===
              "delete"
            ) {
              deleteChat(
                chatId
              );
            }
          }
        );
      }
    );
}

/* =========================================================
   MESSAGE RENDERING
   ========================================================= */

function renderMessages() {
  if (!elements.messages) {
    return;
  }

  const chat =
    getActiveChat();

  const firstName =
    state.name ||
    "there";

  let html = `
    <section class="welcome-message">

      <img
        src="/assets/kilaubot-avatar.png"
        alt="Kilaubot avatar"
        class="bot-avatar"
      />

      <h3>
        Hi ${escapeHtml(
          firstName
        )} — I’m Kilaubot.
      </h3>

      <p>
        Read the story beside me or ask a question directly.
        You can follow up naturally with questions like
        “why did that matter?” or “what happened after that?”
      </p>

    </section>
  `;

  if (
    chat?.messages?.length
  ) {
    html +=
      chat.messages
        .map(
          (message) => {
            const isUser =
              message.role ===
              "user";

            return `
              <div
                class="message-row ${
                  isUser
                    ? "user"
                    : "bot"
                }"
              >

                ${
                  isUser
                    ? ""
                    : `
                      <img
                        src="/assets/kilaubot-avatar.png"
                        alt="Kilaubot avatar"
                        class="message-avatar"
                      />
                    `
                }

                <div class="message-content">

                  <div class="message-bubble">
                    ${formatMessageText(
                      message.text
                    )}
                  </div>

                  <div class="message-meta">
                    ${escapeHtml(
                      formatTime(
                        message.createdAt
                      )
                    )}
                  </div>

                </div>

              </div>
            `;
          }
        )
        .join("");
  }

  elements.messages.innerHTML =
    html;

  requestAnimationFrame(
    () => {
      elements.messages
        .scrollTop =
        elements.messages
          .scrollHeight;
    }
  );
}

/* =========================================================
   FOLLOW-UP RESOLUTION
   Fixes things like:
   "what did he do?"
   "why was he fighting?"
   "who was his father?"
   ========================================================= */

function mostRecentHistoricalSubject(chat) {
  if (
    !chat?.messages?.length
  ) {
    return "Mat Kilau";
  }

  for (
    let i =
      chat.messages.length - 1;

    i >= 0;

    i -= 1
  ) {
    if (
      chat.messages[i].role !==
      "user"
    ) {
      continue;
    }

    const text =
      normalizeText(
        chat.messages[i].text
      );

    if (
      text.includes(
        "tok gajah"
      ) ||
      text.includes(
        "imam perang rasu"
      )
    ) {
      return "Tok Gajah";
    }

    if (
      text.includes(
        "dato bahaman"
      ) ||
      text.includes(
        "datuk bahaman"
      )
    ) {
      return "Dato' Bahaman";
    }

    if (
      text.includes(
        "mat kilau"
      )
    ) {
      return "Mat Kilau";
    }
  }

  return "Mat Kilau";
}

function resolveMessageForBackend(
  message,
  chat
) {
  const original =
    String(
      message || ""
    ).trim();

  const lower =
    normalizeText(
      original
    );

  if (!original) {
    return original;
  }

  /*
    If the user already names
    the historical person,
    don't modify the question.
  */
  if (
    lower.includes(
      "mat kilau"
    ) ||
    lower.includes(
      "tok gajah"
    ) ||
    lower.includes(
      "imam perang rasu"
    ) ||
    lower.includes(
      "dato bahaman"
    ) ||
    lower.includes(
      "datuk bahaman"
    )
  ) {
    return original;
  }

  const subject =
    mostRecentHistoricalSubject(
      chat
    );

  /*
    Resolve he/him/his.
  */
  if (
    /\b(he|him|his)\b/i.test(
      original
    )
  ) {
    return original
      .replace(
        /\bhis\b/gi,
        `${subject}'s`
      )
      .replace(
        /\bhe\b/gi,
        subject
      )
      .replace(
        /\bhim\b/gi,
        subject
      );
  }

  /*
    Resolve vague "that" follow-ups.
  */
  if (
    /\b(that|after that|what happened next|what happened after that)\b/i
      .test(
        original
      )
  ) {
    return (
      `Regarding ${subject} and the previous historical topic, ${original}`
    );
  }

  return original;
}

/* =========================================================
   BACKEND API
   ========================================================= */

async function sendToKilaubot(
  message
) {
  let chat =
    getActiveChat();

  if (!chat) {
    chat =
      createChat();
  }

  /*
    Important:
    resolve short references BEFORE
    sending the message to Dialogflow.
  */
  const backendMessage =
    resolveMessageForBackend(
      message,
      chat
    );

  const response =
    await fetch(
      "/api/chat",
      {
        method:
          "POST",

        headers: {
          "Content-Type":
            "application/json"
        },

        body:
          JSON.stringify({
            message:
              backendMessage,

            sessionId:
              chat.sessionId
          })
      }
    );

  const data =
    await response
      .json()
      .catch(
        () => ({})
      );

  if (!response.ok) {
    throw new Error(
      data.error ||
      "Kilaubot could not connect. Check the website backend configuration."
    );
  }

  return data;
}

/* =========================================================
   SEND MESSAGE
   1. Quiz
   2. Local controls
   3. Historical backend
   ========================================================= */

async function sendMessage(
  rawMessage
) {
  const message =
    String(
      rawMessage || ""
    ).trim();

  if (
    !message ||
    state.sending
  ) {
    return;
  }

  state.sending =
    true;

  if (
    elements.messageInput
  ) {
    elements.messageInput.value =
      "";
  }

  resizeComposer();

  addMessage(
    "user",
    message
  );

  if (
    elements.sendButton
  ) {
    elements.sendButton.disabled =
      true;
  }

  elements.typingIndicator
    ?.classList
    .remove(
      "hidden"
    );

  elements.suggestionRow
    ?.classList
    .add(
      "hidden"
    );

  try {
    /*
      QUIZ FIRST.

      This means quiz messages never
      reach the broken Dialogflow
      quiz intents.
    */
    const quizReply =
      handleLocalQuiz(
        message
      );

    if (
      quizReply !== null
    ) {
      addMessage(
        "bot",
        quizReply
      );

      return;
    }

    /*
      LOCAL CONTROL COMMANDS.
    */
    const localReply =
      handleLocalControl(
        message
      );

    if (
      localReply !== null
    ) {
      addMessage(
        "bot",
        localReply
      );

      return;
    }

    /*
      NORMAL HISTORICAL Q&A.
    */
    const data =
      await sendToKilaubot(
        message
      );

    addMessage(
      "bot",
      data.reply ||
      data.fulfillmentText ||
      "I understood your question, but no response text was returned."
    );
  } catch (error) {
    console.error(
      error
    );

    addMessage(
      "bot",
      `I couldn't connect to the Kilaubot backend yet. ${error.message}`
    );
  } finally {
    state.sending =
      false;

    if (
      elements.sendButton
    ) {
      elements.sendButton.disabled =
        false;
    }

    elements.typingIndicator
      ?.classList
      .add(
        "hidden"
      );

    elements.suggestionRow
      ?.classList
      .remove(
        "hidden"
      );

    elements.messageInput
      ?.focus();
  }
}

/* =========================================================
   COMPOSER
   ========================================================= */

function resizeComposer() {
  if (
    !elements.messageInput
  ) {
    return;
  }

  elements.messageInput
    .style.height =
    "auto";

  elements.messageInput
    .style.height =
    `${Math.min(
      elements.messageInput
        .scrollHeight,
      130
    )}px`;
}

function prefillQuestion(
  question
) {
  if (
    !elements.messageInput
  ) {
    return;
  }

  elements.messageInput.value =
    question;

  resizeComposer();

  if (
    window.innerWidth <=
    970
  ) {
    document
      .getElementById(
        "chatPane"
      )
      ?.scrollIntoView({
        behavior:
          "smooth",

        block:
          "start"
      });
  }

  setTimeout(
    () => {
      elements.messageInput
        .focus();

      elements.messageInput
        .setSelectionRange(
          elements.messageInput
            .value.length,

          elements.messageInput
            .value.length
        );
    },
    280
  );
}

/* =========================================================
   STORY NAVIGATION
   ========================================================= */

function setupStoryObserver() {
  if (
    !(
      "IntersectionObserver" in
      window
    )
  ) {
    return;
  }

  const storyPane =
    document.getElementById(
      "storyPane"
    );

  if (!storyPane) {
    return;
  }

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

  const links = [
    ...document.querySelectorAll(
      ".story-nav-link"
    )
  ];

  const observer =
    new IntersectionObserver(
      (entries) => {
        const visible =
          entries
            .filter(
              (entry) =>
                entry
                  .isIntersecting
            )
            .sort(
              (a, b) =>
                b.intersectionRatio -
                a.intersectionRatio
            )[0];

        if (!visible) {
          return;
        }

        links.forEach(
          (link) => {
            const target =
              link
                .getAttribute(
                  "href"
                )
                ?.slice(1);

            link
              .classList
              .toggle(
                "active",
                target ===
                  visible
                    .target
                    .id
              );
          }
        );
      },
      {
        root:
          storyPane,

        threshold: [
          0.2,
          0.45,
          0.7
        ]
      }
    );

  sections.forEach(
    (id) => {
      const element =
        document.getElementById(
          id
        );

      if (element) {
        observer.observe(
          element
        );
      }
    }
  );
}

/* =========================================================
   EVENTS
   ========================================================= */

on(
  elements.nameForm,
  "submit",
  (event) => {
    event.preventDefault();

    applyUserName(
      elements.nameInput
        ?.value
    );
  }
);

on(
  elements.changeNameButton,
  "click",
  () => {
    openNamePopup();
  }
);

on(
  elements.newChatButton,
  "click",
  () => {
    createChat();

    showToast(
      "New chat started"
    );

    elements.appSidebar
      ?.classList
      .remove(
        "open"
      );
  }
);

on(
  elements.clearHistoryButton,
  "click",
  () => {
    const okay =
      window.confirm(
        "Clear all locally saved Kilaubot chat history from this browser?"
      );

    if (!okay) {
      return;
    }

    state.chats =
      [];

    state.activeChatId =
      null;

    saveChats();

    createChat();

    showToast(
      "Chat history cleared"
    );
  }
);

on(
  elements.chatForm,
  "submit",
  (event) => {
    event.preventDefault();

    sendMessage(
      elements.messageInput
        ?.value
    );
  }
);

on(
  elements.messageInput,
  "input",
  () => {
    resizeComposer();
  }
);

on(
  elements.messageInput,
  "keydown",
  (event) => {
    if (
      event.key ===
        "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();

      sendMessage(
        elements.messageInput
          ?.value
      );
    }
  }
);

document
  .querySelectorAll(
    "[data-question]"
  )
  .forEach(
    (button) => {
      button.addEventListener(
        "click",
        () => {
          prefillQuestion(
            button.dataset
              .question ||
            ""
          );
        }
      );
    }
  );

on(
  elements.mobileMenuButton,
  "click",
  () => {
    elements.appSidebar
      ?.classList
      .toggle(
        "open"
      );
  }
);

document
  .querySelectorAll(
    ".story-nav-link"
  )
  .forEach(
    (link) => {
      link.addEventListener(
        "click",
        () => {
          elements.appSidebar
            ?.classList
            .remove(
              "open"
            );
        }
      );
    }
  );

document.addEventListener(
  "click",
  (event) => {
    if (
      event.target.closest(
        ".history-options-menu"
      ) ||
      event.target.closest(
        ".history-options-button"
      )
    ) {
      return;
    }

    closeAllHistoryMenus();
  }
);

document.addEventListener(
  "keydown",
  (event) => {
    if (
      event.key ===
      "Escape"
    ) {
      closeAllHistoryMenus();
    }
  }
);

/* =========================================================
   BOOT
   ========================================================= */

function boot() {
  loadStoredData();

  if (
    !state.activeChatId
  ) {
    createChat();
  } else {
    renderHistory();

    renderMessages();
  }

  if (state.name) {
    applyUserName(
      state.name
    );
  } else {
    openNamePopup();
  }

  setupStoryObserver();

  resizeComposer();
}

boot();
