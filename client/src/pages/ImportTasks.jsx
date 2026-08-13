import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { FileUp, Sparkles, Check, Edit, Trash, Plus, FileText, CheckCircle, Info } from 'lucide-react';

export default function ImportTasks({ showToast }) {
  const navigate = useNavigate();
  
  const [file, setFile] = useState(null);
  const [importType, setImportType] = useState('pdf'); // 'csv', 'pdf', 'image'
  const [processing, setProcessing] = useState(false);
  const [reviewTasks, setReviewTasks] = useState([]);
  const [checkedIds, setCheckedIds] = useState({}); // Map of index to checked boolean
  const [rawTextLength, setRawTextLength] = useState(0);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    
    // Deduce file type by extension
    const ext = selectedFile.name.split('.').pop().toLowerCase();
    if (ext === 'csv') {
      setImportType('csv');
    } else if (ext === 'pdf') {
      setImportType('pdf');
    } else if (['png', 'jpg', 'jpeg'].includes(ext)) {
      setImportType('image');
    } else {
      showToast('Unsupported file type. Please upload PDF, CSV, PNG, or JPG.', 'warning');
      setFile(null);
    }
  };

  const handleUploadFile = async (e) => {
    e.preventDefault();
    if (!file) {
      showToast('Please select a file first', 'warning');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      setProcessing(true);
      setReviewTasks([]);
      setCheckedIds({});

      let res;
      if (importType === 'csv') {
        showToast('Uploading and parsing CSV...', 'info');
        res = await api.importCSV(formData);
      } else if (importType === 'pdf') {
        showToast('Extracting text from PDF...', 'info');
        res = await api.importPDF(formData);
      } else {
        showToast('Running Tesseract OCR on image...', 'info');
        res = await api.importImage(formData);
      }

      if (res.tasks && res.tasks.length > 0) {
        setReviewTasks(res.tasks);
        setRawTextLength(res.extractedTextLength || 0);
        
        // Check all by default
        const initialChecked = {};
        res.tasks.forEach((_, index) => {
          initialChecked[index] = true;
        });
        setCheckedIds(initialChecked);
        
        showToast(`Successfully extracted ${res.tasks.length} tasks! Review them below.`, 'success');
      } else {
        showToast('No tasks detected in the uploaded file.', 'warning');
      }
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || 'Failed to process document file.', 'error');
    } finally {
      setProcessing(false);
    }
  };

  // Checkbox toggle
  const handleToggleCheck = (index) => {
    setCheckedIds(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // Inline edit task in review list
  const handleEditReviewTask = (index, field, value) => {
    const updated = [...reviewTasks];
    updated[index] = {
      ...updated[index],
      [field]: value
    };
    setReviewTasks(updated);
  };

  const handleDeleteReviewTask = (index) => {
    const updated = [...reviewTasks];
    updated.splice(index, 1);
    setReviewTasks(updated);
    
    // Adjust checked map
    const newChecked = {};
    updated.forEach((_, idx) => {
      newChecked[idx] = true; // reset checks for remaining tasks for ease
    });
    setCheckedIds(newChecked);
  };

  const handleConfirmImport = async () => {
    const tasksToImport = reviewTasks.filter((_, index) => checkedIds[index]);
    
    if (tasksToImport.length === 0) {
      showToast('No tasks selected for import', 'warning');
      return;
    }

    try {
      setProcessing(true);
      await api.confirmImport(tasksToImport);
      showToast(`Successfully imported ${tasksToImport.length} tasks!`, 'success');
      navigate('/');
    } catch (err) {
      console.error(err);
      showToast('Failed to complete import process', 'error');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Title */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Import Syllabus & Assignments</h2>
          <p className="text-slate-500 text-xs mt-0.5">Extract tasks from CSV schedules, syllabus PDFs, or assignment images</p>
        </div>
        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
          <FileUp className="w-6 h-6" />
        </div>
      </div>

      {/* File Upload card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <form onSubmit={handleUploadFile} className="space-y-4">
          <div className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-xl p-8 text-center transition-all bg-slate-50/50 relative">
            <input
              type="file"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              accept=".pdf,.csv,.png,.jpg,.jpeg"
              disabled={processing}
            />
            <FileUp className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            {file ? (
              <div>
                <p className="text-sm font-bold text-slate-800 truncate max-w-md mx-auto">{file.name}</p>
                <p className="text-xs text-slate-400 mt-1">Size: {(file.size / 1024).toFixed(1)} KB | Type: <span className="font-bold text-indigo-600 capitalize">{importType}</span></p>
              </div>
            ) : (
              <div>
                <p className="text-xs font-bold text-slate-600">Drag and drop file, or click to browse</p>
                <p className="text-[10px] text-slate-400 mt-1">Supports PDF syllabus, CSV schedules, PNG/JPG snaps of assignments (Max 10MB)</p>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center pt-2">
            <div className="text-[10px] text-slate-400 flex items-center gap-1 font-semibold">
              <Info className="w-3.5 h-3.5 text-indigo-400" />
              <span>Uses Tesseract OCR for images and node pdf-parse for PDFs.</span>
            </div>
            
            <button
              type="submit"
              disabled={processing || !file}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-1.5"
            >
              {processing ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              Analyze Document
            </button>
          </div>
        </form>
      </div>

      {/* Review & Edit checklist list */}
      {reviewTasks.length > 0 && (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-extrabold text-slate-800 text-base">Review Extracted Tasks</h3>
              <p className="text-xs text-slate-400 mt-0.5">Edit task attributes and select which items to import. Extracted {rawTextLength} characters of text.</p>
            </div>
            
            <button
              onClick={handleConfirmImport}
              disabled={processing}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors shadow-md shadow-emerald-600/20 flex items-center gap-1.5"
            >
              <CheckCircle className="w-4 h-4" /> Confirm & Import Selected
            </button>
          </div>

          <div className="space-y-4">
            {reviewTasks.map((task, index) => (
              <div 
                key={index}
                className={`p-4 rounded-xl border flex flex-col md:flex-row gap-4 items-start transition-all ${
                  checkedIds[index] ? 'bg-indigo-50/10 border-indigo-150' : 'bg-slate-50/30 border-slate-200 opacity-60'
                }`}
              >
                {/* Checkbox */}
                <input
                  type="checkbox"
                  checked={checkedIds[index] || false}
                  onChange={() => handleToggleCheck(index)}
                  className="w-4.5 h-4.5 text-indigo-600 bg-white border-slate-300 rounded focus:ring-indigo-500 mt-1 cursor-pointer"
                />

                {/* Edit details */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-3">
                  <div className="md:col-span-4 space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">Title</label>
                    <input
                      type="text"
                      value={task.title}
                      onChange={(e) => handleEditReviewTask(index, 'title', e.target.value)}
                      className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs focus:outline-none"
                    />
                  </div>

                  <div className="md:col-span-3 space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">Category</label>
                    <select
                      value={task.category}
                      onChange={(e) => handleEditReviewTask(index, 'category', e.target.value)}
                      className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs focus:outline-none"
                    >
                      <option value="Assignments">Assignments</option>
                      <option value="Exams">Exams</option>
                      <option value="Projects">Projects</option>
                      <option value="Lab Work">Lab Work</option>
                      <option value="Revision">Revision</option>
                      <option value="General">General</option>
                    </select>
                  </div>

                  <div className="md:col-span-2 space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">Priority</label>
                    <select
                      value={task.priority}
                      onChange={(e) => handleEditReviewTask(index, 'priority', e.target.value)}
                      className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs focus:outline-none font-semibold text-indigo-600"
                    >
                      <option value="LOW">LOW</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="HIGH">HIGH</option>
                    </select>
                  </div>

                  <div className="md:col-span-2 space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">Due Date</label>
                    <input
                      type="date"
                      value={task.dueDate ? task.dueDate.split('T')[0] : ''}
                      onChange={(e) => handleEditReviewTask(index, 'dueDate', e.target.value)}
                      className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs focus:outline-none"
                    />
                  </div>

                  <div className="md:col-span-1 flex items-end justify-end">
                    <button
                      onClick={() => handleDeleteReviewTask(index)}
                      className="p-1.5 bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100 rounded transition-colors"
                      title="Discard Item"
                    >
                      <Trash className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  
                  {/* Optional Description */}
                  <div className="md:col-span-12 space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">Description / Details</label>
                    <textarea
                      value={task.description}
                      onChange={(e) => handleEditReviewTask(index, 'description', e.target.value)}
                      rows={2}
                      className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs focus:outline-none resize-none"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
