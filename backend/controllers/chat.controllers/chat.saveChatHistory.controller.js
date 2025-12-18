const db = require('../../database/dbConnect');

// Save chat history to database
const saveChatHistory = (req, res) => {
    const { message, response, language } = req.body;
    const userId = req.user.user_id;

    if (!message || !response) {
        return res.status(400).json({ message: 'Message and response are required' });
    }

    const query = `
        INSERT INTO Chat_History (user_id, user_message, ai_response, language, created_at)
        VALUES (?, ?, ?, ?, NOW())
    `;

    db.query(query, [userId, message, response, language || 'hi'], (err, result) => {
        if (err) {
            console.error('Error saving chat history:', err);
            return res.status(500).json({ message: 'Failed to save chat history' });
        }

        res.status(201).json({
            success: true,
            message: 'Chat history saved',
            chatId: result.insertId
        });
    });
};

// Get chat history for a user (for officials to view)
const getChatHistoryByUser = (req, res) => {
    const userId = req.query.user_id;

    if (!userId) {
        return res.status(400).json({ message: 'User ID is required' });
    }

    const query = `
        SELECT 
            ch.chat_id,
            ch.user_message,
            ch.ai_response,
            ch.language,
            ch.created_at,
            u.First_name,
            u.Last_name,
            u.Email,
            u.Phone
        FROM Chat_History ch
        JOIN User u ON ch.user_id = u.user_id
        WHERE ch.user_id = ?
        ORDER BY ch.created_at DESC
        LIMIT 100
    `;

    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Error fetching chat history:', err);
            return res.status(500).json({ message: 'Failed to fetch chat history' });
        }

        res.status(200).json({
            success: true,
            chatHistory: results
        });
    });
};

// Get all chat history for official's department complaints
const getChatHistoryForDepartment = (req, res) => {
    const departmentId = req.user.department_id;

    const query = `
        SELECT 
            ch.chat_id,
            ch.user_message,
            ch.ai_response,
            ch.language,
            ch.created_at,
            u.user_id,
            u.First_name,
            u.Last_name,
            u.Email,
            u.Phone,
            c.complaint_id,
            c.category_id,
            c.status as complaint_status
        FROM Chat_History ch
        JOIN User u ON ch.user_id = u.user_id
        LEFT JOIN Complaint c ON u.user_id = c.user_id AND c.department_id = ?
        WHERE c.complaint_id IS NOT NULL
        ORDER BY ch.created_at DESC
        LIMIT 200
    `;

    db.query(query, [departmentId], (err, results) => {
        if (err) {
            console.error('Error fetching department chat history:', err);
            return res.status(500).json({ message: 'Failed to fetch chat history' });
        }

        res.status(200).json({
            success: true,
            chatHistory: results
        });
    });
};

module.exports = {
    saveChatHistory,
    getChatHistoryByUser,
    getChatHistoryForDepartment
};

