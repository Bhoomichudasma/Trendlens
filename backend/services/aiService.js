const axios = require('axios');
require('dotenv').config();

const AI_PROVIDER = (process.env.AI_PROVIDER || 'groq').toLowerCase();
const GROQ_API_KEY = process.env.GROQ_API_KEY;

function extractFirstJsonObject(text) {
  if (!text) return null;
  
  const str = String(text).trim();
  
  // Try to extract JSON from markdown code block first (```json {...}```)
  const codeBlockMatch = str.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (codeBlockMatch) {
    try {
      return JSON.parse(codeBlockMatch[1].trim());
    } catch (e) {
      // Fall through to regular extraction
    }
  }
  
  // Regular extraction: find first { and last }
  const start = str.indexOf('{');
  const end = str.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  
  const slice = str.slice(start, end + 1);
  try {
    return JSON.parse(slice);
  } catch (e) {
    // Try to fix common JSON issues
    let fixed = slice;
    
    // Fix trailing commas in objects/arrays
    fixed = fixed.replace(/,(\s*[}\]])/g, '$1');
    
    try {
      return JSON.parse(fixed);
    } catch (e2) {
      return null;
    }
  }
}

async function callGroqChatCompletion({ model, messages }) {
  if (!GROQ_API_KEY) {
    throw new Error('Missing GROQ_API_KEY for Groq AI provider.');
  }

  // Groq is OpenAI-compatible; use /openai/v1/chat/completions.
  const url = 'https://api.groq.com/openai/v1/chat/completions';

  try {
    const response = await axios.post(
      url,
      {
        model,
        messages,
        temperature: 0.2,
      },
      {
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 45_000,
      }
    );

    return response.data;
  } catch (err) {
    console.error(`[Groq API] Error: ${err.message}`);
    if (err.response?.status) {
      console.error(`[Groq API] Status: ${err.response.status}`);
      console.error(`[Groq API] Response:`, err.response.data);
    }
    throw err;
  }
}

async function callHuggingFace({ model, messages }) {
  // Minimal fallback implementation using the free Inference API.
  // We only keep this as a best-effort fallback; output quality depends on model.
  const HF_API_KEY = process.env.HUGGINGFACE_API_KEY;
  if (!HF_API_KEY) throw new Error('Missing HUGGINGFACE_API_KEY for fallback provider.');

  // Convert chat messages to a plain prompt.
  const prompt = messages
    .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
    .join('\n\n');

  const hfModel = model || process.env.HF_MODEL || 'meta-llama/Meta-Llama-3-8B-Instruct';

  const response = await axios.post(
    `https://api-inference.huggingface.co/models/${encodeURIComponent(hfModel)}`,
    { inputs: prompt, parameters: { max_new_tokens: 1200, return_full_text: false } },
    {
      headers: {
        Authorization: `Bearer ${HF_API_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: 60_000,
    }
  );

  return response.data;
}

async function generateStructuredJson({ model, systemPrompt, userPrompt }) {
  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];

  const provider = AI_PROVIDER;

  if (provider === 'groq') {
    console.log(`[Groq] Sending request to model: ${model}`);
    console.log(`[Groq] Prompt sizes: System=${systemPrompt.length} | User=${userPrompt.length} | Total=${systemPrompt.length + userPrompt.length} chars`);
    
    try {
      const groqResp = await callGroqChatCompletion({ model, messages });
      const content = groqResp?.choices?.[0]?.message?.content;
      
      console.log(`[Groq] Response received: ${content?.length || 0} chars`);
      
      const parsed = extractFirstJsonObject(content);
      if (!parsed) {
        console.error('[Groq] ❌ Failed to extract JSON. Response preview:');
        console.error(content?.slice(0, 300) || 'NO CONTENT');
        throw new Error('Groq did not return valid JSON.');
      }
      
      console.log(`[Groq] ✅ Successfully parsed JSON with keys: ${Object.keys(parsed).join(', ')}`);
      return parsed;
    } catch (err) {
      console.error(`[Groq] ❌ Error: ${err.message}`);
      throw err;
    }
  }

  if (provider === 'huggingface') {
    const hfResp = await callHuggingFace({ model, messages });
    const content = Array.isArray(hfResp) ? hfResp?.[0]?.generated_text : hfResp?.generated_text;
    const parsed = extractFirstJsonObject(content);
    if (!parsed) throw new Error('HuggingFace did not return valid JSON.');
    return parsed;
  }

  throw new Error(`Unknown AI_PROVIDER: ${AI_PROVIDER}`);
}

module.exports = {
  generateStructuredJson,
};

