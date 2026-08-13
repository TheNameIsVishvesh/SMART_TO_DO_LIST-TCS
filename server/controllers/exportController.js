const Task = require('../models/Task');
const { Parser } = require('json2csv');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

exports.exportCSV = async (req, res) => {
  try {
    const tasks = await Task.find({}).lean();
    
    const fields = ['title', 'category', 'priority', 'status', 'dueDate', 'completedAt', 'estimatedMinutes'];
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(tasks);
    
    res.header('Content-Type', 'text/csv');
    res.attachment('tasks_report.csv');
    return res.send(csv);
  } catch (error) {
    console.error('Error generating CSV:', error);
    res.status(500).json({ message: 'Error generating CSV report' });
  }
};

exports.exportExcel = async (req, res) => {
  try {
    const tasks = await Task.find({}).lean();
    
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Tasks Report');
    
    worksheet.columns = [
      { header: 'Title', key: 'title', width: 30 },
      { header: 'Category', key: 'category', width: 15 },
      { header: 'Priority', key: 'priority', width: 15 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Due Date', key: 'dueDate', width: 20 },
      { header: 'Completed At', key: 'completedAt', width: 20 },
      { header: 'Est. Minutes', key: 'estimatedMinutes', width: 15 }
    ];
    
    tasks.forEach(task => {
      worksheet.addRow({
        title: task.title,
        category: task.category,
        priority: task.priority,
        status: task.status,
        dueDate: task.dueDate ? new Date(task.dueDate).toLocaleString() : '',
        completedAt: task.completedAt ? new Date(task.completedAt).toLocaleString() : '',
        estimatedMinutes: task.estimatedMinutes
      });
    });
    
    res.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.attachment('tasks_report.xlsx');
    
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error generating Excel:', error);
    res.status(500).json({ message: 'Error generating Excel report' });
  }
};

exports.exportPDF = async (req, res) => {
  try {
    const totalTasks = await Task.countDocuments();
    const completedTasks = await Task.countDocuments({ status: 'COMPLETED' });
    const pendingTasks = await Task.countDocuments({ status: { $in: ['TODO', 'IN_PROGRESS'] } });
    const overdueTasks = await Task.countDocuments({ status: 'OVERDUE' });
    
    const completionRate = totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(2) : 0;
    
    const doc = new PDFDocument({ margin: 50 });
    
    res.header('Content-Type', 'application/pdf');
    res.attachment('smart_todo_productivity_report.pdf');
    
    doc.pipe(res);
    
    // Header
    doc.fontSize(20).text('Smart To-Do Productivity Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' });
    doc.moveDown(2);
    
    // Productivity Summary
    doc.fontSize(16).text('Productivity Summary', { underline: true });
    doc.moveDown();
    doc.fontSize(12).text(`Total Tasks: ${totalTasks}`);
    doc.text(`Completed: ${completedTasks}`);
    doc.text(`Pending: ${pendingTasks}`);
    doc.text(`Overdue: ${overdueTasks}`);
    doc.text(`Completion Rate: ${completionRate}%`);
    doc.moveDown(2);
    
    // Detailed list of tasks
    doc.fontSize(16).text('Recent Tasks', { underline: true });
    doc.moveDown();
    
    const recentTasks = await Task.find({}).sort({ createdAt: -1 }).limit(20).lean();
    
    recentTasks.forEach(task => {
      doc.fontSize(12).text(`- ${task.title} [${task.priority}] (${task.status})`);
      if (task.dueDate) {
        doc.fontSize(10).text(`  Due: ${new Date(task.dueDate).toLocaleDateString()}`);
      }
      doc.moveDown(0.5);
    });
    
    doc.end();
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ message: 'Error generating PDF report' });
  }
};
