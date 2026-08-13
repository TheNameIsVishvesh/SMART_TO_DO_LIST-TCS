const axios = require('axios');

// Default model and host from environment
const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://127.0.0.1:11434';
let activeModel = process.env.OLLAMA_MODEL || 'llama3.2:3b';

let isOllamaOnline = false;
let modelChecked = false;

// Check if Ollama is available and detect models
async function checkOllamaStatus() {
  try {
    const response = await axios.get(`${OLLAMA_HOST}/api/tags`, { timeout: 2000 });
    if (response.status === 200 && response.data && Array.isArray(response.data.models)) {
      isOllamaOnline = true;
      
      const availableModels = response.data.models.map(m => m.name);
      const envModel = process.env.OLLAMA_MODEL;

      if (!modelChecked) {
        if (envModel && (availableModels.includes(envModel) || availableModels.some(name => name.startsWith(envModel)))) {
          const exact = availableModels.find(name => name === envModel);
          activeModel = exact || availableModels.find(name => name.startsWith(envModel));
        } else if (availableModels.length > 0) {
          if (envModel) {
            console.warn(`Ollama service: Configured model "${envModel}" is not available. Available: ${availableModels.join(', ')}. Falling back to "${availableModels[0]}".`);
          }
          activeModel = availableModels[0];
        }
        modelChecked = true;
        console.log(`Ollama is online. Connected to: ${OLLAMA_HOST} using model: ${activeModel}`);
      }
    } else {
      isOllamaOnline = false;
    }
  } catch (err) {
    isOllamaOnline = false;
    if (!modelChecked) {
      console.warn(`Ollama is offline or unreachable at ${OLLAMA_HOST}. Using expert rule-based AI engine fallback.`);
      modelChecked = true;
    }
  }
  return isOllamaOnline;
}

// Perform status check on startup
checkOllamaStatus();

/**
 * Clean up text returned by LLMs (removes <think> tags, markdown codes) and parses JSON
 */
function cleanAndParseJSON(content) {
  let cleaned = content;
  
  // Strip DeepSeek-R1 thinking logs if present
  if (cleaned.includes('<think>')) {
    cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
  }
  
  // Strip Markdown JSON/text block wraps
  cleaned = cleaned.replace(/```json/gi, '');
  cleaned = cleaned.replace(/```/g, '');
  cleaned = cleaned.trim();

  try {
    return JSON.parse(cleaned);
  } catch (e) {
    console.warn('Ollama JSON parse fail, trying regex extraction...');
  }

  // Regex fallback: try to extract JSON array
  const arrayMatch = cleaned.match(/\[\s*\{[\s\S]*\}\s*\]/);
  if (arrayMatch) {
    try {
      return JSON.parse(arrayMatch[0]);
    } catch (e) {}
  }

  // Regex fallback: try to extract JSON object
  const objectMatch = cleaned.match(/\{[\s\S]*\}/);
  if (objectMatch) {
    try {
      return JSON.parse(objectMatch[0]);
    } catch (e) {}
  }

  throw new Error('Malformed AI response: Could not parse output as JSON');
}

/**
 * Fallback Rule-Based Parser for task extraction from text
 */
function fallbackExtractTasks(text) {
  const lines = text.split('\n');
  const tasks = [];
  const today = new Date();
  
  const keywords = [
    { keys: ['assignment', 'homework', 'submit', 'submission'], cat: 'Assignments', est: 90, priority: 'MEDIUM' },
    { keys: ['exam', 'test', 'quiz', 'midterm', 'final', 'internal'], cat: 'Exams', est: 180, priority: 'HIGH' },
    { keys: ['project', 'development', 'code', 'build', 'github'], cat: 'Projects', est: 240, priority: 'HIGH' },
    { keys: ['lab', 'practical', 'journal', 'viva'], cat: 'Lab Work', est: 120, priority: 'MEDIUM' },
    { keys: ['study', 'read', 'revision', 'revise', 'lecture'], cat: 'Revision', est: 60, priority: 'LOW' }
  ];

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (trimmed.length < 10) return; // Skip very short lines
    
    let matchesKeyword = false;
    let category = 'General';
    let defaultEst = 90;
    let priority = 'MEDIUM';
    
    for (const item of keywords) {
      if (item.keys.some(k => trimmed.toLowerCase().includes(k))) {
        matchesKeyword = true;
        category = item.cat;
        defaultEst = item.est;
        priority = item.priority;
        break;
      }
    }
    
    if (matchesKeyword || trimmed.startsWith('-') || trimmed.startsWith('*') || /^\d+\./.test(trimmed)) {
      const title = trimmed.replace(/^[-*\d.\s]+/, '').trim().substring(0, 80);
      if (title.length < 5) return;
      
      let dueDate = new Date();
      dueDate.setDate(today.getDate() + 3); // Default 3 days from now
      
      const dateMatches = trimmed.match(/(?:due|by|deadline)[:\s]+(\d{1,2})[-/](\d{1,2})[-/]?(\d{2,4})?/i) ||
                          trimmed.match(/(?:due|by|deadline)[:\s]+(\w{3,9})\s+(\d{1,2})/i);
      if (dateMatches) {
        try {
          const parsedDate = new Date(dateMatches[0].replace(/(due|by|deadline)[:\s]+/i, ''));
          if (!isNaN(parsedDate.getTime())) {
            dueDate = parsedDate;
          }
        } catch(e) {}
      }

      tasks.push({
        title,
        description: `Extracted from document: "${trimmed.substring(0, 150)}..."`,
        category,
        dueDate: dueDate.toISOString().split('T')[0],
        priority,
        estimatedMinutes: defaultEst,
        status: 'TODO',
        source: 'document',
        aiGenerated: true
      });
    }
  });

  if (tasks.length === 0 && text.trim().length > 0) {
    tasks.push({
      title: text.substring(0, 50).trim() + '...',
      description: text.substring(0, 500).trim(),
      category: 'General',
      dueDate: new Date(today.setDate(today.getDate() + 2)).toISOString().split('T')[0],
      priority: 'MEDIUM',
      estimatedMinutes: 120,
      status: 'TODO',
      source: 'document',
      aiGenerated: true
    });
  }

  return tasks;
}

/**
 * Fallback subtasks generator
 */
function fallbackSubtasks(title, description) {
  const t = (title || '').toLowerCase();
  const d = (description || '').toLowerCase();
  
  if (t.includes('assignment') || d.includes('assignment')) {
    return [
      { title: 'Understand assignment requirements and formatting criteria', completed: false },
      { title: 'Gather references, datasets, or lecture slides', completed: false },
      { title: 'Solve core problems or write coding segment', completed: false },
      { title: 'Draft the report or documentation', completed: false },
      { title: 'Verify answers against rubric and submit', completed: false }
    ];
  }
  if (t.includes('exam') || t.includes('test') || t.includes('preparation') || d.includes('exam')) {
    return [
      { title: 'Review key syllabus topics and lecture presentations', completed: false },
      { title: 'Solve past exams and practice problems under time limit', completed: false },
      { title: 'Compile a summary list of important formulas and concepts', completed: false },
      { title: 'Explain concepts out loud (Feynman Technique) for weak spots', completed: false }
    ];
  }
  if (t.includes('project') || t.includes('dev') || d.includes('project')) {
    return [
      { title: 'Define features, tech stack, and user stories', completed: false },
      { title: 'Set up development environment and initial codebase structure', completed: false },
      { title: 'Develop backend models, database integrations, and API routes', completed: false },
      { title: 'Create interactive React components and style them', completed: false },
      { title: 'Conduct local UI testing and fix layout bugs', completed: false }
    ];
  }
  if (t.includes('lab') || t.includes('practical') || d.includes('lab')) {
    return [
      { title: 'Read the lab workbook task specifications', completed: false },
      { title: 'Write programs or execute procedures in the lab', completed: false },
      { title: 'Format program outputs and debug any compilation errors', completed: false },
      { title: 'Prepare the laboratory report with results and conclusions', completed: false }
    ];
  }
  return [
    { title: 'Analyze requirements and outline steps', completed: false },
    { title: 'Execute main task activities', completed: false },
    { title: 'Perform self-review and sanity check', completed: false },
    { title: 'Finalize and record results', completed: false }
  ];
}

/**
 * Ollama prompt wrapper
 */
async function callOllama(prompt, systemInstruction = '', jsonMode = false) {
  try {
    const isOnline = await checkOllamaStatus();
    if (!isOnline) {
      throw new Error('Ollama offline');
    }

    const payload = {
      model: activeModel,
      messages: [],
      stream: false
    };

    if (systemInstruction) {
      payload.messages.push({ role: 'system', content: systemInstruction });
    }
    payload.messages.push({ role: 'user', content: prompt });

    if (jsonMode) {
      payload.format = 'json';
    }

    // Connect with a 15-second timeout to handle generating slow JSON outputs safely
    const response = await axios.post(`${OLLAMA_HOST}/api/chat`, payload, { timeout: 15000 });
    
    if (!response.data || !response.data.message || typeof response.data.message.content !== 'string') {
      throw new Error('Invalid response format from Ollama');
    }
    
    let content = response.data.message.content;

    if (jsonMode) {
      return cleanAndParseJSON(content);
    }
    return content;
  } catch (err) {
    console.warn(`Ollama API call error for model ${activeModel}:`, err.message);
    throw err; // Propagate error so caller falls back
  }
}

const ollamaService = {
  isAvailable: async () => checkOllamaStatus(),
  getActiveModel: () => activeModel,

  // 1. Text/Task extraction
  analyzeTasksText: async (text) => {
    try {
      const prompt = `Analyze the following raw text and extract all actionable academic tasks, syllabus elements, or assignments.
Format the output as a JSON array of task objects.
Each object must strictly have these fields:
- "title": (String, maximum 60 chars, clear name)
- "description": (String, short summary)
- "category": (String, e.g., "Exams", "Assignments", "Projects", "Lab Work", "Revision", "General")
- "dueDate": (String in YYYY-MM-DD format based on context, current date is ${new Date().toISOString().split('T')[0]})
- "priority": (String: "LOW", "MEDIUM", "HIGH")
- "estimatedMinutes": (Number, estimated work duration in minutes)

Do not include any thinking or explanation text outside the JSON array.
Text to analyze:
${text}`;

      const systemInstruction = 'You are an assistant that extracts tasks from text. You must return ONLY a valid JSON array of tasks.';
      const res = await callOllama(prompt, systemInstruction, true);
      if (Array.isArray(res)) return res;
      return fallbackExtractTasks(text);
    } catch (err) {
      return fallbackExtractTasks(text);
    }
  },

  // 2. Generate subtasks
  generateSubtasks: async (title, description) => {
    try {
      const prompt = `Task Title: ${title}
Task Description: ${description}

Break this task down into 4 to 5 clear, sequential subtasks.
Format the output as a JSON array of objects. Each object must have:
- "title": (String, action-oriented description of subtask)
- "completed": false

Do not include any thinking or commentary outside the JSON array.`;

      const systemInstruction = 'You are a task management AI. Output ONLY a valid JSON array of subtask objects.';
      const res = await callOllama(prompt, systemInstruction, true);
      if (Array.isArray(res)) return res;
      return fallbackSubtasks(title, description);
    } catch (err) {
      return fallbackSubtasks(title, description);
    }
  },

  // 3. Generate schedule
  generateSchedule: async (tasks, availableHours = 6) => {
    const availableMinutes = availableHours * 60;
    
    const generateFallbackSchedule = (taskList) => {
      const incomplete = taskList.filter(t => t.status !== 'COMPLETED');
      incomplete.sort((a, b) => {
        if (b.priorityScore !== a.priorityScore) {
          return b.priorityScore - a.priorityScore;
        }
        return new Date(a.dueDate || 0) - new Date(b.dueDate || 0);
      });

      const scheduleItems = [];
      let currentMinutes = 9 * 60; // Start at 9:00 AM
      let remainingTime = availableMinutes;

      for (const task of incomplete) {
        if (remainingTime <= 0) break;
        
        const taskMinutes = task.estimatedMinutes || 60;
        const duration = Math.min(taskMinutes, remainingTime, 180);
        
        const startHour = Math.floor(currentMinutes / 60);
        const startMin = currentMinutes % 60;
        const endMinutes = currentMinutes + duration;
        const endHour = Math.floor(endMinutes / 60);
        const endMin = endMinutes % 60;

        const formatTime = (h, m) => {
          const ampm = h >= 12 ? 'PM' : 'AM';
          const displayH = h % 12 === 0 ? 12 : h % 12;
          const displayM = m < 10 ? '0' + m : m;
          return `${displayH}:${displayM} ${ampm}`;
        };

        scheduleItems.push({
          taskId: task._id,
          taskTitle: task.title,
          timeSlot: `${formatTime(startHour, startMin)} – ${formatTime(endHour, endMin)}`,
          durationMinutes: duration,
          category: task.category,
          priority: task.priority
        });

        currentMinutes = endMinutes + 15; // 15 min break
        remainingTime -= (duration + 15);
      }

      return {
        date: new Date().toISOString().split('T')[0],
        totalAllocatedMinutes: availableMinutes - Math.max(0, remainingTime),
        schedule: scheduleItems
      };
    };

    try {
      const isOnline = await checkOllamaStatus();
      if (!isOnline) {
        return generateFallbackSchedule(tasks);
      }
      
      const taskBriefs = tasks.map(t => ({
        id: t._id,
        title: t.title,
        priority: t.priority,
        score: t.priorityScore,
        estimatedMinutes: t.estimatedMinutes,
        status: t.status
      }));

      const prompt = `Create a realistic daily study schedule for a student.
Available time: ${availableHours} hours (starting at 9:00 AM).
Task Database List:
${JSON.stringify(taskBriefs, null, 2)}

Provide the plan as a JSON object with:
- "totalAllocatedMinutes": Number
- "schedule": Array of items, each with:
  - "taskId": (String, matching the task ID)
  - "taskTitle": (String, task title)
  - "timeSlot": (String, e.g., "09:00 AM – 10:30 AM")
  - "durationMinutes": Number
  - "category": String
  - "priority": String

Order the schedule by priority score, and insert 10-15 minute breaks between activities. Keep it realistic. Do not include markdown tags, thinking logs, or explanation text outside the JSON object.`;

      const systemInstruction = 'You are a schedule coordinator. Output ONLY a valid JSON object matching the requested schema.';
      const res = await callOllama(prompt, systemInstruction, true);
      if (res && res.schedule && Array.isArray(res.schedule)) {
        return res;
      }
      return generateFallbackSchedule(tasks);
    } catch (err) {
      return generateFallbackSchedule(tasks);
    }
  },

  // 4. Chat Assistant
  chat: async (userMessage, tasks) => {
    const generateFallbackChatResponse = (msg, taskList) => {
      const cleanMsg = msg.toLowerCase();
      const incomplete = taskList.filter(t => t.status !== 'COMPLETED');
      const completed = taskList.filter(t => t.status === 'COMPLETED');
      const overdue = taskList.filter(t => t.status === 'OVERDUE');
      const highPriority = incomplete.filter(t => t.priority === 'HIGH');

      // Question: What should I complete today?
      if (cleanMsg.includes('complete today') || (cleanMsg.includes('today') && cleanMsg.includes('complete'))) {
        const todayStr = new Date().toISOString().split('T')[0];
        const dueToday = incomplete.filter(t => t.dueDate && t.dueDate.startsWith(todayStr));
        
        if (dueToday.length === 0) {
          if (incomplete.length === 0) {
            return "You have no pending tasks for today! Keep up the excellent work.";
          }
          // Suggest top tasks due soon
          const sorted = [...incomplete].sort((a, b) => b.priorityScore - a.priorityScore);
          let response = "You don't have any tasks explicitly due today. However, here are the top tasks you should focus on to stay ahead:\n\n";
          sorted.slice(0, 3).forEach((t, i) => {
            response += `${i + 1}. **${t.title}** (${t.category}, Priority: ${t.priority}) - Score: ${t.priorityScore}/100\n`;
          });
          return response;
        } else {
          let response = `You have **${dueToday.length} task(s)** due today. Here is what you should complete:\n\n`;
          dueToday.forEach((t, i) => {
            response += `${i + 1}. **${t.title}** (${t.category}) - ${t.estimatedMinutes} mins - *Reason: ${t.priorityReason || 'Due today'}*\n`;
          });
          return response;
        }
      }

      // Question: Which task is most urgent? / Which assignment should I start first?
      if (cleanMsg.includes('most urgent') || cleanMsg.includes('urgent') || cleanMsg.includes('start first') || cleanMsg.includes('focus first')) {
        if (incomplete.length === 0) {
          return "No pending tasks found! You have nothing urgent to start right now.";
        }
        
        // Filter assignments specifically if user mentioned "assignment"
        let candidates = incomplete;
        if (cleanMsg.includes('assignment')) {
          candidates = incomplete.filter(t => t.category === 'Assignments');
          if (candidates.length === 0) candidates = incomplete; // Fallback to any if no assignments
        }

        const sorted = [...candidates].sort((a, b) => b.priorityScore - a.priorityScore);
        const topTask = sorted[0];
        
        let response = `The most urgent task to tackle is **${topTask.title}** in the *${topTask.category}* category.\n\n`;
        response += `* **Priority**: ${topTask.priority} (Score: ${topTask.priorityScore}/100)\n`;
        response += `* **Due Date**: ${topTask.dueDate ? new Date(topTask.dueDate).toLocaleDateString() : 'None'}\n`;
        response += `* **Est. Time**: ${topTask.estimatedMinutes} mins\n`;
        response += `* **Reason**: ${topTask.priorityReason || 'Calculated high urgency score.'}\n\n`;
        
        if (sorted.length > 1) {
          response += `After starting this, your next priority should be **${sorted[1].title}** (Score: ${sorted[1].priorityScore}).`;
        }
        return response;
      }

      // Question: What tasks are overdue?
      if (cleanMsg.includes('overdue')) {
        if (overdue.length === 0) {
          return "Great news! You have no overdue tasks. All deadlines are currently met.";
        }
        let response = `You have **${overdue.length} overdue task(s)** that require immediate attention:\n\n`;
        overdue.forEach((t, i) => {
          const days = Math.ceil((new Date() - new Date(t.dueDate)) / (1000 * 60 * 60 * 24));
          response += `${i + 1}. **${t.title}** - was due on ${new Date(t.dueDate).toLocaleDateString()} (${days} day(s) overdue)\n`;
        });
        return response;
      }

      // Question: Create a plan for today. / plan / schedule
      if (cleanMsg.includes('plan') || cleanMsg.includes('schedule')) {
        if (incomplete.length === 0) {
          return "All tasks are completed, so there is no need to schedule tasks today! Enjoy your break.";
        }
        
        const scheduleResult = generateFallbackSchedule(taskList);
        let response = "### Recommended Study Plan & Timeline for Today:\n\n";
        scheduleResult.schedule.forEach(item => {
          response += `* **${item.timeSlot}** — **${item.taskTitle}** (${item.category}, Priority: ${item.priority})\n`;
        });
        response += `\n*Note: This timeline allocates 10-15 minute breaks between sessions. Go to the Smart Schedule tab to load this into your interactive planner.*`;
        return response;
      }

      if (cleanMsg.includes('summarize') || cleanMsg.includes('summary')) {
        if (incomplete.length === 0) {
          return "Summary: All tasks are complete! 100% completion rate.";
        }
        const categories = {};
        incomplete.forEach(t => {
          categories[t.category] = (categories[t.category] || 0) + 1;
        });

        let response = `### Study & Task Summary\n\n`;
        response += `You have **${incomplete.length} pending tasks** and **${completed.length} completed tasks** (Completion Rate: **${Math.round((completed.length / (taskList.length || 1)) * 100)}%**).\n\n`;
        response += `**Pending Categories:**\n`;
        for (const cat in categories) {
          response += `* ${cat}: ${categories[cat]} task(s)\n`;
        }
        response += `\n**Urgent Items:** You have **${highPriority.length} High Priority** tasks and **${overdue.length} Overdue** items.`;
        return response;
      }

      // Default Response
      return `Hello! I am your AI To-Do Assistant. I have loaded your task database containing **${incomplete.length} pending tasks**.\n\nHere are some questions you can ask me:\n- *"Which assignment should I start first?"*\n- *"What tasks are overdue?"*\n- *"What should I complete today?"*\n- *"Create a plan for today."*`;
    };

    try {
      const isOnline = await checkOllamaStatus();
      if (!isOnline) {
        return generateFallbackChatResponse(userMessage, tasks);
      }

      const taskBriefs = tasks.map(t => ({
        id: t._id,
        title: t.title,
        category: t.category,
        priority: t.priority,
        score: t.priorityScore,
        reason: t.priorityReason,
        status: t.status,
        dueDate: t.dueDate,
        estimatedMinutes: t.estimatedMinutes
      }));

      const prompt = `You are a smart, friendly, and professional AI University Study Assistant.
You have access to the user's task database:
${JSON.stringify(taskBriefs, null, 2)}

User Prompt: "${userMessage}"

Provide a detailed response helping the student. Be specific to their tasks. Do not output generic advice. Keep your response helpful, concise, formatted in markdown, and reference actual tasks. If they ask you to focus or choose a task, select the top task based on priorityScore. Strip any thinking block (<think>...</think>) from your final response.`;

      const systemInstruction = 'You are an academic productivity coach. Answer student questions using their task list.';
      return await callOllama(prompt, systemInstruction);
    } catch (err) {
      return generateFallbackChatResponse(userMessage, tasks);
    }
  },

  // 5. Generate structured recommendations
  recommend: async (tasks) => {
    const incomplete = tasks.filter(t => t.status !== 'COMPLETED');
    if (incomplete.length === 0) {
      return {
        topRecommendedTask: null,
        reason: 'No pending tasks left.',
        urgency: 'LOW',
        suggestedNextSteps: []
      };
    }

    const generateFallbackRecommendation = (taskList) => {
      const sorted = [...taskList].sort((a, b) => b.priorityScore - a.priorityScore);
      const topTask = sorted[0];
      const urgency = topTask.priority || 'MEDIUM';
      const reason = topTask.priorityReason || `This task has a priority score of ${topTask.priorityScore} and is currently incomplete.`;
      
      let nextSteps = [];
      if (topTask.subtasks && topTask.subtasks.length > 0) {
        nextSteps = topTask.subtasks.filter(s => !s.completed).map(s => s.title);
      }
      if (nextSteps.length === 0) {
        nextSteps = fallbackSubtasks(topTask.title, topTask.description).map(s => s.title);
      }
      nextSteps = nextSteps.slice(0, 4);

      return {
        topRecommendedTask: topTask,
        reason: reason,
        urgency: urgency,
        suggestedNextSteps: nextSteps
      };
    };

    try {
      const isOnline = await checkOllamaStatus();
      if (!isOnline) {
        return generateFallbackRecommendation(incomplete);
      }

      const taskBriefs = incomplete.map(t => ({
        id: t._id,
        title: t.title,
        description: t.description,
        priority: t.priority,
        score: t.priorityScore,
        reason: t.priorityReason,
        dueDate: t.dueDate,
        estimatedMinutes: t.estimatedMinutes
      }));

      const prompt = `Analyze the student's task database and recommend the most critical task to focus on.
Task list:
${JSON.stringify(taskBriefs, null, 2)}

Provide your analysis as a JSON object with:
- "topRecommendedTaskId": (String, matching the task ID of the selected task)
- "reason": (String, detailed explanation why this is the highest priority)
- "urgency": (String, "HIGH", "MEDIUM", or "LOW")
- "suggestedNextSteps": (Array of Strings, at least 3 specific actionable sub-steps to complete this task)

Do not include markdown tags, thinking logs, or explanation text outside the JSON object.`;

      const systemInstruction = 'You are a student productivity advisor. Output ONLY a valid JSON object matching the requested schema.';
      const res = await callOllama(prompt, systemInstruction, true);
      
      if (res && res.topRecommendedTaskId) {
        const topTask = incomplete.find(t => t._id.toString() === res.topRecommendedTaskId.toString());
        if (topTask) {
          return {
            topRecommendedTask: topTask,
            reason: res.reason || topTask.priorityReason,
            urgency: res.urgency || topTask.priority,
            suggestedNextSteps: res.suggestedNextSteps || []
          };
        }
      }
      return generateFallbackRecommendation(incomplete);
    } catch (err) {
      console.warn('Ollama recommendation generation failed, falling back:', err.message);
      return generateFallbackRecommendation(incomplete);
    }
  }
};

module.exports = ollamaService;
