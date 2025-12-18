const db = require('../database/dbConnect');

class ConversationManager {
  /**
   * Get or create a conversation session for a user
   */
  async getOrCreateSession(userId) {
    return new Promise((resolve, reject) => {
      // Check if active session exists (last 30 minutes)
      const query = `
        SELECT session_id, conversation_data 
        FROM Conversation_Sessions 
        WHERE user_id = ? 
        AND created_at > DATE_SUB(NOW(), INTERVAL 30 MINUTE)
        ORDER BY created_at DESC 
        LIMIT 1
      `;

      db.query(query, [userId], (err, results) => {
        if (err) {
          console.error('Error fetching session:', err);
          return reject(err);
        }

        if (results.length > 0) {
          try {
            const sessionData = JSON.parse(results[0].conversation_data || '{}');
            resolve({
              sessionId: results[0].session_id,
              history: sessionData.history || [],
              formData: sessionData.formData || {}
            });
          } catch (parseError) {
            // If parsing fails, create new session
            this.createSession(userId).then(resolve).catch(reject);
          }
        } else {
          // Create new session
          this.createSession(userId).then(resolve).catch(reject);
        }
      });
    });
  }

  /**
   * Create a new conversation session
   */
  async createSession(userId) {
    return new Promise((resolve, reject) => {
      const initialData = {
        history: [],
        formData: {}
      };

      const query = `
        INSERT INTO Conversation_Sessions (user_id, conversation_data, created_at, updated_at)
        VALUES (?, ?, NOW(), NOW())
      `;

      db.query(query, [userId, JSON.stringify(initialData)], (err, result) => {
        if (err) {
          console.error('Error creating session:', err);
          return reject(err);
        }

        resolve({
          sessionId: result.insertId,
          history: [],
          formData: {}
        });
      });
    });
  }

  /**
   * Add message to conversation history
   */
  async addMessage(sessionId, userMessage, assistantResponse, formData = null) {
    return new Promise((resolve, reject) => {
      // Get current session data
      const getQuery = 'SELECT conversation_data FROM Conversation_Sessions WHERE session_id = ?';
      
      db.query(getQuery, [sessionId], (err, results) => {
        if (err) {
          return reject(err);
        }

        if (results.length === 0) {
          return reject(new Error('Session not found'));
        }

        try {
          const sessionData = JSON.parse(results[0].conversation_data || '{}');
          
          // Add to history
          sessionData.history = sessionData.history || [];
          sessionData.history.push({
            user: userMessage,
            assistant: assistantResponse,
            timestamp: new Date().toISOString()
          });

          // Update form data if provided
          if (formData) {
            sessionData.formData = { ...sessionData.formData, ...formData };
          }

          // Keep only last 20 messages
          if (sessionData.history.length > 20) {
            sessionData.history = sessionData.history.slice(-20);
          }

          // Update session
          const updateQuery = `
            UPDATE Conversation_Sessions 
            SET conversation_data = ?, updated_at = NOW()
            WHERE session_id = ?
          `;

          db.query(updateQuery, [JSON.stringify(sessionData), sessionId], (err, result) => {
            if (err) {
              return reject(err);
            }
            resolve({
              history: sessionData.history,
              formData: sessionData.formData
            });
          });
        } catch (parseError) {
          reject(parseError);
        }
      });
    });
  }

  /**
   * Get conversation summary for report
   */
  async getConversationSummary(userId, startDate = null, endDate = null) {
    return new Promise((resolve, reject) => {
      let query = `
        SELECT session_id, conversation_data, created_at, updated_at
        FROM Conversation_Sessions
        WHERE user_id = ?
      `;
      const params = [userId];

      if (startDate) {
        query += ' AND created_at >= ?';
        params.push(startDate);
      }

      if (endDate) {
        query += ' AND created_at <= ?';
        params.push(endDate);
      }

      query += ' ORDER BY created_at DESC';

      db.query(query, params, (err, results) => {
        if (err) {
          return reject(err);
        }

        const summary = {
          totalSessions: results.length,
          totalMessages: 0,
          sessions: []
        };

        results.forEach(row => {
          try {
            const data = JSON.parse(row.conversation_data || '{}');
            const messageCount = (data.history || []).length;
            summary.totalMessages += messageCount;

            summary.sessions.push({
              sessionId: row.session_id,
              createdAt: row.created_at,
              updatedAt: row.updated_at,
              messageCount: messageCount,
              formData: data.formData || {}
            });
          } catch (parseError) {
            console.error('Error parsing session data:', parseError);
          }
        });

        resolve(summary);
      });
    });
  }

  /**
   * Clear old sessions (older than 7 days)
   */
  async clearOldSessions() {
    return new Promise((resolve, reject) => {
      const query = `
        DELETE FROM Conversation_Sessions 
        WHERE created_at < DATE_SUB(NOW(), INTERVAL 7 DAY)
      `;

      db.query(query, [], (err, result) => {
        if (err) {
          return reject(err);
        }
        console.log(`🗑️ Cleared ${result.affectedRows} old conversation sessions`);
        resolve(result.affectedRows);
      });
    });
  }
}

module.exports = new ConversationManager();

