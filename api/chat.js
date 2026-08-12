import { GoogleAuth } from "google-auth-library";

/*
  Vercel serverless function:
  Browser -> /api/chat -> Dialogflow ES -> your existing Dialogflow webhook
  -> Gemini -> response back to website.

  IMPORTANT:
  Keep Google credentials ONLY in Vercel environment variables.
  Never place the service-account private key in app.js or index.html.
*/

const PROJECT_ID = process.env.DIALOGFLOW_PROJECT_ID || "kilaubot-gdtr";

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}

function validSessionId(value) {
  return /^[A-Za-z0-9_-]{1,36}$/.test(String(value || ""));
}

export default {
  async fetch(request) {
    if (request.method === "GET") {
      return json({
        ok: true,
        service: "kilaubot-dialogflow-bridge"
      });
    }

    if (request.method !== "POST") {
      return json({ error: "Method not allowed." }, 405);
    }

    try {
      const body = await request.json();

      const message = String(body?.message || "").trim();
      const sessionId = String(body?.sessionId || "").trim();

      if (!message) {
        return json({ error: "Message is required." }, 400);
      }

      if (message.length > 1000) {
        return json({ error: "Message is too long." }, 400);
      }

      if (!validSessionId(sessionId)) {
        return json({ error: "Invalid session ID." }, 400);
      }

      const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
      const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

      if (!clientEmail || !privateKey) {
        return json(
          {
            error:
              "Server credentials are not configured yet. Add GOOGLE_CLIENT_EMAIL and GOOGLE_PRIVATE_KEY in Vercel."
          },
          500
        );
      }

      const auth = new GoogleAuth({
        credentials: {
          client_email: clientEmail,
          private_key: privateKey
        },
        scopes: ["https://www.googleapis.com/auth/cloud-platform"]
      });

      const client = await auth.getClient();
      const tokenResult = await client.getAccessToken();
      const accessToken =
        typeof tokenResult === "string"
          ? tokenResult
          : tokenResult?.token;

      if (!accessToken) {
        throw new Error("Could not obtain Google access token.");
      }

      const url =
        `https://dialogflow.googleapis.com/v2/projects/` +
        `${encodeURIComponent(PROJECT_ID)}/agent/sessions/` +
        `${encodeURIComponent(sessionId)}:detectIntent`;

      const dialogflowResponse = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json; charset=utf-8"
        },
        body: JSON.stringify({
          queryInput: {
            text: {
              text: message,
              languageCode: "en"
            }
          }
        })
      });

      const data = await dialogflowResponse.json();

      if (!dialogflowResponse.ok) {
        console.error("Dialogflow error:", data);

        return json(
          {
            error:
              data?.error?.message ||
              "Dialogflow returned an error."
          },
          dialogflowResponse.status
        );
      }

      const result = data?.queryResult || {};

      const reply =
        result.fulfillmentText ||
        result.fulfillmentMessages?.[0]?.text?.text?.[0] ||
        "I understood your question, but no response text was returned.";

      return json({
        reply,
        intent: result.intent?.displayName || null,
        confidence: result.intentDetectionConfidence ?? null
      });
    } catch (error) {
      console.error(error);

      return json(
        {
          error:
            error?.message ||
            "Unexpected Kilaubot server error."
        },
        500
      );
    }
  }
};
