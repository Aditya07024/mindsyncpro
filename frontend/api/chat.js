const CRISIS_KEYWORDS = [
  "want to die",
  "kill myself",
  "end my life",
  "suicide",
  "can't go on",
  "cant go on",
  "hurt myself",
  "self harm",
  "self-harm",
  "no reason to live",
];

function detectCrisis(text) {
  const lower = text.toLowerCase();
  return CRISIS_KEYWORDS.some((kw) => lower.includes(kw));
}

const SYSTEM_PROMPT = `You are Manas, a warm, caring AI mental wellness companion built for Indians by mymindtherapyfriend.

CORE BEHAVIOUR:
- Always disclose you are AI when asked. Never pretend to be human.
- Never diagnose conditions. Never give medical advice.
- Keep responses under 150 words. Always end with one thoughtful, gentle follow-up question.
- Apply CBT principles softly: help the person notice automatic thoughts and consider gentler reframes. Never lecture.
- Tone: a wise older friend who listens deeply. Warm. Patient. Not clinical, not corporate.
- Use natural Indian context where it fits: family expectations, academic pressure, career stress, joint family dynamics, marriage, festivals.
- It's okay to use a Hindi/Hinglish word occasionally if it adds warmth (dil, mann, theek hai), but mostly English.
- If the user mentions self-harm, suicide, or being unsafe: respond with extra care, validate the pain, and remind them that MANAS (14416 / 1800891446) is available to talk to a trained human right now.

NEVER:
- Recommend specific medications.
- Tell anyone "you have depression/anxiety/ADHD/etc."
- Be preachy or moralistic.
- Use emoji-heavy language. One subtle emoji at most.

START every response by acknowledging the feeling first, then gently exploring.`;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  let body;
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
  } catch {
    body = {};
  }

  const messages = Array.isArray(body?.messages) ? body.messages : [];
  const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
  const isCrisis = lastUserMsg
    ? detectCrisis(String(lastUserMsg.content || ""))
    : false;

  const fullMessages = [
    {
      role: "system",
      content:
        SYSTEM_PROMPT +
        (isCrisis
          ? "\n\n[SAFETY ALERT: User may be in crisis. Lead with deep validation. Mention MANAS 14416 / 1800891446. Suggest a slow breath. Stay with them.]"
          : ""),
    },
    ...messages.map((m) => ({
      role: m.role,
      content: String(m.content ?? ""),
    })),
  ];

  const groqKey = process.env.GROQ_API_KEY;
  const geminiKey = process.env.GOOGLE_GEMINI_API_KEY;

  // Try Groq first
  if (groqKey) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const groqRes = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${groqKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: fullMessages,
            stream: true,
            temperature: 0.7,
            max_tokens: 400,
          }),
          signal: controller.signal,
        },
      );
      clearTimeout(timeout);
      if (groqRes.ok && groqRes.body) {
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("X-Crisis", isCrisis ? "1" : "0");
        res.setHeader("X-Provider", "groq");

        const reader = groqRes.body.getReader();
        try {
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            res.write(Buffer.from(value));
          }
        } finally {
          res.end();
        }
        return;
      }
      console.error(
        "Groq failed",
        groqRes.status,
        await groqRes.text().catch(() => ""),
      );
    } catch (e) {
      console.error("Groq error", e);
    }
  }

  // Fallback: Gemini → emit OpenAI-compatible SSE
  if (geminiKey) {
    try {
      const contents = fullMessages
        .filter((m) => m.role !== "system")
        .map((m) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        }));
      const sysInstr = fullMessages.find((m) => m.role === "system")?.content;
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:streamGenerateContent?alt=sse&key=${geminiKey}`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const gRes = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: sysInstr
            ? { parts: [{ text: sysInstr }] }
            : undefined,
          contents,
          generationConfig: { temperature: 0.7, maxOutputTokens: 400 },
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!gRes.ok || !gRes.body) {
        const errTxt = await gRes.text().catch(() => "");
        res.status(502).json({ error: "AI unavailable", details: errTxt });
        return;
      }

      // Transform Gemini SSE → OpenAI delta SSE
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("X-Crisis", isCrisis ? "1" : "0");
      res.setHeader("X-Provider", "gemini");

      const reader = gRes.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          let idx;
          while ((idx = buf.indexOf("\n")) !== -1) {
            const line = buf.slice(0, idx).trim();
            buf = buf.slice(idx + 1);
            if (!line.startsWith("data: ")) continue;
            const json = line.slice(6);
            if (json === "[DONE]") continue;
            try {
              const parsed = JSON.parse(json);
              const text =
                parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
              if (text) {
                const chunk = {
                  choices: [{ delta: { content: text } }],
                };
                res.write(`data: ${JSON.stringify(chunk)}\n\n`);
              }
            } catch {
              // skip malformed chunks
            }
          }
        }
        res.write("data: [DONE]\n\n");
      } finally {
        res.end();
      }
      return;
    } catch (e) {
      console.error("Gemini error", e);
    }
  }

  res
    .status(503)
    .json({
      error:
        "No AI provider available. Add GROQ_API_KEY or GOOGLE_GEMINI_API_KEY.",
    });
}
