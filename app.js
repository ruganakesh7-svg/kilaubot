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


const el = {
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
   TEXT HELPERS
   ========================================================= */

function escapeHtml(value) {
  return String(
    value ?? ""
  )
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


/*
  This fixes the ugly spacing problem.

  It removes leading spaces from each
  chatbot line while keeping deliberate
  line breaks for quiz questions.
*/

function formatMessageText(value) {

  const text =
    String(
      value ?? ""
    )
      .replace(
        /\r\n?/g,
        "\n"
      )
      .trim();


  if (!text) {
    return "";
  }


  const lines =
    text
      .split("\n")
      .map(
        (line) =>
          line.trim()
      );


  const cleaned = [];

  let previousBlank =
    false;


  for (
    const line of lines
  ) {

    const blank =
      line === "";


    if (
      blank &&
      previousBlank
    ) {
      continue;
    }


    cleaned.push(
      line
    );


    previousBlank =
      blank;
  }


  return cleaned
    .map(
      escapeHtml
    )
    .join("<br>");
}


/* =========================================================
   GENERAL HELPERS
   ========================================================= */

function cleanName(value) {

  return String(
    value || ""
  )
    .trim()
    .replace(
      /\s+/g,
      " "
    )
    .slice(
      0,
      40
    );
}


function createId(
  prefix = "id"
) {

  const random =
    Math
      .random()
      .toString(36)
      .slice(
        2,
        10
      );


  const time =
    Date
      .now()
      .toString(36);


  return `${prefix}-${time}-${random}`
    .slice(
      0,
      36
    );
}


function formatTime(
  timestamp
) {

  return new Intl
    .DateTimeFormat(
      [],
      {
        hour:
          "2-digit",

        minute:
          "2-digit"
      }
    )
    .format(
      new Date(
        timestamp
      )
    );
}


function formatChatDate(
  timestamp
) {

  const date =
    new Date(
      timestamp
    );


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


  return new Intl
    .DateTimeFormat(
      [],
      {
        month: "short",
        day: "numeric"
      }
    )
    .format(
      date
    );
}


function showToast(
  message
) {

  if (!el.toast) {
    return;
  }


  el.toast.textContent =
    message;


  el.toast.classList.add(
    "show"
  );


  clearTimeout(
    showToast.timer
  );


  showToast.timer =
    setTimeout(
      () => {

        el.toast
          .classList
          .remove(
            "show"
          );

      },
      2200
    );
}


/* =========================================================
   STORAGE
   ========================================================= */

function loadStoredData() {

  state.name =
    cleanName(
      localStorage
        .getItem(
          STORAGE.name
        )
    );


  try {

    const parsed =
      JSON.parse(
        localStorage
          .getItem(
            STORAGE.chats
          ) ||
        "[]"
      );


    state.chats =
      Array.isArray(
        parsed
      )
        ? parsed
        : [];

  } catch {

    state.chats = [];

  }


  state.activeChatId =
    localStorage
      .getItem(
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

      const pinDifference =
        Number(
          Boolean(
            b.pinned
          )
        ) -
        Number(
          Boolean(
            a.pinned
          )
        );


      return (
        pinDifference ||

        b.updatedAt -
        a.updatedAt
      );

    }
  );


  localStorage.setItem(
    STORAGE.chats,

    JSON.stringify(
      state.chats
    )
  );


  if (
    state.activeChatId
  ) {

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

function applyUserName(
  name
) {

  const clean =
    cleanName(
      name
    );


  if (!clean) {
    return;
  }


  state.name =
    clean;


  localStorage.setItem(
    STORAGE.name,
    clean
  );


  if (
    el.profileName
  ) {

    el.profileName
      .textContent =
        clean;

  }


  if (
    el.profileAvatar
  ) {

    el.profileAvatar
      .textContent =
        clean
          .charAt(0)
          .toUpperCase();

  }


  el.welcomeOverlay
    ?.classList
    .remove(
      "show"
    );


  el.welcomeOverlay
    ?.setAttribute(
      "aria-hidden",
      "true"
    );


  renderMessages();

}


function openNamePopup() {

  if (
    !el.welcomeOverlay
  ) {
    return;
  }


  if (
    el.nameInput
  ) {

    el.nameInput.value =
      state.name;

  }


  el.welcomeOverlay
    .classList
    .add(
      "show"
    );


  el.welcomeOverlay
    .setAttribute(
      "aria-hidden",
      "false"
    );


  setTimeout(
    () => {

      el.nameInput
        ?.focus();

    },
    80
  );

}


/* =========================================================
   CREATE CHAT
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


  el.messageInput
    ?.focus();


  return chat;

}


function getActiveChat() {

  return (
    state.chats.find(
      (chat) =>
        chat.id ===
        state.activeChatId
    ) ||
    null
  );

}


function switchChat(
  chatId
) {

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


  el.appSidebar
    ?.classList
    .remove(
      "open"
    );

}


/* =========================================================
   HISTORY MENU
   ========================================================= */

function closeHistoryMenus() {

  document
    .querySelectorAll(
      ".history-options-menu.show"
    )
    .forEach(
      (menu) => {

        menu.classList.remove(
          "show"
        );


        menu.style.top =
          "";


        menu.style.left =
          "";

      }
    );

}


/*
  Position fixed means the popup does not
  get cut off by Previous Chats scrolling.
*/

function positionHistoryMenu(
  button,
  menu
) {

  const gap = 6;

  const edge = 8;


  const rect =
    button
      .getBoundingClientRect();


  menu.style.visibility =
    "hidden";


  menu.classList.add(
    "show"
  );


  menu.style.top =
    "0px";


  menu.style.left =
    "0px";


  const menuRect =
    menu
      .getBoundingClientRect();


  const width =
    menuRect.width ||
    136;


  const height =
    menuRect.height ||
    112;


  let left =
    rect.right -
    width;


  let top =
    rect.bottom +
    gap;


  if (
    left < edge
  ) {

    left = edge;

  }


  if (
    left + width >
    window.innerWidth -
    edge
  ) {

    left =
      window.innerWidth -
      width -
      edge;

  }


  if (
    top + height >
    window.innerHeight -
    edge
  ) {

    top =
      rect.top -
      height -
      gap;

  }


  if (
    top < edge
  ) {

    top = edge;

  }


  menu.style.left =
    `${Math.round(
      left
    )}px`;


  menu.style.top =
    `${Math.round(
      top
    )}px`;


  menu.style.visibility =
    "visible";

}


/* =========================================================
   PIN
   ========================================================= */

function togglePinChat(
  chatId
) {

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


  chat.updatedAt =
    Date.now();


  saveChats();

  renderHistory();


  showToast(
    chat.pinned
      ? "Chat pinned"
      : "Chat unpinned"
  );

}


/* =========================================================
   RENAME
   ========================================================= */

function renameChat(
  chatId
) {

  const chat =
    state.chats.find(
      (item) =>
        item.id ===
        chatId
    );


  if (!chat) {
    return;
  }


  const title =
    window.prompt(
      "Rename this chat:",
      chat.title
    );


  if (
    title === null
  ) {
    return;
  }


  const clean =
    String(
      title
    )
      .trim()
      .replace(
        /\s+/g,
        " "
      )
      .slice(
        0,
        40
      );


  if (!clean) {
    return;
  }


  chat.title =
    clean;


  chat.updatedAt =
    Date.now();


  saveChats();

  renderHistory();

  showToast(
    "Chat renamed"
  );

}


/* =========================================================
   DELETE CHAT
   ========================================================= */

function deleteChat(
  chatId
) {

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


  const wasActive =
    state.activeChatId ===
    chatId;


  state.chats =
    state.chats.filter(
      (item) =>
        item.id !==
        chatId
    );


  if (
    wasActive
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


/* =========================================================
   MESSAGE STORAGE
   ========================================================= */

function titleFromMessage(
  message
) {

  const clean =
    String(
      message
    )
      .trim()
      .replace(
        /\s+/g,
        " "
      );


  return (
    clean.length > 28

      ? `${clean.slice(
          0,
          28
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

      chat.messages.length <=
        2
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

}


/* =========================================================
   RENDER HISTORY
   ========================================================= */

function renderHistory() {

  if (
    !el.chatHistoryList
  ) {
    return;
  }


  if (
    !state.chats.length
  ) {

    el.chatHistoryList.innerHTML = `
      <div class="history-empty">
        Your conversations will appear here.
      </div>
    `;


    return;

  }


  el.chatHistoryList.innerHTML =
    state.chats
      .map(
        (chat) => {

          const active =
            chat.id ===
            state.activeChatId

              ? "active"

              : "";


          const pinLabel =
            chat.pinned

              ? "Unpin"

              : "Pin";


          const icon =
            chat.pinned

              ? "◆"

              : "◌";


          return `
            <div class="history-item-wrapper">

              <button
                class="history-item ${active}"
                type="button"
                data-chat-id="${escapeHtml(chat.id)}"
                title="${escapeHtml(chat.title)}"
              >

                <span class="history-item-icon">
                  ${icon}
                </span>

                <span class="history-item-copy">

                  <strong>
                    ${escapeHtml(chat.title)}
                  </strong>

                  <small>
                    ${escapeHtml(formatChatDate(chat.updatedAt))}
                  </small>

                </span>

              </button>


              <button
                class="history-options-button"
                type="button"
                data-menu-button="${escapeHtml(chat.id)}"
                aria-label="Chat options"
                title="Chat options"
              >
                ⋯
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
                >
                  ${pinLabel}
                </button>


                <button
                  type="button"
                  data-action="rename"
                  data-action-chat-id="${escapeHtml(chat.id)}"
                >
                  Rename
                </button>


                <button
                  type="button"
                  class="danger"
                  data-action="delete"
                  data-action-chat-id="${escapeHtml(chat.id)}"
                >
                  Delete
                </button>

              </div>

            </div>
          `;

        }
      )
      .join("");


  /* OPEN OLD CHAT */

  el.chatHistoryList
    .querySelectorAll(
      "[data-chat-id]"
    )
    .forEach(
      (button) => {

        button.addEventListener(
          "click",
          () => {

            closeHistoryMenus();


            switchChat(
              button.dataset
                .chatId
            );

          }
        );

      }
    );


  /* 3 DOT BUTTON */

  el.chatHistoryList
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
              button.dataset
                .menuButton;


            const menu =
              el.chatHistoryList
                .querySelector(
                  `[data-menu="${chatId}"]`
                );


            if (!menu) {
              return;
            }


            const wasOpen =
              menu.classList
                .contains(
                  "show"
                );


            closeHistoryMenus();


            if (!wasOpen) {

              positionHistoryMenu(
                button,
                menu
              );

            }

          }
        );

      }
    );


  /* MENU ACTIONS */

  el.chatHistoryList
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
              button.dataset
                .action;


            const chatId =
              button.dataset
                .actionChatId;


            closeHistoryMenus();


            if (
              action === "pin"
            ) {

              togglePinChat(
                chatId
              );

            }


            if (
              action === "rename"
            ) {

              renameChat(
                chatId
              );

            }


            if (
              action === "delete"
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
   RENDER MESSAGES
   ========================================================= */

function renderMessages() {

  if (
    !el.messages
  ) {
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
        src="./assets/kilaubot-avatar.png"
        alt="Kilaubot avatar"
        class="bot-avatar"
      />

      <div>

        <h3>
          Hi ${escapeHtml(firstName)} — I’m Kilaubot.
        </h3>

        <p>
          Read the story beside me or ask a question directly.
          You can also start the quiz by typing “quiz me”.
        </p>

      </div>

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
                        src="./assets/kilaubot-avatar.png"
                        alt="Kilaubot avatar"
                        class="message-avatar"
                      />
                    `
                }


                <div class="message-content">

                  <div class="message-bubble">
                    ${formatMessageText(message.text)}
                  </div>

                  <div class="message-meta">
                    ${escapeHtml(formatTime(message.createdAt))}
                  </div>

                </div>

              </div>
            `;

          }
        )
        .join("");

  }


  el.messages.innerHTML =
    html;


  requestAnimationFrame(
    () => {

      el.messages.scrollTop =
        el.messages
          .scrollHeight;

    }
  );

}


/* =========================================================
   BACKEND
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

            message,

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


  if (
    !response.ok
  ) {

    throw new Error(
      data.error ||
      "Kilaubot could not connect."
    );

  }


  return data;

}


/* =========================================================
   SEND MESSAGE
   ========================================================= */

async function sendMessage(
  rawMessage
) {

  const message =
    String(
      rawMessage ||
      ""
    )
      .trim();


  if (
    !message ||
    state.sending
  ) {
    return;
  }


  state.sending =
    true;


  el.messageInput.value =
    "";


  resizeComposer();


  addMessage(
    "user",
    message
  );


  el.sendButton.disabled =
    true;


  el.typingIndicator
    ?.classList
    .remove(
      "hidden"
    );


  el.suggestionRow
    ?.classList
    .add(
      "hidden"
    );


  try {

    const data =
      await sendToKilaubot(
        message
      );


    addMessage(
      "bot",

      data.reply ||

      "I could not produce a response for that question."
    );

  } catch (error) {

    console.error(
      error
    );


    addMessage(
      "bot",

      `I couldn't connect to Kilaubot. ${error.message}`
    );

  } finally {

    state.sending =
      false;


    el.sendButton.disabled =
      false;


    el.typingIndicator
      ?.classList
      .add(
        "hidden"
      );


    el.suggestionRow
      ?.classList
      .remove(
        "hidden"
      );


    el.messageInput
      ?.focus();

  }

}


/* =========================================================
   INPUT RESIZE
   ========================================================= */

function resizeComposer() {

  if (
    !el.messageInput
  ) {
    return;
  }


  el.messageInput
    .style
    .height =
      "auto";


  el.messageInput
    .style
    .height =
      `${Math.min(
        el.messageInput
          .scrollHeight,
        110
      )}px`;

}


/* =========================================================
   PREFILL STORY QUESTION
   ========================================================= */

function prefillQuestion(
  question
) {

  if (
    !el.messageInput
  ) {
    return;
  }


  el.messageInput.value =
    question;


  resizeComposer();


  if (
    window.innerWidth <=
    900
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

      el.messageInput
        ?.focus();


      el.messageInput
        ?.setSelectionRange(

          el.messageInput
            .value
            .length,

          el.messageInput
            .value
            .length

        );

    },
    200
  );

}


/* =========================================================
   STORY NAV HIGHLIGHT
   ========================================================= */

function setupStoryObserver() {

  if (
    !(
      "IntersectionObserver"
      in window
    )
  ) {
    return;
  }


  const ids = [

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
    ...document
      .querySelectorAll(
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


            link.classList.toggle(

              "active",

              target ===
                visible.target.id

            );

          }
        );

      },

      {

        root:
          document
            .getElementById(
              "storyPane"
            ),


        threshold: [
          0.2,
          0.45,
          0.7
        ]

      }

    );


  ids.forEach(
    (id) => {

      const node =
        document
          .getElementById(
            id
          );


      if (node) {

        observer.observe(
          node
        );

      }

    }
  );

}


/* =========================================================
   EVENTS
   ========================================================= */

el.nameForm
  ?.addEventListener(
    "submit",
    (event) => {

      event.preventDefault();


      applyUserName(
        el.nameInput.value
      );

    }
  );


el.changeNameButton
  ?.addEventListener(
    "click",
    openNamePopup
  );


el.newChatButton
  ?.addEventListener(
    "click",
    () => {

      closeHistoryMenus();


      createChat();


      showToast(
        "New chat started"
      );


      el.appSidebar
        ?.classList
        .remove(
          "open"
        );

    }
  );


el.clearHistoryButton
  ?.addEventListener(
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


el.chatForm
  ?.addEventListener(
    "submit",
    (event) => {

      event.preventDefault();


      sendMessage(
        el.messageInput.value
      );

    }
  );


el.messageInput
  ?.addEventListener(
    "input",
    resizeComposer
  );


el.messageInput
  ?.addEventListener(
    "keydown",
    (event) => {

      if (
        event.key ===
          "Enter" &&

        !event.shiftKey
      ) {

        event.preventDefault();


        sendMessage(
          el.messageInput.value
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
              .question
          );

        }
      );

    }
  );


el.mobileMenuButton
  ?.addEventListener(
    "click",
    () => {

      el.appSidebar
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

          el.appSidebar
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


    closeHistoryMenus();

  }
);


document.addEventListener(
  "keydown",
  (event) => {

    if (
      event.key ===
      "Escape"
    ) {

      closeHistoryMenus();

    }

  }
);


window.addEventListener(
  "resize",
  closeHistoryMenus
);


window.addEventListener(
  "scroll",
  closeHistoryMenus,
  true
);


/* =========================================================
   START
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


  if (
    state.name
  ) {

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
