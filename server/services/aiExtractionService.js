const { validateCandidateTaskList, normalizeEstimatedMinutes, normalizePriority, normalizeStatus, normalizeDate } = require('./taskValidationService');

/**
 * AI Task Extraction Service for Team Member 4
 * Integrates with local Ollama running Gemma 3 4B.
 */

const getOllamaBaseUrl = () => {
  return (process.env.OLLAMA_BASE_URL || 'http://localhost:11434').replace(/\/+$/, '');
};

const getOllamaModel = () => {
  return process.env.OLLAMA_EXTRACTION_MODEL || 'gemma3:4b';
};

/**
 * Normalizes time expressions like "2 hours", "90 mins", "1.5 hr" to numeric minutes.
 */
const parseTimeInMinutes = (val) => {
  if (typeof val === 'number') return Math.round(val);
  if (!val) return 30;

  const str = String(val).toLowerCase().trim();
  const hourMatch = str.match(/(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|hour|h)/);
  if (hourMatch) {
    return Math.round(parseFloat(hourMatch[1]) * 60);
  }

  const minMatch = str.match(/(\d+)\s*(?:mins?|minutes?|m)/);
  if (minMatch) {
    return parseInt(minMatch[1], 10);
  }

  const num = Number(str);
  if (!isNaN(num) && num > 0) return Math.round(num);

  return 30;
};

/**
 * Rule-based fallback extractor in case Ollama is offline or unavailable.
 */
const fallbackRuleBasedExtraction = (text) => {
  if (!text || typeof text !== 'string') return [];

  const lines = text
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length > 0);

  const tasks = [];
  const urgentKeywords = /(urgent|asap|important|critical|high priority|must complete)/i;
  const lowKeywords = /(low priority|when possible|optional|minor|someday)/i;
  const timeRegex = /(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|hour)/i;
  const minRegex = /(\d+)\s*(?:mins?|minutes?)/i;
  const dateRegex = /(?:by|due|before|on)\s+([0-9]{1,2}(?:st|nd|rd|th)?\s+[A-Za-z]+(?:\s+\d{4})?|\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{2,4})/i;

  lines.forEach((line, idx) => {
    const cleanLine = line.replace(/^[-*•\d+.)\]\s]+/, '').trim();
    if (cleanLine.length < 3) return;

    let priority = 'MEDIUM';
    if (urgentKeywords.test(cleanLine)) priority = 'HIGH';
    else if (lowKeywords.test(cleanLine)) priority = 'LOW';

    let estimatedMinutes = 30;
    const hourMatch = cleanLine.match(timeRegex);
    if (hourMatch) {
      estimatedMinutes = Math.round(parseFloat(hourMatch[1]) * 60);
    } else {
      const minMatch = cleanLine.match(minRegex);
      if (minMatch) estimatedMinutes = parseInt(minMatch[1], 10);
    }

    let dueDate = null;
    const dateMatch = cleanLine.match(dateRegex);
    if (dateMatch) {
      const parsedDate = new Date(dateMatch[1]);
      if (!isNaN(parsedDate.getTime())) {
        dueDate = parsedDate.toISOString().split('T')[0];
      }
    }

    const titleParts = cleanLine.split(/[.;]/);
    const title = titleParts[0].trim().substring(0, 80);

    tasks.push({
      title: title || cleanLine.substring(0, 50),
      description: cleanLine,
      category: 'General',
      dueDate,
      priority,
      estimatedTime: estimatedMinutes,
      estimatedMinutes: estimatedMinutes,
      status: 'TODO'
    });
  });

  return tasks;
};

/**
 * Strips Markdown code blocks and extracts clean JSON.
 */
const sanitizeJSONResponse = (raw) => {
  if (!raw) return '';
  let cleaned = raw.trim();

  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

  const firstBracket = cleaned.indexOf('[');
  const firstBrace = cleaned.indexOf('{');

  let startIndex = -1;
  let isArray = false;

  if (firstBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace)) {
    startIndex = firstBracket;
    isArray = true;
  } else if (firstBrace !== -1) {
    startIndex = firstBrace;
    isArray = false;
  }

  if (startIndex !== -1) {
    cleaned = cleaned.substring(startIndex);
    const lastIndex = isArray ? cleaned.lastIndexOf(']') : cleaned.lastIndexOf('}');
    if (lastIndex !== -1) {
      cleaned = cleaned.substring(0, lastIndex + 1);
    }
  }

  return cleaned;
};

/**
 * Extracts structured task candidates from unstructured text via Ollama (Gemma 3 4B).
 * @param {string} text - Raw text from OCR, PDF, or direct input.
 * @returns {Promise<{ success: boolean, tasks: Array, rawText: string, model: string, usingFallback: boolean }>}
 */
const extractTasksFromText = async (text) => {
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return {
      success: true,
      tasks: [],
      rawText: text || '',
      model: 'none',
      usingFallback: false
    };
  }

  const baseUrl = getOllamaBaseUrl();
  const model = getOllamaModel();
  const currentDateISO = new Date().toISOString().split('T')[0]; // e.g. 2026-08-13

  const systemPrompt = `You are an expert AI task assistant. Your job is to extract actionable tasks from the provided text into a strictly structured JSON array.
Today's date is: ${currentDateISO}.
For relative dates like "tomorrow", "this Friday", "by 15 August", calculate the exact YYYY-MM-DD date based on today (${currentDateISO}).
Convert time expressions (e.g., "around 2 hours", "45 mins", "1 hr") to integer minutes in estimatedTime (e.g. 120).

Return ONLY a valid JSON array of objects with NO conversational filler.
Each object must follow this exact schema:
[
  {
    "title": "Machine Learning Assignment",
    "description": "Submit Machine Learning assignment.",
    "category": "Machine Learning",
    "dueDate": "2026-08-15",
    "priority": "HIGH",
    "estimatedTime": 120,
    "status": "TODO"
  }
]`;

  const userPrompt = `Extract all tasks from this text:\n\n"""\n${text.trim()}\n"""\n\nJSON Output:`;

  try {
    const response = await fetch(`${baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model,
        prompt: `${systemPrompt}\n\n${userPrompt}`,
        stream: false,
        options: {
          temperature: 0.1
        }
      }),
      signal: AbortSignal.timeout(45000)
    });

    if (!response.ok) {
      throw new Error(`Ollama responded with status ${response.status}`);
    }

    const data = await response.json();
    const sanitizedJSON = sanitizeJSONResponse(data.response);

    let parsed = null;
    try {
      parsed = JSON.parse(sanitizedJSON);
    } catch (parseErr) {
      const repaired = sanitizedJSON.replace(/,\s*([}\]])/g, '$1');
      parsed = JSON.parse(repaired);
    }

    const taskArray = Array.isArray(parsed) ? parsed : (parsed ? [parsed] : []);

    // Normalize and validate
    const validatedTasks = taskArray.map(t => {
      const timeInMin = parseTimeInMinutes(t.estimatedTime || t.estimatedMinutes);
      return {
        title: (t.title || 'Untitled Task').trim(),
        description: (t.description || '').trim(),
        category: (t.category || 'General').trim(),
        dueDate: t.dueDate ? normalizeDate(t.dueDate) : null,
        priority: normalizePriority(t.priority),
        estimatedTime: timeInMin,
        estimatedMinutes: timeInMin,
        status: normalizeStatus(t.status)
      };
    });

    const validationResult = validateCandidateTaskList(validatedTasks);

    return {
      success: true,
      tasks: validationResult.validTasks,
      invalidTasks: validationResult.invalidTasks,
      rawText: text,
      model: model,
      usingFallback: false
    };
  } catch (err) {
    console.warn(`Ollama AI extraction error: ${err.message}. Falling back to rule-based parser.`);
    const fallbackTasks = fallbackRuleBasedExtraction(text);
    const validationResult = validateCandidateTaskList(fallbackTasks);

    return {
      success: true,
      tasks: validationResult.validTasks,
      invalidTasks: validationResult.invalidTasks,
      rawText: text,
      model: 'fallback-rules',
      usingFallback: true,
      warning: `AI model (${model}) was unreachable. Smart rule-based extraction was utilized.`
    };
  }
};

module.exports = {
  extractTasksFromText,
  fallbackRuleBasedExtraction,
  parseTimeInMinutes,
  getOllamaBaseUrl,
  getOllamaModel
};
