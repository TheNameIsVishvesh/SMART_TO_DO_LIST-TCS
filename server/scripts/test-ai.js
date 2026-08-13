const assert = require('assert');
const path = require('path');
const axios = require('axios');
const db = require('../utils/db');
const taskRepository = require('../services/taskRepository');
const prioritySystem = require('../utils/prioritySystem');
const ollamaService = require('../services/ollamaService');
const aiController = require('../controllers/aiController');

// Backup axios methods for mocking
const originalGet = axios.get;
const originalPost = axios.post;

function mockAxios(getFn, postFn) {
  if (getFn) axios.get = getFn;
  if (postFn) axios.post = postFn;
}

function restoreAxios() {
  axios.get = originalGet;
  axios.post = originalPost;
}

// Helper to create mock response
const mockResponse = (data, status = 200) => ({
  status,
  data
});

async function runTests() {
  console.log('==================================================');
  console.log('  STARTING AI ENGINE & PRIORITIZATION TEST SUITE  ');
  console.log('==================================================\n');

  // Initialize DB connection (fallback to local json store if mongo is down)
  console.log('Step 1: Connecting to database...');
  await db.connectDB();
  console.log(`Database initialized in "${taskRepository.getDbMode()}" mode.\n`);

  try {
    // ----------------------------------------------------
    // TEST 1: Smart Priority Calculation
    // ----------------------------------------------------
    console.log('--- Test 1: Smart Priority Calculations ---');
    
    // Clear repository
    await taskRepository.deleteMany({});

    const todayStr = new Date().toISOString().split('T')[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 2);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const testTasks = [
      {
        title: 'Overdue Task',
        priority: 'HIGH',
        status: 'TODO',
        dueDate: yesterdayStr,
        estimatedMinutes: 120
      },
      {
        title: 'Due Today Task',
        priority: 'MEDIUM',
        status: 'TODO',
        dueDate: todayStr,
        estimatedMinutes: 60
      },
      {
        title: 'Completed Task',
        priority: 'HIGH',
        status: 'COMPLETED',
        dueDate: yesterdayStr,
        estimatedMinutes: 180
      },
      {
        title: 'Future Low Effort Task',
        priority: 'LOW',
        status: 'TODO',
        dueDate: tomorrowStr,
        estimatedMinutes: 30
      }
    ];

    const seededTasks = await taskRepository.insertMany(testTasks);
    
    // Validate Overdue Task score & reason
    const overdueTask = seededTasks.find(t => t.title === 'Overdue Task');
    assert.ok(overdueTask.priorityScore > 70, 'Overdue task should have a high score');
    assert.strictEqual(overdueTask.status, 'OVERDUE', 'Overdue task status should be automatically updated to OVERDUE');
    assert.ok(overdueTask.priorityReason.includes('overdue'), 'Priority reason should mention task is overdue');

    // Validate Due Today Task
    const todayTask = seededTasks.find(t => t.title === 'Due Today Task');
    assert.ok(todayTask.priorityScore >= 70, 'Today task should have high score');
    assert.ok(todayTask.priorityReason.includes('TODAY'), 'Priority reason should mention due TODAY');

    // Validate Completed Task has score 0 and computed priority LOW
    const completedTask = seededTasks.find(t => t.title === 'Completed Task');
    assert.strictEqual(completedTask.priorityScore, 0, 'Completed task score should be 0');
    const completedCalc = prioritySystem.calculatePriority(completedTask);
    assert.strictEqual(completedCalc.priority, 'LOW', 'Completed task calculated priority should be LOW');

    console.log('✅ Priority calculation and status checks passed.\n');

    // ----------------------------------------------------
    // TEST 2: Empty Task List
    // ----------------------------------------------------
    console.log('--- Test 2: Empty Task List Response ---');
    await taskRepository.deleteMany({});
    
    const mockReqEmpty = { body: {} };
    let jsonResultEmpty = null;
    const mockResEmpty = {
      json: (data) => { jsonResultEmpty = data; }
    };
    
    await aiController.recommendTasks(mockReqEmpty, mockResEmpty);
    assert.strictEqual(jsonResultEmpty.topRecommendedTask, null, 'Empty list should return null topRecommendedTask');
    assert.strictEqual(jsonResultEmpty.urgency, 'LOW', 'Empty list should return LOW urgency');
    assert.deepStrictEqual(jsonResultEmpty.suggestedNextSteps, [], 'Empty list should return empty next steps');
    
    console.log('✅ Empty task list verification passed.\n');

    // Seed tasks for remaining API tests
    await taskRepository.insertMany(testTasks);

    // ----------------------------------------------------
    // TEST 3: Ollama Available (Mocked Response)
    // ----------------------------------------------------
    console.log('--- Test 3: Ollama Service Online (Success Scenario) ---');
    
    // Mock Axios responses
    mockAxios(
      async (url) => {
        if (url.includes('/api/tags')) {
          return mockResponse({
            models: [{ name: 'llama3.2:3b' }, { name: 'deepseek-r1:7b' }]
          });
        }
        return mockResponse({});
      },
      async (url, payload) => {
        if (url.includes('/api/chat')) {
          // If recommendation request
          if (payload.messages[payload.messages.length - 1].content.includes('Analyze the student\'s task database')) {
            const todayTaskObj = (await taskRepository.find({})).find(t => t.title === 'Due Today Task');
            return mockResponse({
              message: {
                content: JSON.stringify({
                  topRecommendedTaskId: todayTaskObj._id.toString(),
                  reason: 'It is due today.',
                  urgency: 'HIGH',
                  suggestedNextSteps: ['Review requirements', 'Finish SQL queries', 'Submit assignment']
                })
              }
            });
          }
          // If schedule request
          if (payload.messages[payload.messages.length - 1].content.includes('daily study schedule')) {
            const todayTaskObj = (await taskRepository.find({})).find(t => t.title === 'Due Today Task');
            return mockResponse({
              message: {
                content: JSON.stringify({
                  totalAllocatedMinutes: 60,
                  schedule: [
                    {
                      taskId: todayTaskObj._id.toString(),
                      taskTitle: todayTaskObj.title,
                      timeSlot: '09:00 AM – 10:00 AM',
                      durationMinutes: 60,
                      category: todayTaskObj.category,
                      priority: todayTaskObj.priority
                    }
                  ]
                })
              }
            });
          }
          // If chat query
          return mockResponse({
            message: {
              content: 'AI Response: Focus on your ML homework today.'
            }
          });
        }
        return mockResponse({});
      }
    );

    // Test recommendTasks controller
    let recResult = null;
    const mockRecRes = {
      json: (data) => { recResult = data; }
    };
    await aiController.recommendTasks({ body: {} }, mockRecRes);
    
    assert.ok(recResult.topRecommendedTask, 'Should recommend a task');
    assert.strictEqual(recResult.urgency, 'HIGH', 'Urgency should match mocked response');
    assert.strictEqual(recResult.reason, 'It is due today.', 'Reason should match mocked response');
    assert.strictEqual(recResult.suggestedNextSteps.length, 3, 'Should have 3 next steps');

    // Test schedule controller
    let schedResult = null;
    const mockSchedRes = {
      json: (data) => { schedResult = data; }
    };
    await aiController.generateSmartSchedule({ body: { availableHours: 6 } }, mockSchedRes);
    
    assert.strictEqual(schedResult.totalAllocatedMinutes, 60, 'Should match mocked allocated minutes');
    assert.strictEqual(schedResult.schedule.length, 1, 'Should have 1 scheduled item');
    assert.strictEqual(schedResult.schedule[0].taskTitle, 'Due Today Task', 'Should match mocked task title');

    // Test chat controller
    let chatResult = null;
    const mockChatRes = {
      json: (data) => { chatResult = data; }
    };
    await aiController.chatWithAssistant({ body: { message: 'What is my plan for today?' } }, mockChatRes);
    assert.strictEqual(chatResult.aiUsed, true, 'AI should be used');
    assert.strictEqual(chatResult.reply, 'AI Response: Focus on your ML homework today.', 'Chat reply should match mock');

    console.log('✅ Mocked Ollama online responses validated successfully.\n');

    // ----------------------------------------------------
    // TEST 4: Invalid/Malformed AI Output Handling
    // ----------------------------------------------------
    console.log('--- Test 4: Invalid/Malformed AI JSON Output Recovery ---');
    
    mockAxios(
      async (url) => mockResponse({ models: [{ name: 'llama3.2:3b' }] }),
      async (url, payload) => {
        // Return malformed JSON enclosed in markdown with reasoning blocks
        return mockResponse({
          message: {
            content: `
<think>
Evaluating priority...
</think>
Here is the JSON:
\`\`\`json
{
  "topRecommendedTaskId": "INVALID_ID_TEST",
  "reason": "Invalid response test",
  "urgency": "MEDIUM",
  "suggestedNextSteps": [
            ` // Malformed cut-off JSON
          }
        });
      }
    );

    // Verify it handles invalid output and triggers the fallback recommendations cleanly
    let malformedRecResult = null;
    const mockMalformedRecRes = {
      json: (data) => { malformedRecResult = data; }
    };
    
    await aiController.recommendTasks({ body: {} }, mockMalformedRecRes);
    assert.ok(malformedRecResult.topRecommendedTask, 'Should fallback to top priority task from database');
    assert.strictEqual(malformedRecResult.topRecommendedTask.title, 'Overdue Task', 'Fallback should choose the task with the highest priority score');
    assert.ok(malformedRecResult.suggestedNextSteps.length > 0, 'Should fall back to rule-based next steps');

    console.log('✅ Malformed AI response fallback validated successfully.\n');

    // ----------------------------------------------------
    // TEST 5: Ollama Offline (Rule-based Fallback Verification)
    // ----------------------------------------------------
    console.log('--- Test 5: Ollama Offline Fallback logic ---');
    
    // Simulate Ollama server connection failure
    mockAxios(
      async () => { throw new Error('Connect ECONNREFUSED 127.0.0.1:11434'); },
      async () => { throw new Error('Connect ECONNREFUSED 127.0.0.1:11434'); }
    );

    // Test recommendation fallback
    let fallbackRecResult = null;
    const mockFallbackRecRes = {
      json: (data) => { fallbackRecResult = data; }
    };
    await aiController.recommendTasks({ body: {} }, mockFallbackRecRes);
    
    assert.ok(fallbackRecResult.topRecommendedTask, 'Fallback should select a task');
    assert.strictEqual(fallbackRecResult.topRecommendedTask.title, 'Overdue Task', 'Fallback should recommend top priority task (Overdue Task)');
    assert.strictEqual(fallbackRecResult.urgency, 'HIGH', 'Urgency should match top task priority');
    assert.ok(fallbackRecResult.reason.includes('overdue'), 'Reason should be explainable rule-based priority reason');

    // Test chat fallback for overdue question
    let chatOverdueResult = null;
    const mockChatOverdueRes = {
      json: (data) => { chatOverdueResult = data; }
    };
    await aiController.chatWithAssistant({ body: { message: 'What tasks are overdue?' } }, mockChatOverdueRes);
    assert.strictEqual(chatOverdueResult.aiUsed, false, 'Should flag AI as offline');
    assert.ok(chatOverdueResult.reply.includes('Overdue Task'), 'Reply should detail overdue tasks');

    // Test chat fallback for start first / urgent question
    let chatUrgentResult = null;
    const mockChatUrgentRes = {
      json: (data) => { chatUrgentResult = data; }
    };
    await aiController.chatWithAssistant({ body: { message: 'Which assignment should I start first?' } }, mockChatUrgentRes);
    assert.ok(chatUrgentResult.reply.includes('Overdue Task'), 'Urgent query should suggest Overdue Task');

    // Test scheduling fallback
    let fallbackSchedResult = null;
    const mockFallbackSchedRes = {
      json: (data) => { fallbackSchedResult = data; }
    };
    await aiController.generateSmartSchedule({ body: { availableHours: 5 } }, mockFallbackSchedRes);
    assert.ok(fallbackSchedResult.schedule.length > 0, 'Fallback schedule should schedule pending tasks');
    assert.strictEqual(fallbackSchedResult.schedule[0].taskTitle, 'Overdue Task', 'First task scheduled should be the highest priority task');

    console.log('✅ Rule-based fallbacks executed perfectly for all features.\n');

    // Restore axios original methods
    restoreAxios();

    console.log('==================================================');
    console.log('           ALL AI ENGINE TESTS PASSED             ');
    console.log('==================================================');
    
    // Clear tests database
    await taskRepository.deleteMany({});
    process.exit(0);

  } catch (err) {
    console.error('\n❌ TEST SUITE FAILED WITH ERROR:', err);
    restoreAxios();
    // Clear tests database
    try { await taskRepository.deleteMany({}); } catch(e) {}
    process.exit(1);
  }
}

runTests();
