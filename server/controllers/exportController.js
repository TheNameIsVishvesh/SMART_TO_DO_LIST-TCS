const PDFDocument = require('pdfkit');
const taskRepository = require('../services/taskRepository');

const exportController = {
  // GET /api/export/csv
  exportCSV: async (req, res) => {
    try {
      const tasks = await taskRepository.find({});
      
      // Set response headers
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=tasks_export.csv');
      
      // Write CSV Header
      res.write('ID,Title,Description,Category,Tags,Priority,PriorityScore,Status,DueDate,EstimatedMinutes,CompletedAt,Source,CreatedAt\n');
      
      // Write Rows
      tasks.forEach(task => {
        const id = task._id || '';
        const title = `"${(task.title || '').replace(/"/g, '""')}"`;
        const description = `"${(task.description || '').replace(/"/g, '""')}"`;
        const category = `"${(task.category || '').replace(/"/g, '""')}"`;
        const tags = `"${(task.tags || []).join(', ')}"`;
        const priority = task.priority || '';
        const priorityScore = task.priorityScore || 0;
        const status = task.status || '';
        const dueDate = task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '';
        const estimatedMinutes = task.estimatedMinutes || 0;
        const completedAt = task.completedAt ? new Date(task.completedAt).toISOString().split('T')[0] : '';
        const source = task.source || '';
        const createdAt = task.createdAt ? new Date(task.createdAt).toISOString() : '';

        res.write(`${id},${title},${description},${category},${tags},${priority},${priorityScore},${status},${dueDate},${estimatedMinutes},${completedAt},${source},${createdAt}\n`);
      });

      res.end();
    } catch (err) {
      res.status(500).json({ error: 'Failed to export CSV', message: err.message });
    }
  },

  // GET /api/export/excel
  exportExcel: async (req, res) => {
    // Excel handles CSV with UTF-8 BOM best, so we write BOM first and use standard comma delimiters
    try {
      const tasks = await taskRepository.find({});
      
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename=tasks_excel_report.csv');
      
      // Write UTF-8 BOM
      res.write('\ufeff');
      
      // Header
      res.write('Task ID,Task Title,Description,Subject Category,Tags,Priority Level,Priority Score,Current Status,Due Date,Estimated Duration (mins),Completed On,Created On,Source Document\n');
      
      // Rows
      tasks.forEach(task => {
        const id = task._id || '';
        const title = `"${(task.title || '').replace(/"/g, '""')}"`;
        const description = `"${(task.description || '').replace(/"/g, '""')}"`;
        const category = `"${(task.category || '').replace(/"/g, '""')}"`;
        const tags = `"${(task.tags || []).join(', ')}"`;
        const priority = task.priority || '';
        const priorityScore = task.priorityScore || 0;
        const status = task.status || '';
        const dueDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '';
        const estimatedMinutes = task.estimatedMinutes || 0;
        const completedAt = task.completedAt ? new Date(task.completedAt).toLocaleDateString() : '';
        const createdAt = task.createdAt ? new Date(task.createdAt).toLocaleDateString() : '';
        const source = task.source || '';

        res.write(`${id},${title},${description},${category},${tags},${priority},${priorityScore},${status},${dueDate},${estimatedMinutes},${completedAt},${createdAt},${source}\n`);
      });

      res.end();
    } catch (err) {
      res.status(500).json({ error: 'Failed to export Excel report', message: err.message });
    }
  },

  // GET /api/export/pdf
  exportPDF: async (req, res) => {
    try {
      const tasks = await taskRepository.find({});
      
      const completed = tasks.filter(t => t.status === 'COMPLETED').length;
      const pending = tasks.filter(t => t.status === 'TODO' || t.status === 'IN_PROGRESS').length;
      const overdue = tasks.filter(t => t.status === 'OVERDUE').length;
      const high = tasks.filter(t => t.status !== 'COMPLETED' && t.priority === 'HIGH').length;
      const rate = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;

      const doc = new PDFDocument({ margin: 50 });
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=productivity_report.pdf');
      
      doc.pipe(res);

      // Header Banner
      doc.fillColor('#1e293b').fontSize(24).text('Smart To-Do List Assistant', { align: 'center' });
      doc.fontSize(12).fillColor('#64748b').text('University Productivity & Study Report', { align: 'center' });
      doc.moveDown(1);
      doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(50, 100).lineTo(562, 100).stroke();
      doc.moveDown(1.5);

      // Executive Summary Panel
      doc.fillColor('#1e293b').fontSize(16).text('Executive Analytics Summary', { underline: true });
      doc.moveDown(0.5);
      
      doc.fontSize(11).fillColor('#334155');
      doc.text(`Total Logged Tasks: ${tasks.length}`);
      doc.text(`Completed Tasks: ${completed} (Completion Rate: ${rate}%)`);
      doc.text(`Pending Tasks: ${pending}`);
      doc.text(`Overdue Tasks: ${overdue}`);
      doc.text(`Urgent Incomplete Tasks (High Priority): ${high}`);
      doc.moveDown(2);

      // Tasks Table Header
      doc.fillColor('#1e293b').fontSize(16).text('Task Database Registry', { underline: true });
      doc.moveDown(0.5);

      // Table Header Layout
      let y = doc.y;
      doc.fillColor('#475569').fontSize(10);
      doc.text('Task Title', 50, y, { width: 180 });
      doc.text('Category', 240, y, { width: 80 });
      doc.text('Priority', 330, y, { width: 60 });
      doc.text('Status', 400, y, { width: 80 });
      doc.text('Due Date', 490, y, { width: 72 });
      
      doc.strokeColor('#94a3b8').lineWidth(1).moveTo(50, y + 15).lineTo(562, y + 15).stroke();
      doc.moveDown(1.5);

      // Table Rows
      doc.fillColor('#000000').fontSize(9);
      tasks.forEach(task => {
        if (doc.y > 700) {
          doc.addPage();
          // Redraw table headers on new page
          y = doc.y;
          doc.fillColor('#475569').fontSize(10);
          doc.text('Task Title', 50, y, { width: 180 });
          doc.text('Category', 240, y, { width: 80 });
          doc.text('Priority', 330, y, { width: 60 });
          doc.text('Status', 400, y, { width: 80 });
          doc.text('Due Date', 490, y, { width: 72 });
          doc.strokeColor('#94a3b8').lineWidth(1).moveTo(50, y + 15).lineTo(562, y + 15).stroke();
          doc.moveDown(1.5);
          doc.fillColor('#000000').fontSize(9);
        }

        const titleText = task.title || 'Untitled';
        const catText = task.category || 'General';
        const priText = task.priority || 'MEDIUM';
        const statText = task.status || 'TODO';
        const dateText = task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : 'N/A';

        y = doc.y;
        
        // Colors based on priority/status
        let priorityColor = '#334155';
        if (priText === 'HIGH') priorityColor = '#b91c1c';
        else if (priText === 'MEDIUM') priorityColor = '#d97706';
        
        let statusColor = '#334155';
        if (statText === 'COMPLETED') statusColor = '#15803d';
        else if (statText === 'OVERDUE') statusColor = '#b91c1c';
        else if (statText === 'IN_PROGRESS') statusColor = '#2563eb';

        doc.fillColor('#0f172a').text(titleText, 50, y, { width: 180 });
        doc.fillColor('#475569').text(catText, 240, y, { width: 80 });
        doc.fillColor(priorityColor).text(priText, 330, y, { width: 60 });
        doc.fillColor(statusColor).text(statText, 400, y, { width: 80 });
        doc.fillColor('#334155').text(dateText, 490, y, { width: 72 });
        
        doc.strokeColor('#e2e8f0').lineWidth(0.5).moveTo(50, y + 18).lineTo(562, y + 18).stroke();
        doc.moveDown(1.2);
      });

      // Footer
      const pageCount = doc.bufferedPageRange().count;
      for (let i = 0; i < pageCount; i++) {
        doc.switchToPage(i);
        doc.fillColor('#94a3b8').fontSize(8).text(
          `Generated automatically by Smart To-Do Assistant | Page ${i + 1} of ${pageCount}`,
          50,
          750,
          { align: 'center' }
        );
      }

      doc.end();
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to generate PDF report', message: err.message });
    }
  }
};

module.exports = exportController;

