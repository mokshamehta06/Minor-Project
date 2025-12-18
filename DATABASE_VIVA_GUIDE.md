# 📚 DATABASE DOCUMENTATION - VIVA GUIDE

## 1. DATABASE CONNECTIVITY

### Location: `backend/database/dbConnect.js`

```javascript
const mysql = require('mysql2');

const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'MinorDB',
});

db.connect((err) => {
  if (err) {
    console.error("❌ MySQL Connection Error:", err);
    console.error("DB Config:", {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      database: process.env.DB_NAME
    });
    return;
  }
  console.log("✅ Connected to MySQL Database");
});

module.exports = db;
```

### Key Points:
- **Library Used:** `mysql2` (NPM package)
- **Connection Method:** `createConnection()`
- **Credentials Source:** Environment variables from `.env` file
- **Default Database:** `MinorDB`
- **Default User:** `root`
- **Default Host:** `localhost`
- **Module Export:** Returns `db` connection object for use in routes

---

## 2. DATABASE TABLES

### A. Chat_History Table

**Purpose:** Store citizen-AI assistant interactions

**SQL Schema:**
```sql
CREATE TABLE IF NOT EXISTS Chat_History (
    chat_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    user_message TEXT NOT NULL,
    ai_response TEXT NOT NULL,
    language VARCHAR(10) DEFAULT 'hi',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES User(user_id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Columns:**
| Column | Type | Purpose |
|--------|------|---------|
| `chat_id` | BIGINT (PK) | Unique identifier for each chat message |
| `user_id` | BIGINT (FK) | Links to User table |
| `user_message` | TEXT | Message from citizen |
| `ai_response` | TEXT | AI agent response |
| `language` | VARCHAR(10) | Language of conversation (default: Hindi 'hi') |
| `created_at` | TIMESTAMP | When message was created |

**Indexes:**
- `idx_user_id` — For fast user-based queries
- `idx_created_at` — For chronological searches

**Relationships:**
- Foreign Key: `user_id` → `User(user_id)` with CASCADE delete
- Supports multi-language (default Hindi)

---

### B. Conversation_Sessions Table

**Purpose:** Store AI Agent conversation history and session data

**SQL Schema:**
```sql
CREATE TABLE IF NOT EXISTS Conversation_Sessions (
    session_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    conversation_data JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (user_id) REFERENCES User(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Columns:**
| Column | Type | Purpose |
|--------|------|---------|
| `session_id` | INT (PK) | Unique session identifier |
| `user_id` | BIGINT (FK) | Links to User table |
| `conversation_data` | JSON | Flexible JSON structure for conversation details |
| `created_at` | TIMESTAMP | Session creation time |
| `updated_at` | TIMESTAMP | Last update time (auto-updated) |

**Indexes:**
- `idx_user_id` — User-based session queries
- `idx_created_at` — Time-based session searches

**Features:**
- JSON column for flexible data storage
- Auto-updates `updated_at` on any modification
- Cascade delete when user is removed

---

## 3. DATABASE DEPENDENCIES

### Location: `backend/package.json`

**Database Package:**
```json
"mysql2": "^3.15.3"
```

**Other Related Packages:**
- `dotenv` — Load environment variables from `.env`
- `express` — Server framework (uses db for routes)
- `cors` — Cross-origin requests
- `jsonwebtoken` — Authentication (paired with user DB)

---

## 4. ENVIRONMENT VARIABLES

### Location: `.env` file (in backend folder)

**Required Variables:**
```
DB_HOST=localhost          # Database server address
DB_USER=root               # MySQL username
DB_PASSWORD=your_password  # MySQL password
DB_NAME=MinorDB            # Database name
PORT=3000                  # Server port
```

**How it works:**
- `script.js` loads `.env` using `require('dotenv')`
- `dbConnect.js` reads these variables with `process.env.DB_*`
- Falls back to defaults if variables not set

---

## 5. DATABASE FLOW

### Connection Initialization Flow:
```
script.js (loads .env)
    ↓
dbConnect.js (creates connection with env credentials)
    ↓
db.connect() callback
    ↓
If Success: ✅ Logs "Connected to MySQL Database"
If Error: ❌ Logs error + config details
```

### Usage in Routes:
```javascript
const db = require('./database/dbConnect');

// Example: Fetch departments
app.get("/api/departments", (req, res) => {
    db.query('SELECT department_id, Name FROM Department', (err, results) => {
        if (err) {
            console.error('Error:', err);
            return res.status(500).json({ error: 'Server error' });
        }
        res.json({ departments: results });
    });
});
```

---

## 6. COMMON DATABASE OPERATIONS

### A. Fetch Data
```javascript
db.query('SELECT * FROM User WHERE user_id = ?', [userId], (err, results) => {
    if (err) console.error(err);
    console.log(results);
});
```

### B. Insert Data
```javascript
db.query('INSERT INTO Chat_History (user_id, user_message, ai_response) VALUES (?, ?, ?)', 
    [userId, message, response], 
    (err) => {
        if (err) console.error(err);
    }
);
```

### C. Update Data
```javascript
db.query('UPDATE Conversation_Sessions SET conversation_data = ? WHERE session_id = ?', 
    [jsonData, sessionId], 
    (err) => {
        if (err) console.error(err);
    }
);
```

### D. Delete Data
```javascript
db.query('DELETE FROM Chat_History WHERE chat_id = ?', [chatId], (err) => {
    if (err) console.error(err);
});
```

---

## 7. DATABASE FEATURES

| Feature | Status | Details |
|---------|--------|---------|
| **Engine** | InnoDB | Supports transactions & foreign keys |
| **Charset** | UTF-8 (utf8mb4) | Supports all Unicode characters & emojis |
| **Collation** | utf8mb4_unicode_ci | Case-insensitive, accent-insensitive |
| **Foreign Keys** | ✅ Yes | Referential integrity maintained |
| **Indexes** | ✅ Yes | Performance optimization |
| **Auto-increment** | ✅ Yes | Automatic ID generation |
| **Timestamps** | ✅ Yes | Auto-created & updated |
| **JSON Support** | ✅ Yes | Flexible data in Conversation_Sessions |
| **Cascade Delete** | ✅ Yes | Auto-delete child records |

---

## 8. ERROR HANDLING

### Connection Errors:
```
❌ MySQL Connection Error: [Error details]
DB Config: {
  host: value,
  user: value,
  database: value
}
```

### Query Errors:
Logged in console with error details and query context.

---

## 9. KEY FILES SUMMARY

| File | Purpose |
|------|---------|
| `backend/database/dbConnect.js` | Main database connection |
| `backend/database/create_chat_history_table.sql` | Chat history table schema |
| `backend/database/create_conversation_sessions_table.sql` | Conversation sessions schema |
| `backend/script.js` | Server entry point (loads db) |
| `backend/.env` | Database credentials |
| `backend/package.json` | Dependencies (mysql2) |

---

## 10. VIVA IMPORTANT POINTS

### ✅ What to Know:
1. **Database Type:** MySQL (Relational)
2. **Connection Method:** `mysql2` NPM package
3. **Credentials:** From `.env` environment variables
4. **Default Database:** MinorDB
5. **Main Tables:** Chat_History, Conversation_Sessions
6. **Key Features:** Foreign keys, Indexing, JSON support, UTF-8 Unicode
7. **Error Handling:** Console logging with config details
8. **Module Export:** Returns connection object for use across app

### ❓ Likely Questions:
- **Q: How do you connect to database?**
  - A: Using `mysql2` library with `createConnection()` and credentials from `.env`

- **Q: Where is database configuration?**
  - A: In `backend/database/dbConnect.js` and `.env` file

- **Q: What tables do you have?**
  - A: Chat_History (for messages) and Conversation_Sessions (for AI conversations)

- **Q: How do you handle foreign keys?**
  - A: Using `FOREIGN KEY (user_id) REFERENCES User(user_id) ON DELETE CASCADE`

- **Q: What language/charset do you use?**
  - A: UTF-8 (utf8mb4) for Unicode & multilingual support

- **Q: How do you prevent SQL injection?**
  - A: Using parameterized queries with `?` placeholders

---

## 11. SETUP & TESTING

### Create Database:
```sql
CREATE DATABASE MinorDB;
```

### Create Tables:
Run the SQL files from `backend/database/` in your MySQL client:
```sql
-- Run these two files
source backend/database/create_chat_history_table.sql;
source backend/database/create_conversation_sessions_table.sql;
```

### Verify Connection:
```powershell
cd backend
node script.js
```

**Expected Output:**
```
✅ Connected to MySQL Database
Server is running on http://localhost:3000
```

---

**Good luck with your viva! 🎓**
