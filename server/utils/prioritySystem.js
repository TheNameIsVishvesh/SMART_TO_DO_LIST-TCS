/**
 * Utility to calculate task priority score and explainable reasons.
 */

function calculatePriority(task) {
  // If completed, priority score is 0 and it's classified as LOW priority
  if (task.status === 'COMPLETED') {
    return {
      score: 0,
      reason: 'Task is completed and requires no further action.',
      priority: 'LOW'
    };
  }

  let importanceScore = 0;
  let userPriority = task.priority || 'MEDIUM';
  if (userPriority === 'HIGH') importanceScore = 40;
  else if (userPriority === 'MEDIUM') importanceScore = 25;
  else if (userPriority === 'LOW') importanceScore = 10;

  let deadlineScore = 0;
  let deadlineReason = 'no deadline set';
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  let isOverdue = false;
  let daysDiff = null;

  if (task.dueDate) {
    const due = new Date(task.dueDate);
    due.setHours(0, 0, 0, 0);
    const msDiff = due - now;
    daysDiff = Math.ceil(msDiff / (1000 * 60 * 60 * 24));

    if (daysDiff < 0) {
      isOverdue = true;
      deadlineScore = 35;
      deadlineReason = `overdue by ${Math.abs(daysDiff)} day(s)`;
    } else if (daysDiff === 0) {
      deadlineScore = 40;
      deadlineReason = 'due today';
    } else if (daysDiff === 1) {
      deadlineScore = 30;
      deadlineReason = 'due tomorrow';
    } else if (daysDiff <= 3) {
      deadlineScore = 20;
      deadlineReason = `due in ${daysDiff} days`;
    } else if (daysDiff <= 7) {
      deadlineScore = 10;
      deadlineReason = `due in ${daysDiff} days`;
    } else {
      deadlineScore = 0;
      deadlineReason = `due in ${daysDiff} days`;
    }
  }

  let overdueScore = 0;
  if (isOverdue || task.status === 'OVERDUE') {
    overdueScore = 20;
  }

  let effortScore = 0;
  const minutes = task.estimatedMinutes || 0;
  if (minutes >= 180) {
    effortScore = 15; // Requires significant effort, should start early
  } else if (minutes >= 60) {
    effortScore = 10;
  } else if (minutes > 0) {
    effortScore = 5;
  }

  let statusScore = 0;
  if (task.status === 'TODO') {
    statusScore = 10;
  } else if (task.status === 'IN_PROGRESS') {
    statusScore = 5; // Slightly less urgent to start, but needs completion
  }

  // Priority Score = deadline urgency + importance + overdue factor + effort factor + status factor
  const totalScore = importanceScore + deadlineScore + overdueScore + effortScore + statusScore;
  
  // Normalize score to be strictly between 0 and 100
  const normalizedScore = Math.min(100, Math.max(0, totalScore));

  // Classify Priority based on normalized score
  let calculatedPriority = 'LOW';
  if (normalizedScore >= 70) {
    calculatedPriority = 'HIGH';
  } else if (normalizedScore >= 40) {
    calculatedPriority = 'MEDIUM';
  }

  // Generate explainable reason
  let reason = '';
  if (isOverdue) {
    reason = `High priority because the task is overdue by ${Math.abs(daysDiff)} day(s) and is incomplete.`;
  } else if (daysDiff === 0) {
    reason = `Critical priority because the deadline is TODAY.`;
  } else if (daysDiff === 1) {
    reason = `High priority because the task is due tomorrow and requires ${minutes > 0 ? minutes + ' minutes' : 'attention'}.`;
  } else if (calculatedPriority === 'HIGH' && userPriority === 'HIGH') {
    reason = `High priority due to manual high importance rating and upcoming deadline (${deadlineReason}).`;
  } else if (calculatedPriority === 'HIGH' && minutes >= 180) {
    reason = `High priority because the task requires a large time commitment (${Math.round(minutes/60)} hrs) and is due soon.`;
  } else if (calculatedPriority === 'MEDIUM') {
    reason = `Medium priority task. It is ${deadlineReason} with a ${userPriority.toLowerCase()} importance level.`;
  } else {
    reason = `Low priority. It has a relaxed timeline (${deadlineReason}) and a ${userPriority.toLowerCase()} importance rating.`;
  }

  return {
    score: normalizedScore, // compatible with existing taskRepository
    reason: reason,        // compatible with existing taskRepository
    priority: calculatedPriority,
    priorityScore: normalizedScore,
    priorityReason: reason
  };
}

module.exports = {
  calculatePriority
};
