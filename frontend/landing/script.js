// Global variables
let currentUserType = null;
let chatbotOpen = false;
let voiceAssistantOpen = false;
let isRecording = false;
let recognition = null;
let ttsEnabled = true;

/**
 * Redirect to appropriate portal
 */
function redirectToPortal(type) {
    if (type === 'municipality') {
        // Redirect to official login (server-rendered EJS view)
        window.location.href = '/official/login';
    } else if (type === 'citizen') {
        // Redirect to citizen login (server-rendered EJS view)
        window.location.href = '/user/login';
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    initializeVoiceRecognition();
    animateElements();
    // Fix: Initialize chatbot and voice assistant states
    initializeChatbotAndVoiceState();
});

// NEW FUNCTION: Initialize chatbot and voice assistant states
function initializeChatbotAndVoiceState() {
    // Set initial states to match the global variables
    const chatbotBody = document.getElementById('chatbotBody');
    const voiceBody = document.getElementById('voiceBody');
    const chatbotToggle = document.getElementById('chatbotToggle');
    const voiceToggle = document.getElementById('voiceToggle');

    // Ensure chatbot starts collapsed (closed)
    if (chatbotBody) {
        if (!chatbotOpen) {
            chatbotBody.classList.add('collapsed');
            if (chatbotToggle) {
                chatbotToggle.style.transform = 'rotate(180deg)';
            }
        } else {
            chatbotBody.classList.remove('collapsed');
            if (chatbotToggle) {
                chatbotToggle.style.transform = 'rotate(0deg)';
            }
        }
    }

    // Ensure voice assistant starts collapsed (closed)
    if (voiceBody) {
        if (!voiceAssistantOpen) {
            voiceBody.classList.add('collapsed');
            if (voiceToggle) {
                voiceToggle.style.transform = 'rotate(180deg)';
            }
        } else {
            voiceBody.classList.remove('collapsed');
            if (voiceToggle) {
                voiceToggle.style.transform = 'rotate(0deg)';
            }
        }
    }
}

function initializeApp() {
    // Add fade-in animation to main elements
    const elements = document.querySelectorAll('.user-card, .service-card, .dashboard-card');
    elements.forEach((el, index) => {
        setTimeout(() => {
            el.classList.add('fade-in');
        }, index * 100);
    });
}

function setupEventListeners() {
    // Navigation smooth scrolling
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
            
            // Update active nav link
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Chat input enter key
    const chatInput = document.getElementById('chatInput');
    if (chatInput) {
        chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }

    // Service card hover effects
    document.querySelectorAll('.service-card').forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-8px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });

    // Dashboard button interactions
    document.querySelectorAll('.dashboard-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const dashboardType = this.closest('.dashboard-card').id;
            showDashboardDetails(dashboardType);
        });
    });
}

function selectUserType(type) {
    currentUserType = type;

    // Add visual feedback
    const cards = document.querySelectorAll('.user-card');
    cards.forEach(card => {
        card.style.opacity = '0.5';
        card.style.transform = 'scale(0.95)';
    });

    const selectedCard = document.getElementById(type + 'Card');
    if (selectedCard) {
        selectedCard.style.opacity = '1';
        selectedCard.style.transform = 'scale(1.05)';
        selectedCard.style.borderColor = 'var(--primary-blue)';
    }

    // Show relevant dashboard
    setTimeout(() => {
        showRelevantDashboard(type);
        showNotification(`Welcome! You've selected ${type} portal.`);
    }, 500);

    // Reset cards after animation
    setTimeout(() => {
        cards.forEach(card => {
            card.style.opacity = '1';
            card.style.transform = 'scale(1)';
        });
        if (selectedCard) {
            selectedCard.style.borderColor = 'var(--accent-blue)';
        }
    }, 2000);
}

function redirectToPortal(type) {
    currentUserType = type;

    // Add visual feedback
    const cards = document.querySelectorAll('.user-card');
    const selectedCard = document.getElementById(type + 'Card');

    cards.forEach(card => {
        card.style.opacity = '0.5';
        card.style.transform = 'scale(0.95)';
    });

    if (selectedCard) {
        selectedCard.style.opacity = '1';
        selectedCard.style.transform = 'scale(1.05)';
        selectedCard.style.borderColor = 'var(--primary-blue)';

        // Show loading animation
        const button = selectedCard.querySelector('button');
        if (button) {
            const originalText = button.textContent;
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading Portal...';
            button.disabled = true;
        }
    }

    showNotification(`Redirecting to ${type} portal...`, 'info');

    // Redirect after animation
    setTimeout(() => {
        if (type === 'citizen') {
                // Redirect to citizen login route
                window.location.href = '/user/login';
        } else if (type === 'municipality') {
                // Redirect to official login route
                window.location.href = '/official/login';
        }
    }, 2000);
}

function showRelevantDashboard(type) {
    const citizenDash = document.getElementById('citizenDashboard');
    const municipalityDash = document.getElementById('municipalityDashboard');
    
    if (type === 'citizen' && citizenDash) {
        citizenDash.style.display = 'block';
        if (municipalityDash) municipalityDash.style.opacity = '0.7';
        citizenDash.classList.add('slide-up');
    } else if (municipalityDash) {
        municipalityDash.style.display = 'block';
        if (citizenDash) citizenDash.style.opacity = '0.7';
        municipalityDash.classList.add('slide-up');
    }
}

function showDashboardDetails(dashboardType) {
    const messages = {
        citizenDashboard: "Opening Citizen Dashboard with personalized services, document management, and service requests.",
        municipalityDashboard: "Opening Municipality Dashboard with administrative tools, citizen management, and service analytics."
    };
    
    showNotification(messages[dashboardType] || "Opening dashboard...");
    
    // Simulate dashboard loading
    const btn = event.target;
    const originalText = btn.textContent;
    btn.textContent = 'Loading...';
    btn.disabled = true;
    
    setTimeout(() => {
        btn.textContent = originalText;
        btn.disabled = false;
        addChatMessage(`Dashboard loaded successfully! ${messages[dashboardType]}`, 'bot');
    }, 2000);
}

// Voice Assistant Functions
function initializeVoiceRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = function() {
            updateVoiceStatus('Listening...', 'listening');
            const voiceBtn = document.getElementById('voiceBtn');
            if (voiceBtn) {
                voiceBtn.classList.add('recording');
                const voiceBtnSpan = document.querySelector('#voiceBtn span');
                if (voiceBtnSpan) voiceBtnSpan.textContent = 'Stop Listening';
            }
        };

        recognition.onresult = function(event) {
            let transcript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                } else {
                    transcript += event.results[i][0].transcript;
                }
            }

            const transcriptContent = document.getElementById('transcriptContent');
            if (transcriptContent) {
                transcriptContent.innerHTML = `<p>${finalTranscript + transcript}</p>`;
                transcriptContent.classList.add('active');
            }

            if (finalTranscript) {
                processVoiceCommand(finalTranscript.trim());
            }
        };

        recognition.onerror = function(event) {
            updateVoiceStatus('Error occurred. Please try again.', 'error');
            stopVoiceRecording();
        };

        recognition.onend = function() {
            if (isRecording) {
                recognition.start(); // Restart if still recording
            } else {
                updateVoiceStatus('Click to activate voice assistant', 'idle');
            }
        };
    } else {
        updateVoiceStatus('Voice recognition not supported in this browser', 'error');
        const voiceBtn = document.getElementById('voiceBtn');
        if (voiceBtn) voiceBtn.disabled = true;
    }
}

// IMPROVED: Toggle functions with better error handling
function toggleVoiceAssistant() {
    const voiceBody = document.getElementById('voiceBody');
    const toggleIcon = document.getElementById('voiceToggle');

    if (!voiceBody) {
        console.error('Voice assistant body not found');
        return;
    }

    voiceAssistantOpen = !voiceAssistantOpen;

    if (voiceAssistantOpen) {
        voiceBody.classList.remove('collapsed');
        if (toggleIcon) toggleIcon.style.transform = 'rotate(0deg)';
    } else {
        voiceBody.classList.add('collapsed');
        if (toggleIcon) toggleIcon.style.transform = 'rotate(180deg)';
    }
}

function toggleChatbot() {
    const chatbotBody = document.getElementById('chatbotBody');
    const toggleIcon = document.getElementById('chatbotToggle');

    if (!chatbotBody) {
        console.error('Chatbot body not found');
        return;
    }

    chatbotOpen = !chatbotOpen;

    if (chatbotOpen) {
        chatbotBody.classList.remove('collapsed');
        if (toggleIcon) toggleIcon.style.transform = 'rotate(0deg)';
    } else {
        chatbotBody.classList.add('collapsed');
        if (toggleIcon) toggleIcon.style.transform = 'rotate(180deg)';
    }
}

function toggleVoiceRecording() {
    if (!recognition) {
        showNotification('Voice recognition not available', 'error');
        return;
    }

    if (!isRecording) {
        startVoiceRecording();
    } else {
        stopVoiceRecording();
    }
}

function startVoiceRecording() {
    isRecording = true;
    recognition.start();
    updateVoiceStatus('Starting...', 'processing');
    showNotification('Voice recording started', 'info');
}

function stopVoiceRecording() {
    isRecording = false;
    if (recognition) {
        recognition.stop();
    }
    const voiceBtn = document.getElementById('voiceBtn');
    if (voiceBtn) {
        voiceBtn.classList.remove('recording');
        const voiceBtnSpan = document.querySelector('#voiceBtn span');
        if (voiceBtnSpan) voiceBtnSpan.textContent = 'Start Listening';
    }
    updateVoiceStatus('Click to activate voice assistant', 'idle');
    const transcriptContent = document.getElementById('transcriptContent');
    if (transcriptContent) transcriptContent.classList.remove('active');
}

function updateVoiceStatus(message, status) {
    const statusIndicator = document.getElementById('statusIndicator');
    const voiceStatus = document.getElementById('voiceStatus');
    
    if (!statusIndicator || !voiceStatus) return;
    
    const icon = statusIndicator.querySelector('i');
    if (!icon) return;

    voiceStatus.textContent = message;

    // Remove all status classes
    statusIndicator.classList.remove('listening', 'processing', 'error');

    // Update icon and add appropriate class
    switch (status) {
        case 'listening':
            icon.className = 'fas fa-microphone';
            statusIndicator.classList.add('listening');
            break;
        case 'processing':
            icon.className = 'fas fa-cog fa-spin';
            statusIndicator.classList.add('processing');
            break;
        case 'error':
            icon.className = 'fas fa-exclamation-triangle';
            statusIndicator.classList.add('error');
            break;
        default:
            icon.className = 'fas fa-microphone-slash';
            break;
    }
}

function processVoiceCommand(transcript) {
    const command = transcript.toLowerCase();

    updateVoiceStatus('Processing command...', 'processing');

    setTimeout(() => {
            if (command.includes('citizen') || command.includes('citizen portal')) {
            speak('Opening citizen portal');
            showNotification('Opening Citizen Portal...', 'success');
            setTimeout(() => {
                window.location.href = '/user/login';
            }, 1500);
            } else if (command.includes('municipality') || command.includes('municipal') || command.includes('admin')) {
            speak('Opening municipality portal');
            showNotification('Opening Municipality Portal...', 'success');
            setTimeout(() => {
                window.location.href = '/official/login';
            }, 1500);
        } else if (command.includes('feature') || command.includes('about')) {
            speak('Here are our platform features');
            showNotification('Scrolling to features section', 'info');
            const featuresSection = document.querySelector('.features-section');
            if (featuresSection) featuresSection.scrollIntoView({ behavior: 'smooth' });
        } else if (command.includes('help') || command.includes('start')) {
            speak('I can help you navigate the portal. Say "citizen portal" or "municipality portal" to get started.');
            showNotification('Voice commands: "citizen portal", "municipality portal", "features"', 'info');
        } else if (command.includes('stats') || command.includes('statistics')) {
            speak('Showing platform statistics');
            const statsSection = document.querySelector('.stats-section');
            if (statsSection) statsSection.scrollIntoView({ behavior: 'smooth' });
        } else {
            speak('Command not recognized. Try saying "help" for available commands.');
            showNotification('Command not recognized. Try "help" for available commands.', 'error');
        }

        updateVoiceStatus('Click to activate voice assistant', 'idle');
    }, 1000);
}

function toggleTTS() {
    ttsEnabled = !ttsEnabled;
    const ttsBtn = document.getElementById('ttsBtn');

    if (ttsBtn) {
        if (ttsEnabled) {
            ttsBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
            ttsBtn.classList.remove('disabled');
            showNotification('Text-to-speech enabled', 'success');
        } else {
            ttsBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
            ttsBtn.classList.add('disabled');
            showNotification('Text-to-speech disabled', 'info');
        }
    }
}

function speak(text) {
    if (ttsEnabled && 'speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.8;
        utterance.pitch = 1;
        utterance.volume = 0.8;
        speechSynthesis.speak(utterance);
    }
}

// Add click handlers for command suggestions
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('command-item')) {
        const command = e.target.textContent.replace(/"/g, '');
        processVoiceCommand(command);
    }
});

function sendMessage() {
    const input = document.getElementById('chatInput');
    if (!input) return;
    
    const message = input.value.trim();
    
    if (message === '') return;
    
    // Add user message
    addChatMessage(message, 'user');
    input.value = '';
    
    // Simulate bot response
    setTimeout(() => {
        const response = generateBotResponse(message);
        addChatMessage(response, 'bot');
    }, 1000);
}

function addChatMessage(message, sender) {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    
    if (sender === 'bot') {
        messageDiv.innerHTML = `
            <i class="fas fa-robot"></i>
            <span>${message}</span>
        `;
    } else {
        messageDiv.innerHTML = `<span>${message}</span>`;
    }
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // Add animation
    messageDiv.style.opacity = '0';
    messageDiv.style.transform = 'translateY(20px)';
    setTimeout(() => {
        messageDiv.style.opacity = '1';
        messageDiv.style.transform = 'translateY(0)';
        messageDiv.style.transition = 'all 0.3s ease';
    }, 100);
}

function generateBotResponse(userMessage) {
    const responses = {
        'hello': 'Hello! Welcome to the Civic Portal. How can I assist you today?',
        'services': 'We offer document processing, and analytics dashboards. Which service interests you?',
        'citizen': 'As a citizen, you can access personal services, manage documents, and track service requests through your dashboard.',
        'municipality': 'Municipality users can manage civic services, view analytics, and administer citizen requests through the administrative dashboard.',
        'help': 'I can help you navigate the portal, explain services, or guide you through the registration process. What do you need help with?',
        'blockchain': 'Our blockchain services provide secure, transparent digital transactions and immutable record keeping for government processes.',
        'cardiology': 'The healthcare portal includes cardiology services where you can access medical records, schedule appointments, and view test results.',
        'dashboard': 'Your dashboard provides real-time access to services, statistics, and personalized information based on your user type.',
        'default': 'Thank you for your message. Our support team will help you with specific inquiries. You can also explore the services section for more information.'
    };
    
    const lowerMessage = userMessage.toLowerCase();
    
    for (const [key, response] of Object.entries(responses)) {
        if (lowerMessage.includes(key)) {
            return response;
        }
    }
    
    return responses.default;
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    
    // Set colors based on type
    let bgColor = 'linear-gradient(135deg, var(--primary-blue), var(--light-blue))';
    if (type === 'success') bgColor = 'linear-gradient(135deg, #10b981, #34d399)';
    if (type === 'error') bgColor = 'linear-gradient(135deg, #ef4444, #f87171)';
    if (type === 'warning') bgColor = 'linear-gradient(135deg, #f59e0b, #fbbf24)';
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${bgColor};
        color: white;
        padding: 15px 25px;
        border-radius: 10px;
        box-shadow: 0 10px 30px rgba(30, 64, 175, 0.3);
        z-index: 1001;
        font-weight: 500;
        max-width: 300px;
        transform: translateX(100%);
        transition: transform 0.3s ease;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after 4 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 4000);
}

function animateElements() {
    // Intersection Observer for scroll animations
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');

                // Animate counters
                if (entry.target.classList.contains('stat-number')) {
                    animateCounter(entry.target);
                }
            }
        });
    }, {
        threshold: 0.1
    });

    // Observe elements for animation
    document.querySelectorAll('.service-card, .dashboard-card, .user-card, .feature-card, .stat-card, .stat-number').forEach(el => {
        observer.observe(el);
    });
}

// Counter animation function
function animateCounter(element) {
    const target = parseInt(element.dataset.target) || parseFloat(element.dataset.target);
    const duration = 2000; // 2 seconds
    const increment = target / (duration / 16); // 60fps
    let current = 0;

    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }

        // Format the number
        if (target >= 1000) {
            element.textContent = Math.floor(current).toLocaleString();
        } else if (target < 10 && target % 1 !== 0) {
            element.textContent = current.toFixed(1);
        } else {
            element.textContent = Math.floor(current);
        }
    }, 16);
}

// Service card click handlers
document.addEventListener('click', function(e) {
    if (e.target.closest('.service-card')) {
        const card = e.target.closest('.service-card');
        const title = card.querySelector('h4');
        if (title) {
            showNotification(`Opening ${title.textContent} - Please wait...`);
            
            // Add ripple effect
            const ripple = document.createElement('div');
            ripple.style.cssText = `
                position: absolute;
                border-radius: 50%;
                background: rgba(30, 64, 175, 0.3);
                transform: scale(0);
                animation: ripple 0.6s linear;
                pointer-events: none;
            `;
            
            const rect = card.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
            ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
            
            card.style.position = 'relative';
            card.appendChild(ripple);
            
            setTimeout(() => {
                if (card.contains(ripple)) {
                    card.removeChild(ripple);
                }
            }, 600);
        }
    }
});

// Add ripple animation CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes ripple {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Add loading states for interactive elements
function addLoadingState(element, duration = 2000) {
    if (!element) return;
    
    const originalContent = element.innerHTML;
    element.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
    element.disabled = true;
    
    setTimeout(() => {
        element.innerHTML = originalContent;
        element.disabled = false;
    }, duration);
}

// Initialize tooltips for service cards
document.querySelectorAll('.service-card').forEach(card => {
    card.addEventListener('mouseenter', function() {
        const title = this.querySelector('h4');
        if (title) {
            showTooltip(this, `Click to access ${title.textContent}`);
        }
    });
});

function showTooltip(element, text) {
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    tooltip.textContent = text;
    tooltip.style.cssText = `
        position: absolute;
        background: var(--dark-blue);
        color: white;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 0.8rem;
        z-index: 1000;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.3s ease;
        white-space: nowrap;
    `;
    
    document.body.appendChild(tooltip);
    
    const rect = element.getBoundingClientRect();
    tooltip.style.left = (rect.left + rect.width / 2 - tooltip.offsetWidth / 2) + 'px';
    tooltip.style.top = (rect.top - tooltip.offsetHeight - 10) + 'px';
    
    setTimeout(() => tooltip.style.opacity = '1', 100);
    
    element.addEventListener('mouseleave', function() {
        tooltip.style.opacity = '0';
        setTimeout(() => {
            if (document.body.contains(tooltip)) {
                document.body.removeChild(tooltip);
            }
        }, 300);
    }, { once: true });
}