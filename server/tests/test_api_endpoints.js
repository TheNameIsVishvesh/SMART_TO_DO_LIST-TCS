require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const apiRoutes = require('../routes/api');
const taskRepository = require('../services/taskRepository');
const db = require('../utils/db');
const { createTestPdfBuffer } = require('./helpers/pdfHelper');
const { createMinimalPngBuffer, createTestBmpWithText } = require('./helpers/imageHelper');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api', apiRoutes);

// Register global error handler for the test Express app
app.use((err, req, res, next) => {
  let status = err.status || 500;
  let message = err.message || 'Internal Server Error';
  
  if (err.code === 'LIMIT_FILE_SIZE') {
    status = 400;
    message = 'File size limit exceeded. Maximum size allowed is 10MB.';
  } else if (err.message && (err.message.includes('supported') || err.message.includes('prohibited') || err.message.includes('Security'))) {
    status = 400;
    message = 'Security Alert: Unsupported or prohibited file type.';
  }

  res.status(status).json({
    error: true,
    message: message
  });
});

async function runAllBackendTests() {
  console.log('================================================================');
  console.log('  TEAM MEMBER 4: DOCUMENT INTELLIGENCE BACKEND TEST SUITE');
  console.log('================================================================\n');

  // Connect to database (with JSON fallback support)
  await db.connectDB();
  console.log(`✔ Connected to database in ${taskRepository.getDbMode()} mode for testing.`);

  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`✔ Test HTTP server listening on ${baseUrl}\n`);

  try {
    // ----------------------------------------------------
    // SECTION 1: CSV IMPORT TESTS
    // ----------------------------------------------------
    console.log('--- [1] CSV IMPORT TESTS ---');

    // 1.1 Valid CSV
    console.log('[Test 1.1] Valid CSV upload');
    const validCsv = `title,description,category,dueDate,priority,estimatedTime,status
DSA Assignment,Complete stack problems,Academic,2026-08-15,HIGH,120,PENDING
Database Indexing,Optimize query performance,Database,2026-08-18,LOW,45,TODO
`;
    const formValidCsv = new FormData();
    formValidCsv.append('file', new Blob([validCsv], { type: 'text/csv' }), 'valid_tasks.csv');
    const res1_1 = await fetch(`${baseUrl}/api/import/csv`, { method: 'POST', body: formValidCsv });
    const json1_1 = await res1_1.json();
    if (res1_1.status !== 200 || json1_1.validRows.length !== 2 || json1_1.invalidRows.length !== 0) {
      throw new Error(`Test 1.1 failed: ${JSON.stringify(json1_1)}`);
    }
    console.log('✔ Valid CSV passed (2 valid rows, 0 invalid).');

    // 1.2 Malformed & Invalid CSV Rows (missing title, bad priority, bad date, bad estimatedTime, bad status)
    console.log('[Test 1.2] Malformed CSV with invalid rows');
    const badCsv = `title,description,category,dueDate,priority,estimatedTime,status
,Missing title task,Work,2026-08-20,MEDIUM,45,TODO
Task Bad Priority,Some desc,Dev,2026-08-20,SUPER_HIGH_INVALID,30,TODO
Task Bad Date,Some desc,Dev,not-a-valid-date,HIGH,30,TODO
Task Bad Time,Some desc,Dev,2026-08-20,LOW,-50,TODO
Task Bad Status,Some desc,Dev,2026-08-20,MEDIUM,30,INVALID_STATUS_CODE
Valid Task In Mixed CSV,Should be valid,Dev,2026-08-22,HIGH,60,TODO
`;
    const formBadCsv = new FormData();
    formBadCsv.append('file', new Blob([badCsv], { type: 'text/csv' }), 'mixed_tasks.csv');
    const res1_2 = await fetch(`${baseUrl}/api/import/csv`, { method: 'POST', body: formBadCsv });
    const json1_2 = await res1_2.json();
    if (res1_2.status !== 200 || json1_2.validRows.length !== 1 || json1_2.invalidRows.length !== 5) {
      throw new Error(`Test 1.2 failed: ${JSON.stringify(json1_2)}`);
    }
    console.log('✔ Malformed CSV passed (1 valid row isolated, 5 invalid rows flagged with error details).\n');

    // ----------------------------------------------------
    // SECTION 2: FILE SECURITY & VALIDATION TESTS
    // ----------------------------------------------------
    console.log('--- [2] FILE SECURITY & VALIDATION TESTS ---');

    // 2.1 Empty file (0 bytes)
    console.log('[Test 2.1] Empty file rejection (0 bytes)');
    const formEmpty = new FormData();
    formEmpty.append('file', new Blob([], { type: 'text/csv' }), 'empty.csv');
    const res2_1 = await fetch(`${baseUrl}/api/import/csv`, { method: 'POST', body: formEmpty });
    const json2_1 = await res2_1.json();
    if (res2_1.status !== 400 || !json2_1.message.includes('empty')) {
      throw new Error(`Test 2.1 failed: Expected 400 for empty file, got ${res2_1.status}`);
    }
    console.log('✔ Empty file rejected with HTTP 400.');

    // 2.2 Executable file rejection
    console.log('[Test 2.2] Executable / malicious file rejection (.exe / .sh / .bat)');
    const formExec = new FormData();
    formExec.append('file', new Blob(['#!/bin/bash\nrm -rf /'], { type: 'application/x-sh' }), 'malicious.sh');
    const res2_2 = await fetch(`${baseUrl}/api/import/csv`, { method: 'POST', body: formExec });
    const json2_2 = await res2_2.json();
    if (res2_2.status !== 400 || !json2_2.message.includes('prohibited') && !json2_2.message.includes('Unsupported') && !json2_2.message.includes('Security Alert')) {
      throw new Error(`Test 2.2 failed: Executable file was not rejected: ${JSON.stringify(json2_2)}`);
    }
    console.log('✔ Executable file strictly blocked.');

    // 2.3 Unsupported file extension
    console.log('[Test 2.3] Unsupported extension rejection (.zip)');
    const formZip = new FormData();
    formZip.append('file', new Blob(['zip content'], { type: 'application/zip' }), 'archive.zip');
    const res2_3 = await fetch(`${baseUrl}/api/import/csv`, { method: 'POST', body: formZip });
    if (res2_3.status !== 400) {
      throw new Error('Test 2.3 failed: Unsupported extension was not rejected.');
    }
    console.log('✔ Unsupported extension rejected.\n');

    // ----------------------------------------------------
    // SECTION 3: PDF TEXT EXTRACTION TESTS
    // ----------------------------------------------------
    console.log('--- [3] PDF TEXT EXTRACTION TESTS ---');

    // 3.1 Valid PDF
    console.log('[Test 3.1] Valid PDF text extraction');
    const pdfBuf = await createTestPdfBuffer('Submit Machine Learning assignment by 15 August. It is important and will take around 2 hours.');
    const formPdf = new FormData();
    formPdf.append('file', new Blob([pdfBuf], { type: 'application/pdf' }), 'assignment.pdf');
    const res3_1 = await fetch(`${baseUrl}/api/import/pdf`, { method: 'POST', body: formPdf });
    const json3_1 = await res3_1.json();
    if (res3_1.status !== 200 || !json3_1.extractedText.includes('Machine Learning assignment')) {
      throw new Error(`Test 3.1 failed: ${JSON.stringify(json3_1)}`);
    }
    console.log(`✔ PDF text extracted: "${json3_1.extractedText.substring(0, 60)}..."`);

    // 3.2 Corrupted PDF handling
    console.log('[Test 3.2] Corrupted PDF file handling');
    const formBadPdf = new FormData();
    formBadPdf.append('file', new Blob(['%PDF-1.4 corrupt junk data invalid xref stream'], { type: 'application/pdf' }), 'corrupt.pdf');
    const res3_2 = await fetch(`${baseUrl}/api/import/pdf`, { method: 'POST', body: formBadPdf });
    if (res3_2.status !== 400) {
      throw new Error('Test 3.2 failed: Corrupted PDF did not return HTTP 400 error.');
    }
    console.log('✔ Corrupted PDF handled gracefully with HTTP 400.\n');

    // ----------------------------------------------------
    // SECTION 4: IMAGE OCR TESTS (TESSERACT)
    // ----------------------------------------------------
    console.log('--- [4] IMAGE OCR TESTS ---');

    // 4.1 Valid Image Upload & OCR
    console.log('[Test 4.1] Image upload and OCR execution');
    const pngBuf = createMinimalPngBuffer();
    const formImg = new FormData();
    formImg.append('file', new Blob([pngBuf], { type: 'image/png' }), 'screenshot.png');
    const res4_1 = await fetch(`${baseUrl}/api/import/image`, { method: 'POST', body: formImg });
    const json4_1 = await res4_1.json();
    if (res4_1.status !== 200 || json4_1.success !== true) {
      throw new Error(`Test 4.1 failed: ${JSON.stringify(json4_1)}`);
    }
    console.log('✔ Image OCR API processed successfully.');

    // 4.2 Empty Image (0 bytes)
    console.log('[Test 4.2] Empty image rejection');
    const formEmptyImg = new FormData();
    formEmptyImg.append('file', new Blob([], { type: 'image/png' }), 'empty.png');
    const res4_2 = await fetch(`${baseUrl}/api/import/image`, { method: 'POST', body: formEmptyImg });
    if (res4_2.status !== 400) {
      throw new Error('Test 4.2 failed: Empty image did not return HTTP 400.');
    }
    console.log('✔ Empty image rejected with HTTP 400.\n');

    // ----------------------------------------------------
    // SECTION 5: AI TASK EXTRACTION TESTS (GEMMA 3 4B / OLLAMA)
    // ----------------------------------------------------
    console.log('--- [5] AI TASK EXTRACTION TESTS ---');
    console.log('[Test 5.1] Extract structured tasks from unstructured prompt');
    const sampleInputText = `Submit Machine Learning assignment by 15 August.
It is important and will take around 2 hours.`;

    const res5_1 = await fetch(`${baseUrl}/api/import/extract-tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: sampleInputText })
    });
    const json5_1 = await res5_1.json();
    if (res5_1.status !== 200 || !json5_1.tasks || json5_1.tasks.length === 0) {
      throw new Error(`Test 5.1 failed: ${JSON.stringify(json5_1)}`);
    }
    const extractedTask = json5_1.tasks[0];
    console.log(`- Extracted Task: Title="${extractedTask.title}", Priority="${extractedTask.priority}", EstTime=${extractedTask.estimatedTime || extractedTask.estimatedMinutes}m, DueDate="${extractedTask.dueDate}"`);
    if (!extractedTask.title || !extractedTask.priority) {
      throw new Error('AI extraction missing required fields.');
    }
    console.log(`✔ AI extraction passed with model: ${json5_1.model}.\n`);

    // ----------------------------------------------------
    // SECTION 6: REVIEW & APPROVAL WORKFLOW TESTS
    // ----------------------------------------------------
    console.log('--- [6] REVIEW & APPROVAL WORKFLOW TESTS ---');

    // 6.1 Approve valid task -> Saved to MongoDB
    console.log('[Test 6.1] Approve valid candidate task -> Commit to MongoDB');
    const candidateTasks = [
      {
        title: 'Review Approved Task A',
        description: 'Approved during review test',
        category: 'Testing',
        priority: 'HIGH',
        dueDate: '2026-08-15',
        estimatedTime: 120,
        source: 'image_ocr'
      },
      {
        title: 'Review Approved Task B',
        description: 'Second approved task',
        category: 'Testing',
        priority: 'LOW',
        estimatedTime: 30,
        source: 'pdf_import'
      }
    ];

    const res6_1 = await fetch(`${baseUrl}/api/import/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'APPROVE',
        tasks: candidateTasks
      })
    });
    const json6_1 = await res6_1.json();
    if (res6_1.status !== 201 || json6_1.savedCount !== 2) {
      throw new Error(`Test 6.1 failed: ${JSON.stringify(json6_1)}`);
    }
    console.log('✔ Approved 2 tasks into MongoDB.');

    // Verify tasks are present in DB
    const dbTasks = await taskRepository.find({ category: 'Testing' });
    if (dbTasks.length < 2) {
      throw new Error('Database verification failed: Approved tasks not found.');
    }
    console.log(`✔ Verified ${dbTasks.length} tasks persisted in database.`);

    // 6.2 Reject candidate tasks -> Must NOT be saved to DB
    console.log('[Test 6.2] Reject task candidate -> Ensure NOT saved to DB');
    const countBeforeReject = (await taskRepository.find({})).length;
    const res6_2 = await fetch(`${baseUrl}/api/import/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'REJECT',
        tasks: [
          { title: 'Rejected Task C - Should never be saved', priority: 'HIGH' }
        ]
      })
    });
    const json6_2 = await res6_2.json();
    const countAfterReject = (await taskRepository.find({})).length;
    if (countBeforeReject !== countAfterReject) {
      throw new Error('Test 6.2 failed: Rejected task was erroneously saved to DB!');
    }
    console.log('✔ Rejected task was successfully discarded without saving to database.');

    // 6.3 Cleanup test documents
    await taskRepository.deleteMany({ category: 'Testing' });
    console.log('✔ Cleaned up test data.');

    console.log('\n================================================================');
    console.log('  ✨ ALL BACKEND TESTS PASSED WITH 100% SUCCESS! ✨');
    console.log('================================================================\n');
  } finally {
    server.close();
    // Disconnect if mongodb was used
    try {
      const mongoose = require('mongoose');
      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
      }
    } catch (e) {}
  }
}

runAllBackendTests().catch(err => {
  console.error('Test Suite Error:', err);
  process.exit(1);
});
