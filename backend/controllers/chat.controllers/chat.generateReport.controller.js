const conversationManager = require('../../utils/conversationManager');
const db = require('../../database/dbConnect');

const generateReport = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { startDate, endDate, format = 'json' } = req.query;

    // Get conversation summary
    const conversationSummary = await conversationManager.getConversationSummary(
      userId,
      startDate || null,
      endDate || null
    );

    // Get user complaints
    const complaintsQuery = `
      SELECT 
        c.complaint_id,
        c.description,
        c.status,
        c.created_at,
        c.updated_at,
        d.Name as department_name,
        cat.Name as category_name,
        w.First_name as worker_first_name,
        w.Last_name as worker_last_name,
        wr.rating,
        wr.review
      FROM Complaint c
      LEFT JOIN Department d ON c.department_id = d.department_id
      LEFT JOIN category cat ON c.category_id = cat.category_id
      LEFT JOIN Worker_Assignment wa ON c.complaint_id = wa.complaint_id
      LEFT JOIN Worker w ON wa.worker_id = w.worker_id
      LEFT JOIN Worker_Rating wr ON c.complaint_id = wr.complaint_id
      WHERE c.user_id = ?
      ${startDate ? 'AND c.created_at >= ?' : ''}
      ${endDate ? 'AND c.created_at <= ?' : ''}
      ORDER BY c.created_at DESC
    `;

    const complaintParams = [userId];
    if (startDate) complaintParams.push(startDate);
    if (endDate) complaintParams.push(endDate);

    db.query(complaintsQuery, complaintParams, (err, complaints) => {
      if (err) {
        console.error('Error fetching complaints:', err);
        return res.status(500).json({ error: 'Error generating report' });
      }

      // Get chat history
      const chatQuery = `
        SELECT user_message, ai_response, language, created_at
        FROM Chat_History
        WHERE user_id = ?
        ${startDate ? 'AND created_at >= ?' : ''}
        ${endDate ? 'AND created_at <= ?' : ''}
        ORDER BY created_at DESC
      `;

      const chatParams = [userId];
      if (startDate) chatParams.push(startDate);
      if (endDate) chatParams.push(endDate);

      db.query(chatQuery, chatParams, (err, chatHistory) => {
        if (err) {
          console.error('Error fetching chat history:', err);
          // Continue without chat history
        }

        // Compile report
        const report = {
          userId: userId,
          userName: `${req.user.First_name} ${req.user.Last_name}`,
          generatedAt: new Date().toISOString(),
          period: {
            start: startDate || 'All time',
            end: endDate || 'All time'
          },
          summary: {
            totalComplaints: complaints.length,
            complaintsByStatus: {
              reported: complaints.filter(c => c.status === 'reported').length,
              'in-progress': complaints.filter(c => c.status === 'in-progress').length,
              resolved: complaints.filter(c => c.status === 'resolved').length
            },
            totalConversations: conversationSummary.totalSessions,
            totalMessages: conversationSummary.totalMessages
          },
          complaints: complaints.map(c => ({
            id: c.complaint_id,
            description: c.description,
            department: c.department_name,
            category: c.category_name,
            status: c.status,
            createdAt: c.created_at,
            updatedAt: c.updated_at,
            worker: c.worker_first_name && c.worker_last_name 
              ? `${c.worker_first_name} ${c.worker_last_name}` 
              : null,
            rating: c.rating,
            review: c.review
          })),
          conversations: conversationSummary.sessions,
          chatHistory: chatHistory || []
        };

        // Return based on format
        if (format === 'json') {
          res.json({
            success: true,
            report: report
          });
        } else if (format === 'text') {
          // Generate text report
          let textReport = `=== ACTIVITY REPORT ===\n\n`;
          textReport += `User: ${report.userName}\n`;
          textReport += `Generated: ${report.generatedAt}\n`;
          textReport += `Period: ${report.period.start} to ${report.period.end}\n\n`;
          textReport += `=== SUMMARY ===\n`;
          textReport += `Total Complaints: ${report.summary.totalComplaints}\n`;
          textReport += `- Reported: ${report.summary.complaintsByStatus.reported}\n`;
          textReport += `- In Progress: ${report.summary.complaintsByStatus['in-progress']}\n`;
          textReport += `- Resolved: ${report.summary.complaintsByStatus.resolved}\n`;
          textReport += `Total Conversations: ${report.summary.totalConversations}\n`;
          textReport += `Total Messages: ${report.summary.totalMessages}\n\n`;
          textReport += `=== COMPLAINTS ===\n\n`;

          report.complaints.forEach((c, idx) => {
            textReport += `${idx + 1}. Complaint #${c.id}\n`;
            textReport += `   Description: ${c.description}\n`;
            textReport += `   Department: ${c.department}\n`;
            textReport += `   Category: ${c.category}\n`;
            textReport += `   Status: ${c.status}\n`;
            textReport += `   Created: ${c.createdAt}\n`;
            if (c.worker) {
              textReport += `   Worker: ${c.worker}\n`;
            }
            if (c.rating) {
              textReport += `   Rating: ${c.rating}/5\n`;
              if (c.review) {
                textReport += `   Review: ${c.review}\n`;
              }
            }
            textReport += `\n`;
          });

          res.setHeader('Content-Type', 'text/plain');
          res.setHeader('Content-Disposition', `attachment; filename="report-${Date.now()}.txt"`);
          res.send(textReport);
        } else {
          res.json({
            success: true,
            report: report
          });
        }
      });
    });

  } catch (error) {
    console.error('Report generation error:', error);
    res.status(500).json({
      error: 'Failed to generate report',
      details: error.message
    });
  }
};

module.exports = { generateReport };

