/**
 * AI Agent Chatbot Widget
 * Natural language conversation interface for complaint reporting
 */

const SERVER_URL = 'http://localhost:3000';

// Store conversation history
let conversationHistory = [];
let currentLanguage = localStorage.getItem('lang') || 'en';

// Translations
const translations = {
    en: {
        greeting: "Hey! 👋 I'm your civic assistant. What can I help you with?",
        startReporting: "Let's get started! Tell me about the issue you want to report.",
        trackComplaint: "Sure! I'll help you track your complaint. Can you give me your complaint ID?",
        assignIssue: "Got it! Which issue would you like to assign?",
        viewDashboard: "Perfect! Let me open the dashboard for you.",
        generateReport: "I'll generate a comprehensive report for you.",
        placeholder: "Ask me anything... (e.g., 'There's a pothole on Main Street')",
        send: "Send",
        close: "Close",
        chat: "Chat with AI",
        loading: "Thinking...",
        error: "Sorry, I didn't understand that. Could you rephrase?"
    },
    hi: {
        greeting: "नमस्ते! 👋 मैं आपका सिविक सहायक हूँ। मैं आपकी क्या मदद कर सकता हूँ?",
        startReporting: "चलिए शुरू करते हैं! मुझे बताएं कि आप क्या समस्या रिपोर्ट करना चाहते हैं।",
        trackComplaint: "बिल्कुल! मैं आपकी शिकायत का ट्रैक करने में मदद करूँगा। क्या आप अपना complaint ID दे सकते हैं?",
        assignIssue: "समझ गया! आप कौन सी समस्या assign करना चाहते हैं?",
        viewDashboard: "बिल्कुल! मैं डैशबोर्ड खोलता हूँ।",
        generateReport: "मैं आपके लिए एक comprehensive report तैयार करूँगा।",
        placeholder: "मुझसे कुछ भी पूछें... (जैसे, 'Main Street पर एक गड्ढा है')",
        send: "भेजें",
        close: "बंद करें",
        chat: "AI से बात करें",
        loading: "सोच रहा हूँ...",
        error: "क्षमा करें, मुझे समझ नहीं आया। क्या आप फिर से कह सकते हैं?"
    }
};

/**
 * Initialize AI Chat Widget
 */
function initializeAIChat() {
    // Create chat widget HTML
    const chatHTML = `
        <div id="ai-chat-widget" class="ai-chat-widget">
            <!-- Chat Header -->
            <div class="ai-chat-header">
                <div class="ai-chat-title">
                    <i class="fas fa-robot"></i>
                    <span>${translations[currentLanguage].chat}</span>
                </div>
                <button class="ai-chat-close" onclick="closeAIChat()">
                    <i class="fas fa-times"></i>
                </button>
            </div>

            <!-- Chat Messages Container -->
            <div class="ai-chat-messages" id="ai-chat-messages">
                <div class="ai-chat-message ai-message">
                    <div class="ai-chat-avatar">
                        <i class="fas fa-robot"></i>
                    </div>
                    <div class="ai-chat-text">
                        ${translations[currentLanguage].greeting}
                    </div>
                </div>
            </div>

            <!-- Chat Input -->
            <div class="ai-chat-input-container">
                <input 
                    type="text" 
                    id="ai-chat-input" 
                    class="ai-chat-input" 
                    placeholder="${translations[currentLanguage].placeholder}"
                    autocomplete="off"
                    onkeypress="handleChatKeypress(event)"
                />
                <button class="ai-chat-send" onclick="sendAIMessage()">
                    <i class="fas fa-paper-plane"></i>
                </button>
            </div>
        </div>

        <!-- Chat Toggle Button (Floating) -->
        <button class="ai-chat-toggle" id="ai-chat-toggle" onclick="toggleAIChat()" title="${translations[currentLanguage].chat}">
            <i class="fas fa-robot"></i>
        </button>
    `;

    // Append to body
    document.body.insertAdjacentHTML('beforeend', chatHTML);

    // Add CSS styles
    addAIChatStyles();

    // Focus input on load
    setTimeout(() => {
        const input = document.getElementById('ai-chat-input');
        if (input) input.focus();
    }, 500);
}

/**
 * Add CSS styles for AI Chat widget
 */
function addAIChatStyles() {
    const styles = `
        /* AI Chat Widget */
        .ai-chat-widget {
            position: fixed;
            bottom: 80px;
            right: 20px;
            width: 380px;
            max-width: 90vw;
            height: 600px;
            background: white;
            border-radius: 16px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
            display: flex;
            flex-direction: column;
            animation: slideUp 0.3s ease-out;
            z-index: 9998;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        .ai-chat-header {
            background: linear-gradient(135deg, #1565c0 0%, #1976d2 100%);
            color: white;
            padding: 1rem;
            border-radius: 16px 16px 0 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
            box-shadow: 0 4px 12px rgba(21, 101, 192, 0.3);
        }

        .ai-chat-title {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            font-weight: 600;
            font-size: 1rem;
        }

        .ai-chat-title i {
            font-size: 1.25rem;
        }

        .ai-chat-close {
            background: rgba(255, 255, 255, 0.2);
            border: none;
            color: white;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            cursor: pointer;
            transition: all 0.3s;
            font-size: 1rem;
        }

        .ai-chat-close:hover {
            background: rgba(255, 255, 255, 0.3);
            transform: rotate(90deg);
        }

        .ai-chat-messages {
            flex: 1;
            overflow-y: auto;
            padding: 1.5rem;
            display: flex;
            flex-direction: column;
            gap: 1rem;
            background: linear-gradient(135deg, #ffffff 0%, #f5f8fa 100%);
        }

        .ai-chat-message {
            display: flex;
            gap: 0.75rem;
            animation: fadeIn 0.3s ease-out;
        }

        .ai-chat-message.user-message {
            justify-content: flex-end;
        }

        .ai-chat-message.user-message .ai-chat-text {
            background: linear-gradient(135deg, #1565c0 0%, #1976d2 100%);
            color: white;
            border-radius: 12px 12px 2px 12px;
        }

        .ai-chat-message.ai-message .ai-chat-text {
            background: #e3f2fd;
            color: #1565c0;
            border-radius: 12px 12px 12px 2px;
        }

        .ai-chat-avatar {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1rem;
            flex-shrink: 0;
        }

        .ai-message .ai-chat-avatar {
            background: linear-gradient(135deg, #1565c0 0%, #42a5f5 100%);
            color: white;
        }

        .ai-chat-text {
            padding: 0.75rem 1rem;
            border-radius: 12px;
            font-size: 0.95rem;
            line-height: 1.4;
            word-wrap: break-word;
            max-width: 70%;
        }

        .ai-chat-input-container {
            display: flex;
            gap: 0.5rem;
            padding: 1rem;
            background: white;
            border-top: 1px solid #e0e0e0;
            border-radius: 0 0 16px 16px;
        }

        .ai-chat-input {
            flex: 1;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            padding: 0.75rem 1rem;
            font-size: 0.95rem;
            transition: all 0.3s;
            font-family: inherit;
        }

        .ai-chat-input:focus {
            outline: none;
            border-color: #1565c0;
            box-shadow: 0 0 0 3px rgba(21, 101, 192, 0.1);
        }

        .ai-chat-send {
            background: linear-gradient(135deg, #1565c0 0%, #1976d2 100%);
            color: white;
            border: none;
            border-radius: 8px;
            width: 40px;
            height: 40px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s;
            font-size: 1rem;
        }

        .ai-chat-send:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(21, 101, 192, 0.3);
        }

        .ai-chat-send:active {
            transform: translateY(0);
        }

        /* Floating Toggle Button */
        .ai-chat-toggle {
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 56px;
            height: 56px;
            border-radius: 50%;
            background: linear-gradient(135deg, #1565c0 0%, #1976d2 100%);
            color: white;
            border: none;
            cursor: pointer;
            font-size: 1.5rem;
            box-shadow: 0 4px 15px rgba(21, 101, 192, 0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s;
            z-index: 9997;
        }

        .ai-chat-toggle:hover {
            transform: scale(1.1);
            box-shadow: 0 6px 20px rgba(21, 101, 192, 0.5);
        }

        .ai-chat-toggle:active {
            transform: scale(0.95);
        }

        .ai-chat-toggle.hidden {
            display: none;
        }

        /* Loading indicator */
        .ai-loading {
            display: flex;
            gap: 0.3rem;
            align-items: center;
        }

        .ai-loading span {
            width: 8px;
            height: 8px;
            background: #1565c0;
            border-radius: 50%;
            animation: bounce 1.4s infinite;
        }

        .ai-loading span:nth-child(2) {
            animation-delay: 0.2s;
        }

        .ai-loading span:nth-child(3) {
            animation-delay: 0.4s;
        }

        @keyframes bounce {
            0%, 60%, 100% { transform: translateY(0); }
            30% { transform: translateY(-10px); }
        }

        @keyframes slideUp {
            from {
                transform: translateY(20px);
                opacity: 0;
            }
            to {
                transform: translateY(0);
                opacity: 1;
            }
        }

        @keyframes fadeIn {
            from {
                opacity: 0;
                transform: translateY(10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        /* Confirmation Buttons */
        .ai-confirmation-buttons {
            display: flex;
            gap: 0.75rem;
            margin-top: 0.5rem;
        }

        .ai-confirm-btn {
            flex: 1;
            padding: 0.75rem 1.25rem;
            border: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 0.9rem;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
        }

        .ai-confirm-yes {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }

        .ai-confirm-yes:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
        }

        .ai-confirm-no {
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
            color: white;
            box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
        }

        .ai-confirm-no:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(239, 68, 68, 0.4);
        }

        .ai-confirm-btn:active {
            transform: translateY(0);
        }

        /* Responsive */
        @media (max-width: 480px) {
            .ai-chat-widget {
                width: calc(100% - 20px);
                height: 80vh;
                bottom: 70px;
            }

            .ai-chat-text {
                max-width: 85%;
            }
        }

        ::-webkit-scrollbar {
            width: 6px;
        }

        ::-webkit-scrollbar-track {
            background: transparent;
        }

        ::-webkit-scrollbar-thumb {
            background: rgba(21, 101, 192, 0.3);
            border-radius: 3px;
        }

        ::-webkit-scrollbar-thumb:hover {
            background: rgba(21, 101, 192, 0.5);
        }
    `;

    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
}

/**
 * Toggle AI Chat widget visibility
 */
function toggleAIChat() {
    const widget = document.getElementById('ai-chat-widget');
    const toggle = document.getElementById('ai-chat-toggle');

    if (widget && toggle) {
        if (widget.style.display === 'none' || !widget.style.display) {
            widget.style.display = 'flex';
            toggle.classList.add('hidden');
        } else {
            widget.style.display = 'none';
            toggle.classList.remove('hidden');
        }
    }
}

/**
 * Close AI Chat
 */
function closeAIChat() {
    const toggle = document.getElementById('ai-chat-toggle');
    const widget = document.getElementById('ai-chat-widget');

    if (widget) widget.style.display = 'none';
    if (toggle) toggle.classList.remove('hidden');
}

/**
 * Handle Enter key in input
 */
function handleChatKeypress(event) {
    if (event.key === 'Enter') {
        sendAIMessage();
    }
}

/**
 * Send message to AI Agent
 */
async function sendAIMessage() {
    const input = document.getElementById('ai-chat-input');
    const message = input.value.trim();

    if (!message) return;

    // Clear input
    input.value = '';

    // Add user message to UI
    addChatMessage(message, 'user');

    // Show loading indicator
    showLoadingIndicator();

    try {
        // Send to server with previously collected fields
        const response = await fetch(`${SERVER_URL}/ai/process-message`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: message,
                userId: getUserId(),
                conversationHistory: conversationHistory,
                language: currentLanguage,
                previousFields: window.complaintFormData || {} // Send previously collected fields
            }),
            credentials: 'include'
        });

        const data = await response.json();
        removeLoadingIndicator();

        if (!response.ok) {
            addChatMessage(data.message || translations[currentLanguage].error, 'ai');
            return;
        }

        // Log the response for debugging
        console.log('🤖 AI Response:', data);

        // Store in history
        conversationHistory.push({
            user: message,
            assistant: data.followUpQuestion || data.message || 'Processing...'
        });

        // Handle based on intent
        if (data.intent === 'REPORT_COMPLAINT') {
            handleComplaintReporting(data);
        } else if (data.intent === 'TRACK_COMPLAINT') {
            // Show user's complaints
            const trackMsg = data.message || translations[currentLanguage].trackComplaint;
            addChatMessage(trackMsg, 'ai');
            // TODO: Fetch and display user's complaints
        } else if (data.intent === 'ASSIGN_ISSUE') {
            handlePageNavigation(data);
        } else if (data.intent === 'VIEW_DASHBOARD') {
            handlePageNavigation(data);
        } else if (data.intent === 'HISTORY_REPORT') {
            handlePageNavigation(data);
        } else if (data.intent === 'GENERAL_QUERY') {
            // Handle general queries
            const responseMsg = data.message || data.response || translations[currentLanguage].error;
            addChatMessage(responseMsg, 'ai');
        } else {
            // Unknown intent - show message if available
            const fallbackMsg = data.message || data.followUpQuestion || translations[currentLanguage].error;
            addChatMessage(fallbackMsg, 'ai');
        }
    } catch (error) {
        removeLoadingIndicator();
        console.error('❌ Chat error:', error);
        addChatMessage(translations[currentLanguage].error, 'ai');
    }

    // Refocus input
    setTimeout(() => input.focus(), 100);
}

/**
 * Handle complaint reporting flow
 */
function handleComplaintReporting(data) {
    const { fields, missingFields, followUpQuestion, message } = data;

    // Store fields for later submission
    if (!window.complaintFormData) {
        window.complaintFormData = {};
    }
    window.complaintFormData = { ...window.complaintFormData, ...fields };

    // Show AI response message
    if (message) {
        addChatMessage(message, 'ai');
    }

    // If there's a follow-up question, show it
    if (followUpQuestion) {
        setTimeout(() => {
            addChatMessage(followUpQuestion, 'ai');
        }, 500);
    }

    // If there are missing fields, continue conversation
    if (missingFields && missingFields.length > 0) {
        // Don't navigate - keep the conversation going
        console.log('⏳ Still missing fields:', missingFields);
        console.log('📝 Current form data:', window.complaintFormData);
        console.log('📊 Fields collected so far:', Object.keys(window.complaintFormData));
    } else {
        // All fields ready - AUTO SUBMIT (AI Agent does it automatically!)
        console.log('🎉 ALL FIELDS READY! Auto-submitting...');
        console.log('📦 Final form data:', window.complaintFormData);

        const submittingMsg = currentLanguage === 'hi'
            ? '✅ बढ़िया! मेरे पास सभी जानकारी है। मैं आपकी शिकायत दर्ज कर रहा हूँ...'
            : '✅ Perfect! I have all the information. Submitting your complaint now...';

        addChatMessage(submittingMsg, 'ai');

        // Auto-submit after a short delay
        setTimeout(() => {
            console.log('🚀 Calling submitComplaintFromChat()...');
            submitComplaintFromChat();
        }, 1000);
    }
}

/**
 * Add confirmation buttons for complaint submission
 */
function addConfirmationButtons() {
    const messagesContainer = document.getElementById('ai-chat-messages');
    if (!messagesContainer) return;

    const buttonsHTML = `
        <div class="ai-chat-message ai-message">
            <div class="ai-chat-avatar">
                <i class="fas fa-robot"></i>
            </div>
            <div class="ai-confirmation-buttons">
                <button class="ai-confirm-btn ai-confirm-yes" onclick="submitComplaintFromChat()">
                    <i class="fas fa-check"></i> ${currentLanguage === 'hi' ? 'हाँ, दर्ज करें' : 'Yes, Submit'}
                </button>
                <button class="ai-confirm-btn ai-confirm-no" onclick="cancelComplaintSubmission()">
                    <i class="fas fa-times"></i> ${currentLanguage === 'hi' ? 'नहीं, रद्द करें' : 'No, Cancel'}
                </button>
            </div>
        </div>
    `;

    messagesContainer.insertAdjacentHTML('beforeend', buttonsHTML);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

/**
 * Submit complaint from chat
 */
async function submitComplaintFromChat() {
    console.log('🚀 submitComplaintFromChat() called!');
    console.log('📦 Submitting data:', window.complaintFormData);

    // Remove confirmation buttons
    const buttons = document.querySelector('.ai-confirmation-buttons');
    if (buttons) {
        buttons.closest('.ai-chat-message').remove();
    }

    // Show submitting message
    const submittingMsg = currentLanguage === 'hi'
        ? '⏳ आपकी शिकायत दर्ज की जा रही है...'
        : '⏳ Submitting your complaint...';
    addChatMessage(submittingMsg, 'ai');

    try {
        // Submit complaint via API
        console.log('📡 Sending POST request to:', `${SERVER_URL}/api/chat/submit-complaint`);
        const response = await fetch(`${SERVER_URL}/api/chat/submit-complaint`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(window.complaintFormData)
        });

        console.log('📨 Response status:', response.status);
        const result = await response.json();
        console.log('📨 Response data:', result);

        if (result.success) {
            const successMsg = currentLanguage === 'hi'
                ? `✅ शिकायत सफलतापूर्वक दर्ज की गई! शिकायत आईडी: ${result.complaintId}`
                : `✅ Complaint submitted successfully! Complaint ID: ${result.complaintId}`;
            addChatMessage(successMsg, 'ai');

            // Clear form data
            window.complaintFormData = {};

            // Ask if they want to do anything else
            setTimeout(() => {
                const followUpMsg = currentLanguage === 'hi'
                    ? 'क्या मैं आपकी और कोई मदद कर सकता हूँ?'
                    : 'Can I help you with anything else?';
                addChatMessage(followUpMsg, 'ai');
            }, 1000);
        } else {
            const errorMsg = currentLanguage === 'hi'
                ? `❌ शिकायत दर्ज करने में विफल: ${result.message}`
                : `❌ Failed to submit complaint: ${result.message}`;
            addChatMessage(errorMsg, 'ai');
        }
    } catch (error) {
        console.error('❌ Submission error:', error);
        const errorMsg = currentLanguage === 'hi'
            ? '❌ शिकायत दर्ज करने में त्रुटि हुई। कृपया फिर से प्रयास करें।'
            : '❌ Error submitting complaint. Please try again.';
        addChatMessage(errorMsg, 'ai');
    }
}

/**
 * Cancel complaint submission
 */
function cancelComplaintSubmission() {
    // Remove confirmation buttons
    const buttons = document.querySelector('.ai-confirmation-buttons');
    if (buttons) {
        buttons.closest('.ai-chat-message').remove();
    }

    // Clear form data
    window.complaintFormData = {};

    const cancelMsg = currentLanguage === 'hi'
        ? 'ठीक है, मैंने रद्द कर दिया। क्या मैं आपकी और कोई मदद कर सकता हूँ?'
        : 'Okay, I\'ve cancelled that. Can I help you with anything else?';
    addChatMessage(cancelMsg, 'ai');
}

/**
 * Handle page navigation
 */
function handlePageNavigation(data) {
    const { targetPage, message } = data;
    addChatMessage(message || `Taking you to ${targetPage}...`, 'ai');

    setTimeout(() => {
        window.location.href = targetPage;
    }, 1500);
}

/**
 * Navigate to form page and auto-fill
 */
function navigateToFormAndFill(targetPage, formData) {
    // Store data in sessionStorage for the form page to access
    sessionStorage.setItem('complaintFormData', JSON.stringify(formData));

    // Navigate
    window.location.href = targetPage;
}

/**
 * Add message to chat UI
 */
function addChatMessage(text, role) {
    const messagesContainer = document.getElementById('ai-chat-messages');
    if (!messagesContainer) return;

    const messageClass = role === 'user' ? 'user-message' : 'ai-message';
    const avatarIcon = role === 'user' ? '<i class="fas fa-user"></i>' : '<i class="fas fa-robot"></i>';

    const messageHTML = `
        <div class="ai-chat-message ${messageClass}">
            ${role === 'ai' ? `<div class="ai-chat-avatar">${avatarIcon}</div>` : ''}
            <div class="ai-chat-text">${text}</div>
            ${role === 'user' ? `<div class="ai-chat-avatar">${avatarIcon}</div>` : ''}
        </div>
    `;

    messagesContainer.insertAdjacentHTML('beforeend', messageHTML);

    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

/**
 * Show loading indicator
 */
function showLoadingIndicator() {
    const messagesContainer = document.getElementById('ai-chat-messages');
    if (!messagesContainer) return;

    const loadingHTML = `
        <div id="ai-loading-indicator" class="ai-chat-message ai-message">
            <div class="ai-chat-avatar">
                <i class="fas fa-robot"></i>
            </div>
            <div class="ai-loading">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    `;

    messagesContainer.insertAdjacentHTML('beforeend', loadingHTML);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

/**
 * Remove loading indicator
 */
function removeLoadingIndicator() {
    const indicator = document.getElementById('ai-loading-indicator');
    if (indicator) indicator.remove();
}

/**
 * Get current user ID (from session/cookies)
 */
function getUserId() {
    // Extract from JWT or user data
    return document.cookie.split('; ').find(row => row.startsWith('userId='))?.split('=')[1] || 'anonymous';
}

/**
 * Initialize on page load
 */
document.addEventListener('DOMContentLoaded', () => {
    // Initialize AI Chat widget
    initializeAIChat();

    // Auto-fill form if data exists in sessionStorage
    const formData = sessionStorage.getItem('complaintFormData');
    if (formData) {
        try {
            const data = JSON.parse(formData);
            autoFillComplaintForm(data);
            sessionStorage.removeItem('complaintFormData');
        } catch (e) {
            console.warn('Could not parse form data:', e);
        }
    }
});

/**
 * Auto-fill complaint form with extracted data
 */
function autoFillComplaintForm(formData) {
    console.log('🎯 Auto-filling form with:', formData);

    // Map form data to HTML elements
    Object.entries(formData).forEach(([key, value]) => {
        if (!value) return;

        // Try different selectors
        const selectors = [
            `#${key}`,
            `[name="${key}"]`,
            `[data-field="${key}"]`
        ];

        let element = null;
        for (const selector of selectors) {
            element = document.querySelector(selector);
            if (element) break;
        }

        if (element) {
            if (element.tagName === 'SELECT') {
                element.value = value;
                element.dispatchEvent(new Event('change', { bubbles: true }));
            } else if (element.tagName === 'TEXTAREA' || element.type === 'text') {
                element.value = value;
                element.dispatchEvent(new Event('input', { bubbles: true }));
            }
        }
    });

    // Scroll to form
    const form = document.querySelector('form');
    if (form) {
        form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}
