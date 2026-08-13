const fs = require('fs');
const csvParser = require('csv-parser');

/**
 * Normalizes CSV headers to standard Task schema fields.
 */
const normalizeHeader = (header) => {
  if (!header) return '';
  const clean = header.trim().toLowerCase().replace(/[\s_-]+/g, '');
  
  if (clean === 'title' || clean === 'task' || clean === 'taskname' || clean === 'name') return 'title';
  if (clean === 'description' || clean === 'desc' || clean === 'details' || clean === 'notes') return 'description';
  if (clean === 'category' || clean === 'tag' || clean === 'type' || clean === 'project') return 'category';
  if (clean === 'duedate' || clean === 'deadline' || clean === 'due' || clean === 'targetdate') return 'dueDate';
  if (clean === 'priority' || clean === 'urgency' || clean === 'importance') return 'priority';
  if (clean === 'estimatedtime' || clean === 'estimatedminutes' || clean === 'duration' || clean === 'estimate' || clean === 'time') return 'estimatedTime';
  if (clean === 'status' || clean === 'state') return 'status';

  return header.trim();
};

/**
 * Validates and sanitizes a single parsed CSV row.
 */
const validateRow = (rawRow, rowIndex) => {
  const errors = [];
  const normalized = {};

  // Map fields from rawRow using header normalization
  for (const [key, val] of Object.entries(rawRow)) {
    const normKey = normalizeHeader(key);
    normalized[normKey] = typeof val === 'string' ? val.trim() : val;
  }

  // 1. Title Validation (Required)
  const title = normalized.title;
  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    errors.push('Title is required and cannot be empty.');
  }

  // 2. Priority Validation (Allowed: HIGH, MEDIUM, LOW)
  let priority = 'MEDIUM';
  if (normalized.priority) {
    const prioUpper = String(normalized.priority).trim().toUpperCase();
    if (['LOW', 'MEDIUM', 'HIGH'].includes(prioUpper)) {
      priority = prioUpper;
    } else {
      errors.push(`Invalid priority '${normalized.priority}'. Allowed values: LOW, MEDIUM, HIGH.`);
    }
  }

  // 3. Status Validation (Allowed: TODO, PENDING, IN_PROGRESS, COMPLETED, OVERDUE)
  let status = 'TODO';
  if (normalized.status) {
    const statusUpper = String(normalized.status).trim().toUpperCase().replace(/[\s-]+/g, '_');
    if (['TODO', 'PENDING', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE'].includes(statusUpper)) {
      status = statusUpper === 'PENDING' ? 'TODO' : statusUpper;
    } else {
      errors.push(`Invalid status '${normalized.status}'. Allowed values: TODO, PENDING, IN_PROGRESS, COMPLETED, OVERDUE.`);
    }
  }

  // 4. Due Date Validation
  let dueDate = null;
  if (normalized.dueDate) {
    const parsedDate = new Date(normalized.dueDate);
    if (isNaN(parsedDate.getTime())) {
      errors.push(`Invalid dueDate format '${normalized.dueDate}'.`);
    } else {
      dueDate = parsedDate.toISOString().split('T')[0]; // Format YYYY-MM-DD
    }
  }

  // 5. Estimated Time Validation (Minutes, non-negative number)
  let estimatedTime = 30;
  if (normalized.estimatedTime !== undefined && normalized.estimatedTime !== null && normalized.estimatedTime !== '') {
    const parsedMinutes = Number(normalized.estimatedTime);
    if (isNaN(parsedMinutes) || parsedMinutes < 0) {
      errors.push(`Invalid estimatedTime '${normalized.estimatedTime}'. Must be a non-negative number.`);
    } else {
      estimatedTime = Math.round(parsedMinutes);
    }
  }

  // 6. Category & Description
  const category = normalized.category || 'General';
  const description = normalized.description || '';

  if (errors.length > 0) {
    return {
      isValid: false,
      row: rowIndex,
      raw: rawRow,
      errors
    };
  }

  return {
    isValid: true,
    row: rowIndex,
    task: {
      title,
      description,
      category,
      dueDate,
      priority,
      estimatedTime,
      estimatedMinutes: estimatedTime,
      status
    }
  };
};

/**
 * Parses a CSV file from disk and segregates valid and invalid rows.
 */
const parseCSVFile = (filePath) => {
  return new Promise((resolve, reject) => {
    const validRows = [];
    const invalidRows = [];
    let rowIndex = 0;

    const stream = fs.createReadStream(filePath)
      .pipe(csvParser({
        mapHeaders: ({ header }) => normalizeHeader(header)
      }))
      .on('data', (row) => {
        rowIndex++;
        // Ignore completely blank rows
        const hasContent = Object.values(row).some(v => v && String(v).trim().length > 0);
        if (!hasContent) return;

        const validation = validateRow(row, rowIndex);
        if (validation.isValid) {
          validRows.push(validation.task);
        } else {
          invalidRows.push({
            row: validation.row,
            errors: validation.errors
          });
        }
      })
      .on('end', () => {
        resolve({
          success: true,
          totalRows: rowIndex,
          validCount: validRows.length,
          invalidCount: invalidRows.length,
          validRows,
          invalidRows
        });
      })
      .on('error', (err) => {
        reject(new Error(`CSV parsing error: ${err.message}`));
      });
  });
};

module.exports = {
  parseCSVFile,
  validateRow,
  normalizeHeader
};
