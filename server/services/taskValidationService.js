/**
 * Task Validation & Sanitization Engine
 * Validates candidate tasks before review or database insertion.
 */

const normalizePriority = (val) => {
  if (!val) return 'MEDIUM';
  const upper = String(val).trim().toUpperCase();
  if (['LOW', 'MEDIUM', 'HIGH'].includes(upper)) return upper;
  if (upper.includes('URGENT') || upper.includes('CRITICAL') || upper.includes('HIGH')) return 'HIGH';
  if (upper.includes('LOW') || upper.includes('MINOR')) return 'LOW';
  return 'MEDIUM';
};

const normalizeStatus = (val) => {
  if (!val) return 'TODO';
  const upper = String(val).trim().toUpperCase().replace(/[\s-]+/g, '_');
  if (['TODO', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE'].includes(upper)) return upper;
  if (upper.includes('DONE') || upper.includes('FINISH')) return 'COMPLETED';
  if (upper.includes('PROG')) return 'IN_PROGRESS';
  return 'TODO';
};

const normalizeDate = (val) => {
  if (!val) return null;
  const d = new Date(val);
  if (isNaN(d.getTime())) return null;
  return d.toISOString();
};

const normalizeEstimatedMinutes = (val) => {
  if (val === undefined || val === null || val === '') return 30;
  const num = Number(val);
  if (isNaN(num) || num < 0) return 30;
  return Math.min(Math.round(num), 10080); // Cap at 7 days max
};

/**
 * Validates and sanitizes a single task candidate.
 * @param {object} rawTask
 * @param {number} index
 * @returns {{ isValid: boolean, task: object, errors: string[], warnings: string[] }}
 */
const validateCandidateTask = (rawTask, index = 1) => {
  const errors = [];
  const warnings = [];

  if (!rawTask || typeof rawTask !== 'object') {
    return {
      isValid: false,
      task: null,
      errors: [`Item #${index}: Task data must be a valid JSON object.`],
      warnings: []
    };
  }

  // 1. Title
  const title = (rawTask.title || rawTask.name || rawTask.task || '').trim();
  if (!title) {
    errors.push(`Item #${index}: Title is required.`);
  }

  // 2. Priority
  const priority = normalizePriority(rawTask.priority);

  // 3. Status
  const status = normalizeStatus(rawTask.status);

  // 4. Due Date / Deadline
  const rawDate = rawTask.dueDate || rawTask.deadline || rawTask.due_date || rawTask.due;
  let dueDate = null;
  if (rawDate) {
    dueDate = normalizeDate(rawDate);
    if (!dueDate) {
      warnings.push(`Item #${index}: Unrecognized date '${rawDate}', reset to none.`);
    }
  }

  // 5. Estimated Minutes
  const rawMinutes = rawTask.estimatedMinutes || rawTask.estimatedTime || rawTask.duration || rawTask.time;
  const estimatedMinutes = normalizeEstimatedMinutes(rawMinutes);

  // 6. Category
  const category = (rawTask.category || rawTask.tag || rawTask.type || 'General').trim() || 'General';

  // 7. Description
  const description = (rawTask.description || rawTask.desc || rawTask.notes || '').trim();

  // 8. Tags
  let tags = [];
  if (Array.isArray(rawTask.tags)) {
    tags = rawTask.tags.map(t => String(t).trim()).filter(Boolean);
  } else if (typeof rawTask.tags === 'string' && rawTask.tags.trim()) {
    tags = rawTask.tags.split(',').map(t => t.trim()).filter(Boolean);
  }

  const sanitizedTask = {
    id: rawTask.id || `task-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    title,
    description,
    category,
    priority,
    status,
    dueDate,
    estimatedMinutes,
    tags,
    source: rawTask.source || 'ai_extraction',
    aiGenerated: rawTask.aiGenerated !== undefined ? Boolean(rawTask.aiGenerated) : true,
    extractedText: rawTask.extractedText || ''
  };

  return {
    isValid: errors.length === 0,
    task: sanitizedTask,
    errors,
    warnings
  };
};

/**
 * Validates a list of candidate tasks.
 * @param {Array<object>} tasks
 * @returns {{ validTasks: Array, invalidTasks: Array, total: number }}
 */
const validateCandidateTaskList = (tasks) => {
  if (!Array.isArray(tasks)) {
    return { validTasks: [], invalidTasks: [], total: 0 };
  }

  const validTasks = [];
  const invalidTasks = [];

  tasks.forEach((t, idx) => {
    const result = validateCandidateTask(t, idx + 1);
    if (result.isValid) {
      validTasks.push({
        ...result.task,
        warnings: result.warnings
      });
    } else {
      invalidTasks.push({
        index: idx + 1,
        raw: t,
        errors: result.errors
      });
    }
  });

  return {
    total: tasks.length,
    validCount: validTasks.length,
    invalidCount: invalidTasks.length,
    validTasks,
    invalidTasks
  };
};

module.exports = {
  validateCandidateTask,
  validateCandidateTaskList,
  normalizePriority,
  normalizeStatus,
  normalizeDate,
  normalizeEstimatedMinutes
};
