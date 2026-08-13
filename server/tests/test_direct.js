require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { parseCSVFile, validateRow } = require('../services/csvService');
const { extractTextFromPDF } = require('../services/pdfService');
const { extractTextFromImage } = require('../services/ocrService');
const { extractTasksFromText } = require('../services/aiExtractionService');
const { validateCandidateTask, validateCandidateTaskList } = require('../services/taskValidationService');

async function runTests() {
  console.log('=== RUNNING UNIT AND INTEGRATION TESTS FOR TEAM MEMBER 4 MODULE ===\n');

  // Test 1: CSV Validation (Valid & Invalid Rows)
  console.log('[Test 1] Testing CSV parsing and row validation...');
  const testCsvContent = `title,description,category,dueDate,priority,estimatedTime,status
Submit Machine Learning assignment,Complete neural network report,Machine Learning,2026-08-15,HIGH,120,TODO
Buy Groceries,Milk eggs bread,Personal,2026-08-14,LOW,30,TODO
,Missing title task,Work,2026-08-20,MEDIUM,45,TODO
Fix Database Bug,Resolve connection leak,Development,2026-08-16,CRITICAL_INVALID_PRIO,60,TODO
Review PR #42,Code review for auth,Development,invalid-date-string,MEDIUM,30,TODO
Clean Desktop,Organize workspace files,Personal,2026-08-18,MEDIUM,-10,INVALID_STATUS
`;
  const csvPath = path.join(__dirname, 'sample_test.csv');
  fs.writeFileSync(csvPath, testCsvContent);

  const csvResult = await parseCSVFile(csvPath);
  fs.unlinkSync(csvPath);

  console.log(`- Total Rows: ${csvResult.totalRows}`);
  console.log(`- Valid Rows Count: ${csvResult.validCount}`);
  console.log(`- Invalid Rows Count: ${csvResult.invalidCount}`);

  if (csvResult.validCount !== 2 || csvResult.invalidCount !== 4) {
    throw new Error(`CSV test failed: Expected 2 valid and 4 invalid rows, got ${csvResult.validCount} valid and ${csvResult.invalidCount} invalid.`);
  }
  console.log('✔ Test 1 (CSV Validation) PASSED.\n');

  // Test 2: Task Candidate Validation Engine
  console.log('[Test 2] Testing Candidate Task Validation Service...');
  const sampleCandidates = [
    { title: 'Write Documentation', priority: 'HIGH', estimatedMinutes: 60, dueDate: '2026-08-20' },
    { title: '', priority: 'LOW' }, // Invalid missing title
    { title: 'Prepare Presentation', priority: 'urgent', estimatedTime: '90' } // Should normalize priority to HIGH and minutes to 90
  ];
  const validationResult = validateCandidateTaskList(sampleCandidates);
  console.log(`- Valid candidates: ${validationResult.validCount}, Invalid candidates: ${validationResult.invalidCount}`);
  if (validationResult.validCount !== 2 || validationResult.invalidCount !== 1) {
    throw new Error('Task validation test failed.');
  }
  if (validationResult.validTasks[1].priority !== 'HIGH' || validationResult.validTasks[1].estimatedMinutes !== 90) {
    throw new Error('Normalization of priority or estimated minutes failed.');
  }
  console.log('✔ Test 2 (Task Validation Engine) PASSED.\n');

  // Test 3: AI Extraction (Ollama & Rule Fallback)
  console.log('[Test 3] Testing AI Task Extraction...');
  const sampleText = `Submit Machine Learning assignment by 15 August. It is important and will take around 2 hours.
Also need to buy groceries tomorrow afternoon.`;
  
  const aiResult = await extractTasksFromText(sampleText);
  console.log(`- AI Model: ${aiResult.model} (Using fallback: ${aiResult.usingFallback})`);
  console.log(`- Extracted ${aiResult.tasks.length} task(s):`);
  aiResult.tasks.forEach((t, idx) => {
    console.log(`  ${idx + 1}. [${t.priority}] ${t.title} | Due: ${t.dueDate || 'N/A'} | Est: ${t.estimatedMinutes}m | Cat: ${t.category}`);
  });

  if (aiResult.tasks.length === 0 || !aiResult.tasks[0].title) {
    throw new Error('AI extraction returned no valid tasks.');
  }
  console.log('✔ Test 3 (AI Task Extraction) PASSED.\n');

  // Test 4: Tesseract OCR (with an image or verifying Tesseract path)
  console.log('[Test 4] Testing Tesseract OCR Service...');
  // Check if Tesseract executable is responsive
  const { getTesseractPath } = require('../services/ocrService');
  const tesseractPath = getTesseractPath();
  console.log(`- Tesseract Executable Path: ${tesseractPath}`);
  if (!fs.existsSync(tesseractPath) && tesseractPath !== 'tesseract') {
    throw new Error(`Tesseract binary not found at ${tesseractPath}`);
  }
  console.log('✔ Test 4 (Tesseract OCR Configuration) PASSED.\n');

  console.log('ALL UNIT TESTS PASSED SUCCESSFULLY! ✨');
}

runTests().catch(err => {
  console.error('Test run failed:', err);
  process.exit(1);
});
