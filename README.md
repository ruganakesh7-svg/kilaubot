# Kilaubot — VS Code Website

This version is built as a normal VS Code project with separate files.

## What is included

- Name popup on first visit
- Three-column desktop layout
- Mat Kilau story in the centre
- Custom Kilaubot chat UI on the right
- New Chat button
- Scrollable Previous Chats list
- Previous chats stored in browser `localStorage`
- Story buttons that pre-fill questions in the chatbot
- Responsive mobile layout
- Vercel API function that sends messages to your Dialogflow ES agent
- Dialogflow can still call your existing Apps Script / Gemini webhook

## Project structure

```text
Kilaubot_VSCode_Project/
├─ index.html
├─ styles.css
├─ app.js
├─ package.json
├─ .env.example
├─ .gitignore
├─ api/
│  └─ chat.js
└─ assets/
   └─ README.txt
```

## Important

The front end deliberately does **not** contain Google credentials.

For the custom chat + previous-chat history to work, the `/api/chat.js` Vercel function needs a Google Cloud service account that can call Dialogflow `detectIntent`.

Required Vercel environment variables:

```text
DIALOGFLOW_PROJECT_ID
GOOGLE_CLIENT_EMAIL
GOOGLE_PRIVATE_KEY
```

The project ID is already set to `kilaubot-gdtr` as a fallback.

## Preview in VS Code

You can open `index.html` with Live Server to inspect the design.

The chatbot API itself needs the Vercel function, so for a complete local test use Vercel development mode after installing packages.

```bash
npm install
npm run dev
```

## Why the chatbot is custom instead of an iframe

The normal Dialogflow Web Demo iframe does not expose its internal messages to your website JavaScript.

A custom chat interface is required if you want:

- New Chat
- Previous Chats
- Saved message history
- Restoring a previous conversation UI

This project therefore sends the message to Dialogflow through a server-side Vercel function and saves the returned user/bot messages locally in the browser.
