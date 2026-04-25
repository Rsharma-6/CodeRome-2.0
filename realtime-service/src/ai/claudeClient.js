const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const SYSTEM_PROMPTS = {
  hint: `You are a collaborative AI pair programmer helping a team solve coding problems.
You give hints that guide thinking without giving away the solution.
Hints are progressively more revealing: hint 1 = conceptual nudge, hint 2 = approach, hint 3 = near-solution pseudocode.
Be concise, encouraging, and team-focused. Address "the team" not just one person.`,

  review: `You are a senior software engineer reviewing code written by a team.
For ACCEPTED solutions: review code quality, time/space complexity, and suggest optimizations.
For WRONG_ANSWER or TLE: explain why it failed and guide the fix without giving the solution.
Be constructive and educational. Address the whole team.`,

  explain: `You are explaining code to a mixed-skill team.
One person may be senior, another junior. Calibrate your explanation to be accessible to a beginner
while still being insightful for someone more experienced.
Use analogies, plain language, and step-by-step reasoning.`,

  interview: `You are a technical interviewer conducting a mock interview for a team.
Ask questions like: "Walk me through your approach", "What's the time complexity?", "How would you handle edge cases?"
Be professional but encouraging. Give joint feedback at the end.`,

  complexity: `You are a computer science expert analysing code complexity for a team.
Analyse the provided code and return ONLY valid JSON (no markdown fences, no extra text) matching this exact schema:
{
  "timeComplexity": "O(...)",
  "spaceComplexity": "O(...)",
  "explanation": "markdown string explaining why",
  "breakdown": [
    { "operation": "description", "time": "O(...)", "space": "O(...)" }
  ]
}
Use standard Big-O notation: O(1), O(log n), O(n), O(n log n), O(n²), O(n³), O(2^n), O(n!).
Be precise about the dominant term. Address the whole team.`,
};

// Stream a Gemini response and emit each token via callback
async function streamResponse(type, contextMessages, onToken, onDone, onError) {
  const systemPrompt = SYSTEM_PROMPTS[type] || SYSTEM_PROMPTS.hint;

  try {
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || 'gemini-2.0-flash-lite',
      systemInstruction: systemPrompt,
    });

    // Convert Anthropic format → Gemini format (role 'assistant' → 'model')
    const geminiMessages = contextMessages.map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

    const history = geminiMessages.slice(0, -1);
    const lastMessage = geminiMessages[geminiMessages.length - 1].parts[0].text;

    const chat = model.startChat({ history });
    const result = await chat.sendMessageStream(lastMessage);

    for await (const chunk of result.stream) {
      const token = chunk.text();
      if (token) onToken(token);
    }

    onDone();
  } catch (err) {
    onError(err);
  }
}

// Build context messages for different AI feature types
function buildMessages({ type, problem, code, language, hintNumber, previousHints, conversationHistory }) {
  const messages = [];

  if (type === 'hint') {
    const hintContext = previousHints && previousHints.length > 0
      ? `\nPrevious hints given:\n${previousHints.map((h, i) => `Hint ${i + 1}: ${h}`).join('\n')}`
      : '';

    messages.push({
      role: 'user',
      content: `Problem:\n${problem?.description || 'Unknown problem'}\n\nCurrent team code (${language}):\n\`\`\`${language}\n${code}\n\`\`\`${hintContext}\n\nPlease give hint #${hintNumber || 1}.`,
    });
  } else if (type === 'review') {
    messages.push({
      role: 'user',
      content: `Problem:\n${problem?.description || 'Unknown problem'}\n\nTeam submission (${language}):\n\`\`\`${language}\n${code}\n\`\`\`\n\nPlease review this code.`,
    });
  } else if (type === 'explain') {
    messages.push({
      role: 'user',
      content: `Please explain the following code to our team:\n\n\`\`\`${language}\n${code}\n\`\`\``,
    });
  } else if (type === 'interview') {
    const history = conversationHistory || [];
    if (history.length === 0) {
      messages.push({
        role: 'user',
        content: `We're working on this problem:\n${problem?.description || 'Unknown problem'}\n\nOur current code:\n\`\`\`${language}\n${code}\n\`\`\`\n\nPlease start the mock interview.`,
      });
    } else {
      messages.push(...history);
    }
  } else if (type === 'complexity') {
    messages.push({
      role: 'user',
      content: `Please analyse the time and space complexity of our code:\n\n\`\`\`${language}\n${code}\n\`\`\`\n\nReturn ONLY the JSON response as specified.`,
    });
  }

  return messages;
}

module.exports = { streamResponse, buildMessages };
