// Configuration
const SERVER_URL = 'http://localhost:3000';

// Language / Translations
let currentLang = localStorage.getItem('lang') || 'en';

const TRANSLATIONS = {
    hi: {
        logo: 'नागरिक पोर्टल',
        quick_actions: 'त्वरित क्रियाएँ',
        report_issue: 'समस्या की रिपोर्ट करें',
        track_complaint: 'शिकायत ट्रैक करें',
        pay_bill: 'बिल भुगतान',
        request_certificate: 'प्रमाण पत्र का अनुरोध',
        book_appointment: 'नियुक्ति बुक करें',
        voice_assistant: 'वॉइस सहायक',
        click_to_speak: 'बोलने के लिए क्लिक करें',
        my_area_problems: 'मेरे क्षेत्र की समस्याएँ',
        bills_dues: 'बिल और बकाया',
        my_recent_complaints: 'मेरी हाल की शिकायतें',
        all_my_complaints: 'मेरी सभी शिकायतें',
        view_all: 'सभी देखें',
        select_category: 'श्रेणी चुनें',
        select_department: 'विभाग चुनें',
        description: 'विवरण',
        take_photo: 'फोटो लें (वैकल्पिक)',
        submit: 'सबमिट करें',
        no_complaints_yet: ' अभी तक कोई शिकायत नहीं। पहली शिकायत दर्ज करने के लिए "समस्या की रिपोर्ट करें" पर क्लिक करें।',
        loading_complaints: 'शिकायतें लोड हो रही हैं...',
        fetch_problems: 'समस्याएं प्राप्त करें',
        loading_problems: 'समस्याएं लोड हो रही हैं...',
        no_problems_found: 'आपके क्षेत्र में कोई समस्या नहीं मिली',
        notifications: 'सूचनाएं',
        loading_notifications: 'सूचनाएं लोड हो रही हैं...',
        no_notifications: 'अभी तक कोई सूचना नहीं',
        error_loading_notifications: 'सूचनाएं लोड करने में त्रुटि',
        voice_listening: 'सुन रहा है...',
        voice_processing: 'प्रतिक्रिया प्राप्त कर रहे हैं...',
        voice_error: 'वॉइस पहचान त्रुटि',
        voice_not_supported: 'आपका ब्राउज़र वॉइस पहचान का समर्थन नहीं करता है',
        generating_response: 'जवाब तैयार हो रहा है...',
        you: 'आप',
        assistant: 'सहायक',
        voice_enabled: 'आवाज़ सक्षम',
        voice_disabled: 'आवाज़ अक्षम',
        complaint_submitted: 'शिकायत सफलतापूर्वक दर्ज की गई',
        complaint_id: 'शिकायत आईडी',
        submission_failed: 'शिकायत दर्ज करने में विफल',
        invalid_image: 'कैप्चर की गई छवि अमान्य या असमर्थित प्रारूप है',
        required_fields: 'कृपया सभी आवश्यक फ़ील्ड भरें'
    }
};

function translatePage(lang) {
    if (!lang || lang === 'en') return; // nothing to do for English baseline
    const t = TRANSLATIONS[lang];
    if (!t) return;

    // Simple selector-based translations
    const selSet = [
        { sel: '.logo span', key: 'logo' },
        { sel: '.quick-actions h3', key: 'quick_actions' },
        { sel: '.action-btn:nth-child(1) span', key: 'report_issue' },
        { sel: '.action-btn:nth-child(2) span', key: 'track_complaint' },
        { sel: '.action-btn:nth-child(3) span', key: 'pay_bill' },
        { sel: '.action-btn:nth-child(4) span', key: 'request_certificate' },
        { sel: '.action-btn:nth-child(5) span', key: 'book_appointment' },
        { sel: '.voice-assistant h4', key: 'voice_assistant' },
        { sel: '#voiceStatus', key: 'click_to_speak' },
        { sel: '.alert-card .card-header h3', key: 'my_area_problems' },
        { sel: '.bills-card .card-header h3', key: 'bills_dues' },
        { sel: '.requests-card .card-header h3', key: 'my_recent_complaints' },
        { sel: 'section.my-complaints-section h2', key: 'all_my_complaints' },
        { sel: '#report-issue-modal h3', key: 'report_issue' },
        { sel: '#report-issue-form label[for="issue-category"]', key: 'select_category' },
        { sel: '#report-issue-form label[for="issue-department"]', key: 'select_department' },
        { sel: '#report-issue-form label[for="issue-description"]', key: 'description' },
        { sel: '#report-issue-modal button[type="submit"]', key: 'submit' },
        { sel: '.fetch-problems-btn span', key: 'fetch_problems' },
        { sel: '#notificationsPanel .panel-header h3', key: 'notifications' }
    ];

    selSet.forEach(entry => {
        const el = document.querySelector(entry.sel);
        if (el && t[entry.key]) {
            // For buttons/spans, set textContent
            el.textContent = t[entry.key];
        }
    });

    // Replace some inline placeholder texts
    const allComplaintsContainer = document.getElementById('all-complaints-container');
    if (allComplaintsContainer && TRANSLATIONS[lang].no_complaints_yet) {
        // If currently the container has the default English paragraph, replace it
        const p = allComplaintsContainer.querySelector('p');
        if (p && p.textContent.includes('No complaints yet')) {
            p.textContent = TRANSLATIONS[lang].no_complaints_yet;
        }
    }
}

function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('lang', lang);
    // Apply translations
    if (lang === 'en') {
        // page is originally English; reload to get dynamic text back or re-run data functions
        // Instead of full reload, we will re-run load/display functions and then skip translation
        // but first reset some static elements to English by reloading page texts where feasible
        window.location.reload();
        return;
    }
    translatePage(lang);
    // Also update dynamic selects
    const cat = document.getElementById('issue-category');
    if (cat) cat.querySelector('option') && (cat.querySelector('option').textContent = TRANSLATIONS[lang].select_category);
    const dept = document.getElementById('issue-department');
    if (dept) dept.querySelector('option') && (dept.querySelector('option').textContent = TRANSLATIONS[lang].select_department);
}

// Load departments and categories on page load
document.addEventListener('DOMContentLoaded', function () {
    // set language selector
    const langSelect = document.getElementById('languageSelect');
    if (langSelect) {
        langSelect.value = currentLang;
        langSelect.addEventListener('change', (e) => setLanguage(e.target.value));
    }

    loadDepartments();
    loadCategories();
    loadUserComplaints();
    loadInitialNotificationCount();

    const reportForm = document.getElementById('report-issue-form');
    if (reportForm) {
        reportForm.addEventListener('submit', submitComplaint);
    }

    // Apply translation if non-english
    if (currentLang && currentLang !== 'en') {
        setTimeout(() => translatePage(currentLang), 300);
    }
});

// Load departments
async function loadDepartments() {
    try {
        const response = await fetch(`${SERVER_URL}/api/departments`);
        const data = await response.json();

        const departmentSelect = document.getElementById('issue-department');
        departmentSelect.innerHTML = `<option value="">${currentLang === 'hi' ? 'विभाग चुनें' : 'Select Department'}</option>`;

        data.departments.forEach(dept => {
            const option = document.createElement('option');
            option.value = dept.Name; // Use Name instead of ID
            option.textContent = dept.Name;
            departmentSelect.appendChild(option);
        });
        console.log('✅ Departments loaded:', data.departments.length);
    } catch (error) {
        console.error('❌ Error loading departments:', error);
    }
}

// Load categories
async function loadCategories() {
    try {
        const response = await fetch(`${SERVER_URL}/api/categories`);

        const data = await response.json();

        const categorySelect = document.getElementById('issue-category');
        categorySelect.innerHTML = `<option value="">${currentLang === 'hi' ? 'श्रेणी चुनें' : 'Select Category'}</option>`;

        data.categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.Name; // Use Name instead of ID
            option.textContent = cat.Name;
            categorySelect.appendChild(option);
        });
        console.log('✅ Categories loaded:', data.categories.length);
    } catch (error) {
        console.error('❌ Error loading categories:', error);
    }
}

// Load user complaints

async function loadUserComplaints() {
    try {
        const response = await fetch(`${SERVER_URL}/user/trackComplain`, {
            credentials: 'include'
        });
        const data = await response.json();

        if (response.ok) {
            console.log('✅ Complaints loaded:', data.complaints.length);
            displayComplaints(data.complaints);
            displayAllComplaintsInDashboard(data.complaints);
            updateQuickStats(data.complaints);
        }
    } catch (error) {
        console.error('❌ Error loading complaints:', error);
    }
}

// Update Quick Stats card
function updateQuickStats(complaints) {
    const totalElement = document.getElementById('total-complaints');
    const pendingElement = document.getElementById('pending-complaints');
    const inprogressElement = document.getElementById('inprogress-complaints');
    const resolvedElement = document.getElementById('resolved-complaints');

    if (!totalElement) return;

    const total = complaints.length;
    const pending = complaints.filter(c => c.status === 'reported' || c.status === 'pending').length;
    const inprogress = complaints.filter(c => c.status === 'in-progress').length;
    const resolved = complaints.filter(c => c.status === 'resolved').length;

    totalElement.textContent = total;
    pendingElement.textContent = pending;
    inprogressElement.textContent = inprogress;
    resolvedElement.textContent = resolved;
}

// Display all complaints in the dashboard section
function displayAllComplaintsInDashboard(complaints) {
    const container = document.getElementById('all-complaints-container');
    if (!container) return;

    container.innerHTML = '';

    if (complaints.length === 0) {
        container.innerHTML = '<p style="color: #64748b; grid-column: 1/-1; text-align: center; padding: 2rem;">No complaints yet. Click "Report Issue" to submit your first complaint.</p>';
        return;
    }

    complaints.forEach(complaint => {
        const statusClass = complaint.status === 'resolved' ? 'resolved' :
            complaint.status === 'in-progress' ? 'in-progress' : 'pending';
        const statusText = complaint.status.charAt(0).toUpperCase() + complaint.status.slice(1).replace('-', ' ');

        // Worker assignment info
        const hasWorker = complaint.worker_id && complaint.worker_first_name;
        const workerName = hasWorker ? `${complaint.worker_first_name} ${complaint.worker_last_name}` : null;
        const workerPhone = hasWorker ? complaint.worker_phone : null;

        const complaintCard = document.createElement('div');
        complaintCard.className = 'complaint-card';
        complaintCard.style.cssText = 'background: white; border-radius: 12px; padding: 1.5rem; box-shadow: 0 4px 15px rgba(0,0,0,0.1); transition: transform 0.3s ease;';

        complaintCard.innerHTML = `
                    <div style="display: flex; justify-content: between; align-items: start; margin-bottom: 1rem;">
                        <div style="flex: 1;">
                            <h4 style="color: var(--dark-blue); margin: 0 0 0.5rem 0; font-size: 1.1rem;">
                                <i class="fas fa-ticket-alt" style="color: var(--primary-blue);"></i>
                                ${complaint.category_name || 'Complaint'}
                            </h4>
                            <p style="color: #64748b; font-size: 0.85rem; margin: 0;">
                                ID: #${complaint.complaint_id} | ${complaint.department_name || 'N/A'}
                            </p>
                        </div>
                        <span class="status ${statusClass}" style="margin-left: 1rem;">${statusText}</span>
                    </div>

                    <p style="color: #475569; margin: 1rem 0; line-height: 1.5;">
                        ${complaint.description}
                    </p>

                    ${hasWorker ? `
                        <div style="background: linear-gradient(135deg, #dbeafe, #bfdbfe); padding: 1rem; border-radius: 8px; margin: 1rem 0; border-left: 3px solid #2563eb;">
                            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                                <i class="fas fa-user-hard-hat" style="color: #1e40af;"></i>
                                <span style="font-weight: 600; color: #1e3a8a; font-size: 0.95rem;">Assigned Worker</span>
                            </div>
                            <div style="display: flex; flex-direction: column; gap: 0.25rem; margin-left: 1.75rem;">
                                <small style="color: #1e3a8a; font-weight: 500;">
                                    <i class="fas fa-user" style="font-size: 0.75rem;"></i> ${workerName}
                                </small>
                                ${workerPhone ? `
                                    <small style="color: #1e3a8a;">
                                        <i class="fas fa-phone" style="font-size: 0.75rem;"></i> ${workerPhone}
                                    </small>
                                ` : ''}
                            </div>
                        </div>
                        ${complaint.status === 'resolved' ? `
                            <div style="background: #f0fdf4; padding: 1rem; border-radius: 8px; margin: 1rem 0; border-left: 3px solid #10b981;">
                                <div style="display:flex; flex-direction: column; gap:10px;">
                                    ${complaint.citizen_confirmed ? `
                                        <span style="color: #10b981; font-weight:600; font-size: 0.9rem;">
                                            <i class="fas fa-check-circle"></i> Thank you for confirming completion
                                        </span>
                                    ` : `
                                        <button class="confirm-btn" onclick="confirmCompletion(${complaint.assignment_id}, ${complaint.complaint_id})" style="padding: 0.5rem 1rem; background: #10b981; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500; transition: all 0.3s;">
                                            <i class="fas fa-check"></i> Confirm Work Done
                                        </button>
                                    `}
                                    ${complaint.rating ? `
                                        <div style="margin-top: 0.5rem;">
                                            <strong style="color: #1e3a8a;">Your Rating:</strong>
                                            <span style="color: #f59e0b; font-size: 1.1rem;">${'★'.repeat(complaint.rating)}${'☆'.repeat(5 - complaint.rating)}</span>
                                            ${complaint.review ? `<div style="margin-top: 0.25rem;"><small style="color: #64748b;">"${complaint.review}"</small></div>` : ''}
                                        </div>
                                    ` : `
                                        <div style="background: white; padding: 0.75rem; border-radius: 6px; margin-top: 0.5rem;">
                                            <label style="font-weight:600; color: #1e3a8a; display: block; margin-bottom: 0.5rem;">Rate Worker</label>
                                            <div style="display:flex; flex-direction: column; gap:8px;">
                                                <div style="display:flex; gap:8px; align-items:center;">
                                                    <select id="rating-select-${complaint.complaint_id}" style="padding: 0.4rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.9rem;">
                                                        <option value="1">1 ★</option>
                                                        <option value="2">2 ★★</option>
                                                        <option value="3">3 ★★★</option>
                                                        <option value="4">4 ★★★★</option>
                                                        <option value="5" selected>5 ★★★★★</option>
                                                    </select>
                                                </div>
                                                <textarea id="rating-review-${complaint.complaint_id}" placeholder="Share your feedback (optional)" rows="2" style="width:100%; padding:0.5rem; border-radius:6px; border:1px solid #cbd5e1; font-size: 0.85rem; resize: vertical;"></textarea>
                                                <button onclick="submitRating(${complaint.assignment_id}, ${complaint.complaint_id})" style="padding:0.5rem 1rem; background:#3b82f6; color:white; border:none; border-radius:6px; cursor: pointer; font-weight: 500; transition: all 0.3s;">
                                                    <i class="fas fa-star"></i> Submit Rating
                                                </button>
                                            </div>
                                        </div>
                                    `}
                                </div>
                            </div>
                        ` : ''}
                    ` : ''}

                    <div style="display: flex; flex-wrap: wrap; gap: 1rem; margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #e2e8f0;">
                        <div style="flex: 1; min-width: 200px;">
                            <small style="color: #64748b; display: block;">
                                <i class="fas fa-map-marker-alt"></i> Location
                            </small>
                            <small style="color: #1e3a8a; font-weight: 500;">
                                ${complaint.City}, ${complaint.State} - ${complaint.Pincode}
                            </small>
                        </div>
                        <div style="flex: 1; min-width: 150px;">
                            <small style="color: #64748b; display: block;">
                                <i class="fas fa-calendar"></i> Submitted
                            </small>
                            <small style="color: #1e3a8a; font-weight: 500;">
                                ${new Date(complaint.created_at).toLocaleDateString()}
                            </small>
                        </div>
                    </div>

                    ${complaint.imageUrl ? `
                        <div style="margin-top: 1rem;">
                            <img src="${complaint.imageUrl}" alt="Complaint image"
                                 style="width: 100%; max-height: 200px; object-fit: cover; border-radius: 8px; cursor: pointer;"
                                 onclick="window.open('${complaint.imageUrl}', '_blank')">
                        </div>
                    ` : ''}
                `;

        complaintCard.onmouseenter = () => {
            complaintCard.style.transform = 'translateY(-5px)';
            complaintCard.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
        };
        complaintCard.onmouseleave = () => {
            complaintCard.style.transform = 'translateY(0)';
            complaintCard.style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)';
        };

        container.appendChild(complaintCard);
    });
}

// Display complaints in the UI
function displayComplaints(complaints) {
    const requestsCard = document.querySelector('.requests-card .card-content');
    if (!requestsCard) return;

    requestsCard.innerHTML = '';

    if (complaints.length === 0) {
        requestsCard.innerHTML = '<p style="color: #64748b;">No complaints yet</p>';
        return;
    }

    // Display up to 3 recent complaints
    complaints.slice(0, 3).forEach(complaint => {
        const requestItem = document.createElement('div');
        requestItem.className = 'request-item';

        // Map status to CSS class
        const statusClass = complaint.status === 'resolved' ? 'resolved' :
            complaint.status === 'in-progress' ? 'in-progress' : 'pending';

        // Format status text for display
        const statusText = complaint.status.charAt(0).toUpperCase() + complaint.status.slice(1).replace('-', ' ');

        requestItem.innerHTML = `
                    <div class="request-info">
                        <span>${complaint.category_name || 'Complaint'}</span>
                        <small>Submitted ${new Date(complaint.created_at).toLocaleDateString()}</small>
                    </div>
                    <span class="status ${statusClass}">${statusText}</span>
                `;

        requestsCard.appendChild(requestItem);
    });

    // Add "View All" button if there are more than 3 complaints
    if (complaints.length > 3) {
        const viewAllBtn = document.createElement('button');
        viewAllBtn.className = 'view-all-btn';
        viewAllBtn.textContent = `View All (${complaints.length})`;
        viewAllBtn.style.cssText = 'margin-top: 10px; padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 8px; cursor: pointer; width: 100%;';
        viewAllBtn.onclick = () => showAllComplaints(complaints);
        requestsCard.appendChild(viewAllBtn);
    }
}

// Show all complaints in a modal
function showAllComplaints(complaints) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';

    const modalContent = document.createElement('div');
    modalContent.className = 'modal';
    modalContent.style.cssText = 'max-width: 900px; max-height: 85vh; overflow-y: auto; padding: 2rem; background: white; border-radius: 16px;';

    // Calculate stats
    const total = complaints.length;
    const pending = complaints.filter(c => c.status === 'reported' || c.status === 'pending').length;
    const inprogress = complaints.filter(c => c.status === 'in-progress').length;
    const resolved = complaints.filter(c => c.status === 'resolved').length;
    const rejected = complaints.filter(c => c.status === 'rejected').length;

    let complaintsHTML = `
                <span class="close-btn" onclick="this.parentElement.parentElement.remove()" style="cursor: pointer;">&times;</span>
                <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem;">
                    <div style="width: 50px; height: 50px; border-radius: 12px; background: linear-gradient(135deg, #3b82f6, #60a5fa); display: flex; align-items: center; justify-content: center;">
                        <i class="fas fa-clipboard-list" style="color: white; font-size: 1.5rem;"></i>
                    </div>
                    <div>
                        <h3 style="margin: 0; color: #1e3a8a; font-size: 1.5rem;">Track My Complaints</h3>
                        <p style="margin: 0; color: #64748b; font-size: 0.9rem;">View and monitor all your submitted complaints</p>
                    </div>
                </div>

                <!-- Stats Summary -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
                    <div style="background: linear-gradient(135deg, #3b82f6, #60a5fa); padding: 1rem; border-radius: 12px; color: white; text-align: center;">
                        <div style="font-size: 2rem; font-weight: 700;">${total}</div>
                        <div style="font-size: 0.85rem; opacity: 0.9;">Total</div>
                    </div>
                    <div style="background: linear-gradient(135deg, #f59e0b, #fbbf24); padding: 1rem; border-radius: 12px; color: white; text-align: center;">
                        <div style="font-size: 2rem; font-weight: 700;">${pending}</div>
                        <div style="font-size: 0.85rem; opacity: 0.9;">Pending</div>
                    </div>
                    <div style="background: linear-gradient(135deg, #8b5cf6, #a78bfa); padding: 1rem; border-radius: 12px; color: white; text-align: center;">
                        <div style="font-size: 2rem; font-weight: 700;">${inprogress}</div>
                        <div style="font-size: 0.85rem; opacity: 0.9;">In Progress</div>
                    </div>
                    <div style="background: linear-gradient(135deg, #10b981, #34d399); padding: 1rem; border-radius: 12px; color: white; text-align: center;">
                        <div style="font-size: 2rem; font-weight: 700;">${resolved}</div>
                        <div style="font-size: 0.85rem; opacity: 0.9;">Resolved</div>
                    </div>
                    <div style="background: linear-gradient(135deg, #ef4444, #f87171); padding: 1rem; border-radius: 12px; color: white; text-align: center;">
                        <div style="font-size: 2rem; font-weight: 700;">${rejected}</div>
                        <div style="font-size: 0.85rem; opacity: 0.9;">Rejected</div>
                    </div>
                </div>

                <!-- Filter Buttons -->
                <div style="display: flex; gap: 0.5rem; margin-bottom: 1rem; flex-wrap: wrap;">
                    <button onclick="filterComplaints('all')" class="filter-btn active" data-filter="all" style="padding: 0.5rem 1rem; border: 2px solid #3b82f6; background: #3b82f6; color: white; border-radius: 8px; cursor: pointer; font-weight: 500; transition: all 0.3s;">
                        All (${total})
                    </button>
                    <button onclick="filterComplaints('pending')" class="filter-btn" data-filter="pending" style="padding: 0.5rem 1rem; border: 2px solid #f59e0b; background: transparent; color: #f59e0b; border-radius: 8px; cursor: pointer; font-weight: 500; transition: all 0.3s;">
                        Pending (${pending})
                    </button>
                    <button onclick="filterComplaints('in-progress')" class="filter-btn" data-filter="in-progress" style="padding: 0.5rem 1rem; border: 2px solid #8b5cf6; background: transparent; color: #8b5cf6; border-radius: 8px; cursor: pointer; font-weight: 500; transition: all 0.3s;">
                        In Progress (${inprogress})
                    </button>
                    <button onclick="filterComplaints('resolved')" class="filter-btn" data-filter="resolved" style="padding: 0.5rem 1rem; border: 2px solid #10b981; background: transparent; color: #10b981; border-radius: 8px; cursor: pointer; font-weight: 500; transition: all 0.3s;">
                        Resolved (${resolved})
                    </button>
                    <button onclick="filterComplaints('rejected')" class="filter-btn" data-filter="rejected" style="padding: 0.5rem 1rem; border: 2px solid #ef4444; background: transparent; color: #ef4444; border-radius: 8px; cursor: pointer; font-weight: 500; transition: all 0.3s;">
                        Rejected (${rejected})
                    </button>
                </div>

                <div id="complaints-list" style="display: flex; flex-direction: column; gap: 1rem; max-height: 400px; overflow-y: auto; padding-right: 0.5rem;">
            `;

    if (complaints.length === 0) {
        complaintsHTML += `
                    <div style="text-align: center; padding: 3rem; color: #64748b;">
                        <i class="fas fa-inbox" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                        <p style="font-size: 1.1rem; margin: 0;">No complaints found</p>
                        <p style="font-size: 0.9rem; margin: 0.5rem 0 0 0;">Click "Report Issue" to submit your first complaint</p>
                    </div>
                `;
    } else {
        complaints.forEach(complaint => {
            const statusClass = complaint.status === 'resolved' ? 'resolved' :
                complaint.status === 'in-progress' ? 'in-progress' : 'pending';
            const statusText = complaint.status.charAt(0).toUpperCase() + complaint.status.slice(1).replace('-', ' ');

            const statusColor = statusClass === 'resolved' ? '#10b981' :
                statusClass === 'in-progress' ? '#8b5cf6' : '#f59e0b';

            // Worker assignment info
            const hasWorker = complaint.worker_id && complaint.worker_first_name;
            const workerName = hasWorker ? `${complaint.worker_first_name} ${complaint.worker_last_name}` : 'Not assigned yet';
            const workerPhone = hasWorker ? complaint.worker_phone : '';
            const assignedDate = hasWorker && complaint.assigned_date ?
                new Date(complaint.assigned_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '';

            complaintsHTML += `
                        <div class="complaint-item" data-status="${complaint.status}" style="padding: 1.25rem; background: #f8fafc; border-radius: 12px; border-left: 4px solid ${statusColor}; transition: all 0.3s; cursor: pointer;" onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='#f8fafc'">
                            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.75rem;">
                                <div class="request-info" style="flex: 1;">
                                    <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
                                        <i class="fas fa-ticket-alt" style="color: ${statusColor};"></i>
                                        <span style="font-weight: 600; font-size: 1.05rem; color: #1e293b;">${complaint.category_name || 'Complaint'}</span>
                                    </div>
                                    <small style="display: block; color: #64748b; margin-bottom: 0.25rem;">
                                        <i class="fas fa-hashtag" style="font-size: 0.7rem;"></i> ID: ${complaint.complaint_id} |
                                        <i class="fas fa-building" style="font-size: 0.7rem;"></i> ${complaint.department_name || 'N/A'}
                                    </small>
                                    <small style="display: block; color: #64748b;">
                                        <i class="fas fa-calendar" style="font-size: 0.7rem;"></i> ${new Date(complaint.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                    </small>
                                </div>
                                <span class="status ${statusClass}" style="white-space: nowrap;">${statusText}</span>
                            </div>
                            <p style="color: #475569; margin: 0.75rem 0; line-height: 1.5; font-size: 0.95rem;">${complaint.description}</p>

                            ${hasWorker ? `
                                <div style="background: linear-gradient(135deg, #e0f2fe, #bae6fd); padding: 0.75rem; border-radius: 8px; margin: 0.75rem 0; border-left: 3px solid #0284c7;">
                                    <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
                                        <i class="fas fa-user-hard-hat" style="color: #0284c7; font-size: 0.9rem;"></i>
                                        <span style="font-weight: 600; color: #0c4a6e; font-size: 0.9rem;">Assigned Worker</span>
                                    </div>
                                    <div style="display: flex; flex-direction: column; gap: 0.25rem; margin-left: 1.5rem;">
                                        <small style="color: #0c4a6e;">
                                            <i class="fas fa-user" style="font-size: 0.7rem;"></i> ${workerName}
                                        </small>
                                        ${workerPhone ? `
                                            <small style="color: #0c4a6e;">
                                                <i class="fas fa-phone" style="font-size: 0.7rem;"></i> ${workerPhone}
                                            </small>
                                        ` : ''}
                                        ${assignedDate ? `
                                            <small style="color: #0c4a6e;">
                                                <i class="fas fa-clock" style="font-size: 0.7rem;"></i> Assigned on ${assignedDate}
                                            </small>
                                        ` : ''}
                                    </div>
                                </div>
                                ${complaint.status === 'resolved' ? `
                                    <div style="display:flex; gap:10px; align-items:center; margin-top:8px;">
                                        ${complaint.citizen_confirmed ? `<span style="color: #10b981; font-weight:600;">Thank you for confirming completion</span>` : `<button class="confirm-btn" onclick="confirmCompletion(${complaint.assignment_id}, ${complaint.complaint_id})">Confirm Work Done</button>`}
                                        ${complaint.rating ? `<div style="margin-left: 10px;"><strong>Rating:</strong> ${'★'.repeat(complaint.rating)}${'☆'.repeat(5 - complaint.rating)} ${complaint.review ? `<div><small>${complaint.review}</small></div>` : ''}</div>` : `<div style="display:flex; align-items:center; gap:8px;">
                                            <div>
                                                <label style="font-weight:600;">Rate Worker</label>
                                                <div style="display:flex; gap:4px; align-items:center;">
                                                    <select id="rating-select-${complaint.complaint_id}">
                                                        <option value="1">1</option>
                                                        <option value="2">2</option>
                                                        <option value="3">3</option>
                                                        <option value="4">4</option>
                                                        <option value="5" selected>5</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div>
                                                <textarea id="rating-review-${complaint.complaint_id}" placeholder="Share your feedback" rows="2" style="width:200px; padding:4px; border-radius:6px; border:1px solid #cbd5e1;"></textarea>
                                            </div>
                                            <button onclick="submitRating(${complaint.assignment_id}, ${complaint.complaint_id})" style="padding:6px 10px; background:#3b82f6; color:white; border:none; border-radius:6px;">Submit Rating</button>
                                        </div>`}
                                    </div>
                                ` : ''}
                            ` : `
                                <div style="background: #fef3c7; padding: 0.75rem; border-radius: 8px; margin: 0.75rem 0; border-left: 3px solid #f59e0b;">
                                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                                        <i class="fas fa-hourglass-half" style="color: #d97706; font-size: 0.9rem;"></i>
                                        <span style="font-weight: 500; color: #92400e; font-size: 0.85rem;">Worker not assigned yet</span>
                                    </div>
                                </div>
                            `}

                            ${complaint.status === 'rejected' && complaint.rejection_reason ? `
                                <div style="background: #fee2e2; padding: 0.75rem; border-radius: 8px; margin: 0.75rem 0; border-left: 3px solid #ef4444;">
                                    <div style="display: flex; align-items: flex-start; gap: 0.5rem;">
                                        <i class="fas fa-times-circle" style="color: #dc2626; font-size: 0.9rem; margin-top: 2px;"></i>
                                        <div style="flex: 1;">
                                            <div style="font-weight: 600; color: #991b1b; font-size: 0.9rem; margin-bottom: 0.25rem;">
                                                <i class="fas fa-ban"></i> Complaint Rejected
                                            </div>
                                            <div style="color: #7f1d1d; font-size: 0.85rem; line-height: 1.4;">
                                                <strong>Reason:</strong> ${complaint.rejection_reason}
                                            </div>
                                            ${complaint.rejected_at ? `
                                                <small style="color: #991b1b; margin-top: 0.25rem; display: block;">
                                                    Rejected on ${new Date(complaint.rejected_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </small>
                                            ` : ''}
                                        </div>
                                    </div>
                                </div>
                            ` : ''}

                            <div style="display: flex; align-items: center; gap: 0.5rem; padding-top: 0.75rem; border-top: 1px solid #e2e8f0;">
                                <i class="fas fa-map-marker-alt" style="color: #64748b; font-size: 0.85rem;"></i>
                                <small style="color: #64748b; font-size: 0.85rem;">
                                    ${complaint.City}, ${complaint.State} - ${complaint.Pincode}
                                </small>
                            </div>
                        </div>
                    `;
        });
    }

    complaintsHTML += '</div>';
    modalContent.innerHTML = complaintsHTML;
    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // Add filter functionality
    window.filterComplaints = function (status) {
        const items = modal.querySelectorAll('.complaint-item');
        const buttons = modal.querySelectorAll('.filter-btn');

        // Update button styles
        buttons.forEach(btn => {
            if (btn.dataset.filter === status) {
                btn.style.background = btn.style.borderColor;
                btn.style.color = 'white';
            } else {
                btn.style.background = 'transparent';
                btn.style.color = btn.style.borderColor;
            }
        });

        // Filter items
        items.forEach(item => {
            if (status === 'all') {
                item.style.display = 'block';
            } else {
                const itemStatus = item.dataset.status;
                const matchStatus = (status === 'pending' && (itemStatus === 'reported' || itemStatus === 'pending')) ||
                    itemStatus === status;
                item.style.display = matchStatus ? 'block' : 'none';
            }
        });
    };

    modal.onclick = (e) => {
        if (e.target === modal) modal.remove();
    };
}

// Dashboard functions
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'notification';

    // Set colors based on type
    let bgColor = 'linear-gradient(135deg, #3b82f6, #60a5fa)';
    if (type === 'success') bgColor = 'linear-gradient(135deg, #10b981, #34d399)';
    if (type === 'error') bgColor = 'linear-gradient(135deg, #ef4444, #f87171)';
    if (type === 'warning') bgColor = 'linear-gradient(135deg, #f59e0b, #fbbf24)';

    notification.style.cssText = `
                position: fixed;
                top: 80px;
                right: 20px;
                background: ${bgColor};
                color: white;
                padding: 15px 25px;
                border-radius: 10px;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                z-index: 10000;
                font-weight: 500;
                max-width: 350px;
                animation: slideIn 0.3s ease;
            `;
    notification.textContent = message;

    document.body.appendChild(notification);

    // Remove after 4 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 4000);
}

function toggleNotifications() {
    const panel = document.getElementById('notificationsPanel');
    if (panel) {
        const isActive = panel.classList.contains('active');

        if (!isActive) {
            // Opening panel - load notifications
            panel.classList.add('active');
            loadNotifications();
        } else {
            // Closing panel
            panel.classList.remove('active');
        }
    }
}

// Load notifications from user complaints
async function loadNotifications() {
    const notificationsList = document.getElementById('notificationsList');
    if (!notificationsList) return;

    // Show loading state
    const loadingText = currentLang === 'hi' ? TRANSLATIONS.hi.loading_notifications : 'Loading notifications...';
    notificationsList.innerHTML = `<p style="text-align: center; padding: 2rem; color: #64748b;"><i class="fas fa-spinner fa-spin"></i> ${loadingText}</p>`;

    try {
        const response = await fetch(`${SERVER_URL}/user/trackComplain`, {
            credentials: 'include'
        });

        const data = await response.json();

        if (response.ok && data.complaints && data.complaints.length > 0) {
            notificationsList.innerHTML = '';

            // Create notifications from complaints
            data.complaints.forEach(complaint => {
                const notificationItem = document.createElement('div');
                notificationItem.className = 'notification-item';

                // Mark as unread if status changed recently (within 24 hours)
                const updatedAt = new Date(complaint.updated_at);
                const now = new Date();
                const hoursDiff = (now - updatedAt) / (1000 * 60 * 60);

                if (hoursDiff < 24) {
                    notificationItem.classList.add('unread');
                }

                // Choose icon based on status
                let icon = 'fa-info-circle';
                if (complaint.status === 'resolved') icon = 'fa-check-circle';
                else if (complaint.status === 'in-progress') icon = 'fa-spinner';
                else if (complaint.status === 'pending') icon = 'fa-clock';

                notificationItem.innerHTML = `
                            <i class="fas ${icon}"></i>
                            <div>
                                <p><strong>${complaint.category_name || 'Complaint'}</strong> - ${complaint.status}</p>
                                <small>${complaint.description ? complaint.description.substring(0, 60) + '...' : 'No description'}</small>
                                <br>
                                <small style="color: #94a3b8;">${new Date(complaint.updated_at).toLocaleString()}</small>
                            </div>
                        `;

                notificationsList.appendChild(notificationItem);
            });

            // Update notification badge count
            updateNotificationBadge(data.complaints.length);
        } else {
            const noNotifText = currentLang === 'hi' ? TRANSLATIONS.hi.no_notifications : 'No notifications yet';
            notificationsList.innerHTML = `<p style="text-align: center; padding: 2rem; color: #64748b;">${noNotifText}</p>`;
            updateNotificationBadge(0);
        }
    } catch (error) {
        console.error('❌ Error loading notifications:', error);
        const errorText = currentLang === 'hi' ? TRANSLATIONS.hi.error_loading_notifications : 'Error loading notifications';
        notificationsList.innerHTML = `<p style="text-align: center; padding: 2rem; color: #ef4444;"><i class="fas fa-exclamation-triangle"></i> ${errorText}</p>`;
    }
}

// Update notification badge count
function updateNotificationBadge(count) {
    const badge = document.querySelector('.notification-badge');
    if (badge) {
        if (count > 0) {
            badge.textContent = count > 99 ? '99+' : count;
            badge.style.display = 'block';
        } else {
            badge.style.display = 'none';
        }
    }
}

function toggleProfileMenu(event) {
    if (event) event.stopPropagation(); // Prevent event from bubbling up

    const menu = document.getElementById('profileMenu');
    if (menu) {
        // Toggle the 'active' class which controls visibility via CSS
        menu.classList.toggle('active');
    }
}

// Close profile menu when clicking outside
document.addEventListener('click', function (event) {
    const menu = document.getElementById('profileMenu');
    const profileMenuButton = document.querySelector('.profile-menu');

    if (menu && profileMenuButton) {
        // Check if click is outside both the menu and the button
        if (!menu.contains(event.target) && !profileMenuButton.contains(event.target)) {
            menu.classList.remove('active');
        }
    }
});

// --- Modal Functions ---

function openReportIssue() {
    const modal = document.getElementById('report-issue-modal');
    const overlay = document.getElementById('modalOverlay');
    if (modal && overlay) {
        overlay.style.display = 'block';
        modal.style.display = 'block';
        setTimeout(() => {
            overlay.style.opacity = '1';
            modal.style.opacity = '1';
            modal.style.transform = 'translate(-50%, -50%)';
        }, 10);
    }
}

function closeReportModal() {
    const modal = document.getElementById('report-issue-modal');
    const overlay = document.getElementById('modalOverlay');
    if (modal && overlay) {
        overlay.style.opacity = '0';
        modal.style.opacity = '0';
        modal.style.transform = 'translate(-50%, -40%)';
        setTimeout(() => {
            overlay.style.display = 'none';
            modal.style.display = 'none';
        }, 300);
    }
}

// ADDED: Functions for the new Settings Modal
function openSettingsModal() {
    const modal = document.getElementById('settings-modal');
    const overlay = document.getElementById('modalOverlay');
    if (modal && overlay) {
        overlay.style.display = 'block';
        modal.style.display = 'block';
        setTimeout(() => {
            overlay.style.opacity = '1';
            modal.style.opacity = '1';
            modal.style.transform = 'translate(-50%, -50%)'; // Use same animation
        }, 10);
    }
}

function closeSettingsModal() {
    const modal = document.getElementById('settings-modal');
    const overlay = document.getElementById('modalOverlay');
    if (modal && overlay) {
        overlay.style.opacity = '0';
        modal.style.opacity = '0';
        modal.style.transform = 'translate(-50%, -40%)'; // Use same animation
        setTimeout(() => {
            overlay.style.display = 'none';
            modal.style.display = 'none';
        }, 300);
    }
}

function openhelp(event) {
    if (event && event.preventDefault) event.preventDefault();
    console.log('openhelp called');
    const modal = document.getElementById('help-modal');
    console.log('Help modal element:', modal);

    if (modal) {
        console.log('Opening help modal...');
        modal.style.display = 'block';
        setTimeout(() => {
            modal.style.opacity = '1';
            modal.style.transform = 'translate(-50%, -50%)';
            console.log('Help modal should be visible now');
        }, 10);
    } else {
        console.error('Help modal not found!');
    }
}

// Confirm completion - called by user when work is resolved to their satisfaction
async function confirmCompletion(assignmentId, complaintId) {
    try {
        const res = await fetch(`${SERVER_URL}/user/confirmCompletion`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ assignment_id: assignmentId, complaint_id: complaintId, confirmed: true })
        });
        const data = await res.json();
        if (res.ok) {
            showNotification('Thank you. Your confirmation has been recorded.', 'success');
            // refresh complaints display
            openTrackComplaint();
        } else {
            showNotification(data.message || 'Failed to record confirmation', 'error');
        }
    } catch (error) {
        console.error('Error confirming completion:', error);
        showNotification('Error confirming completion', 'error');
    }
}

// Submit rating for worker
async function submitRating(assignmentId, complaintId) {
    const ratingEl = document.getElementById(`rating-select-${complaintId}`);
    const reviewEl = document.getElementById(`rating-review-${complaintId}`);
    if (!ratingEl) return showNotification('Rating element not found', 'error');
    const ratingVal = ratingEl.value;
    const reviewVal = reviewEl ? reviewEl.value.trim() : '';

    try {
        const res = await fetch(`${SERVER_URL}/user/rateWorker`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ assignment_id: assignmentId, complaint_id: complaintId, rating: ratingVal, review: reviewVal })
        });
        const data = await res.json();
        if (res.ok) {
            showNotification('Thank you for rating the worker!', 'success');
            // refresh complaints display
            openTrackComplaint();
        } else {
            showNotification(data.message || 'Failed to submit rating', 'error');
        }
    } catch (error) {
        console.error('Error submitting rating:', error);
        showNotification('Error submitting rating', 'error');
    }
}

function closehelp() {
    console.log('closehelp called');
    const modal = document.getElementById('help-modal');

    if (modal) {
        modal.style.opacity = '0';
        modal.style.transform = 'translate(-50%, -40%)';
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    }
}

// Open My Profile Modal
async function openMyProfile(event) {
    if (event && event.preventDefault) event.preventDefault();
    console.log('openMyProfile called');

    const modal = document.getElementById('profile-modal');
    console.log('Profile modal element:', modal);

    if (modal) {
        console.log('Opening profile modal...');
        modal.style.display = 'block';
        setTimeout(() => {
            modal.style.opacity = '1';
            modal.style.transform = 'translate(-50%, -50%)';
            console.log('Profile modal should be visible now');
        }, 10);

        // Load user profile data
        try {
            const response = await fetch(`${SERVER_URL}/complaints/my-complaints`, {
                method: 'GET',
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                const complaints = data.complaints || [];

                // Get user info from first complaint or use defaults
                if (complaints.length > 0) {
                    const userInfo = complaints[0];

                    // Update profile display
                    const firstName = userInfo.First_name || 'User';
                    const lastName = userInfo.Last_name || '';
                    const fullName = `${firstName} ${lastName}`.trim();

                    document.getElementById('profile-avatar-large').textContent = firstName.charAt(0).toUpperCase();
                    document.getElementById('profile-name').textContent = fullName;
                    document.getElementById('profile-email').textContent = userInfo.Email || 'N/A';
                    document.getElementById('profile-firstname').textContent = firstName;
                    document.getElementById('profile-lastname').textContent = lastName;
                    document.getElementById('profile-phone').textContent = userInfo.Phone || 'N/A';
                    document.getElementById('profile-pincode').textContent = userInfo.Pincode || 'N/A';

                    const address = `${userInfo.Address_Line || ''}, ${userInfo.City || ''}, ${userInfo.State || ''} - ${userInfo.Pincode || ''}`.trim();
                    document.getElementById('profile-address').textContent = address || 'No address available';
                }

                // Calculate statistics
                const total = complaints.length;
                const pending = complaints.filter(c => c.status === 'reported' || c.status === 'pending').length;
                const resolved = complaints.filter(c => c.status === 'resolved').length;

                document.getElementById('profile-stat-total').textContent = total;
                document.getElementById('profile-stat-pending').textContent = pending;
                document.getElementById('profile-stat-resolved').textContent = resolved;
            }
        } catch (error) {
            console.error('Error loading profile:', error);
        }
    }
}

function closeMyProfile() {
    const modal = document.getElementById('profile-modal');
    if (modal) {
        modal.style.opacity = '0';
        modal.style.transform = 'translate(-50%, -40%)';
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    }
}

// Open Activity History Modal
async function openActivityreport(event) {
    if (event && event.preventDefault) event.preventDefault();
    console.log('openActivityreport called');

    const modal = document.getElementById('activity-modal');
    console.log('Activity modal element:', modal);

    if (modal) {
        console.log('Opening activity modal...');
        modal.style.display = 'block';
        setTimeout(() => {
            modal.style.opacity = '1';
            modal.style.transform = 'translate(-50%, -50%)';
            console.log('Activity modal should be visible now');
        }, 10);

        // Load activity history
        const activityContent = document.getElementById('activity-content');
        activityContent.innerHTML = '<div style="text-align: center; padding: 40px 20px; color: #64748b;"><i class="fas fa-spinner fa-spin" style="font-size: 2rem; margin-bottom: 10px;"></i><p>Loading activity history...</p></div>';

        try {
            const response = await fetch(`${SERVER_URL}/complaints/my-complaints`, {
                method: 'GET',
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                const complaints = data.complaints || [];

                if (complaints.length === 0) {
                    activityContent.innerHTML = '<div style="text-align: center; padding: 40px 20px; color: #64748b;"><i class="fas fa-inbox" style="font-size: 2rem; margin-bottom: 10px;"></i><p>No activity history found</p></div>';
                    return;
                }

                // Sort by date (newest first)
                complaints.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

                // Build activity timeline
                let html = '<div style="position: relative; padding-left: 30px;">';

                complaints.forEach((complaint, index) => {
                    const date = new Date(complaint.created_at);
                    const formattedDate = date.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    });

                    const statusColor = complaint.status === 'resolved' ? '#10b981' :
                        complaint.status === 'in-progress' ? '#f59e0b' : '#6366f1';
                    const statusIcon = complaint.status === 'resolved' ? 'check-circle' :
                        complaint.status === 'in-progress' ? 'spinner' : 'clock';

                    html += `
                        <div style="position: relative; margin-bottom: 25px; padding-bottom: 25px; border-bottom: 1px solid #e2e8f0;">
                            <div style="position: absolute; left: -30px; width: 12px; height: 12px; border-radius: 50%; background: ${statusColor}; border: 3px solid white; box-shadow: 0 0 0 2px ${statusColor};"></div>
                            ${index < complaints.length - 1 ? '<div style="position: absolute; left: -24px; top: 12px; width: 2px; height: calc(100% + 13px); background: #e2e8f0;"></div>' : ''}

                            <div style="display: flex; align-items: start; gap: 10px;">
                                <i class="fas fa-${statusIcon}" style="color: ${statusColor}; margin-top: 3px;"></i>
                                <div style="flex: 1;">
                                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 5px;">
                                        <strong style="color: #1e3a8a;">${complaint.category_name || 'Issue'}</strong>
                                        <span style="font-size: 0.75rem; color: #64748b;">${formattedDate}</span>
                                    </div>
                                    <p style="color: #475569; font-size: 0.9rem; margin-bottom: 8px;">${complaint.description || 'No description'}</p>
                                    <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                                        <span style="display: inline-block; padding: 4px 10px; background: ${statusColor}20; color: ${statusColor}; border-radius: 12px; font-size: 0.75rem; font-weight: 500;">
                                            ${complaint.status.toUpperCase()}
                                        </span>
                                        <span style="display: inline-block; padding: 4px 10px; background: #f1f5f9; color: #64748b; border-radius: 12px; font-size: 0.75rem;">
                                            #${complaint.complaint_id}
                                        </span>
                                        ${complaint.department_name ? `
                                            <span style="display: inline-block; padding: 4px 10px; background: #f1f5f9; color: #64748b; border-radius: 12px; font-size: 0.75rem;">
                                                ${complaint.department_name}
                                            </span>
                                        ` : ''}
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                });

                html += '</div>';
                activityContent.innerHTML = html;
            } else {
                activityContent.innerHTML = '<div style="text-align: center; padding: 40px 20px; color: #dc2626;"><i class="fas fa-exclamation-circle" style="font-size: 2rem; margin-bottom: 10px;"></i><p>Failed to load activity history</p></div>';
            }
        } catch (error) {
            console.error('Error loading activity history:', error);
            activityContent.innerHTML = '<div style="text-align: center; padding: 40px 20px; color: #dc2626;"><i class="fas fa-exclamation-circle" style="font-size: 2rem; margin-bottom: 10px;"></i><p>Error loading activity history</p></div>';
        }
    }
}

function closeActivityreport() {
    const modal = document.getElementById('activity-modal');
    if (modal) {
        modal.style.opacity = '0';
        modal.style.transform = 'translate(-50%, -40%)';
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    }
}

function submitHelp() {
    const msg = document.getElementById("ticket-message").value.trim();
    const status = document.getElementById("help-status");

    if (!msg) {
        status.style.color = "#dc2626";
        status.textContent = "Please describe your issue.";
        return;
    }

    status.style.color = "#16a34a";
    status.textContent = "Your ticket has been submitted successfully.";
    document.getElementById("ticket-message").value = "";
}

// UPDATED: closeModal now closes all modals
function closeModal() {
    closeReportModal();
    closeSettingsModal();
    try { closehelp(); } catch (e) { }
    try { closeMyProfile(); } catch (e) { }
    try { closeActivityreport(); } catch (e) { }
}

//         async function submitComplaint(event) {
//   event.preventDefault();
//   const form = document.getElementById('report-issue-form');
//   if (!form) return;

//   const formData = new FormData(form);

//   // Debug: log all FormData keys/values (files show as File objects)
//   for (const pair of formData.entries()) {
//     console.log('FormData entry:', pair[0], pair[1]);
//   }

//   try {
//     const res = await fetch(`${SERVER_URL}/user/registerComplain`, { // use SERVER_URL
//       method: 'POST',
//       body: formData,
//       credentials: 'include'
//     });

//     const result = await res.json();
//     if (!res.ok) {
//       const errMsg = result.error || result.message || 'Upload failed';
//       throw new Error(errMsg);
//     }

//     alert('Complaint submitted successfully');
//     form.reset();
//   } catch (err) {
//     console.error('Complaint submit error:', err);
//     alert(err.message || 'Submission failed');
//   }
//         }


async function submitComplaint(event) {
    event.preventDefault();
    const form = document.getElementById('report-issue-form');
    if (!form) return;

    const formData = new FormData();

    // append form controls by name (FormData(form) would work if all names present,
    // but building explicitly helps us control the image file)
    const elements = [
        'category', 'department', 'description',
        'Pincode', 'State', 'City', 'Address_Line',
        // include captured photo coordinates (may be empty)
        'latitude', 'longitude', 'hasFace'
    ];
    elements.forEach(name => {
        const el = form.querySelector(`[name="${name}"]`);
        if (el) formData.append(name, el.value || '');
    });

    // If there's a captured base64 image in hidden input, convert to Blob and append as "image"
    const base64input = document.getElementById('issue-photo');
    if (base64input && base64input.value) {
        const dataURL = base64input.value;
        // validate prefix
        const matches = dataURL.match(/^data:(image\/(png|jpeg|jpg|webp));base64,(.+)$/);
        if (!matches) {
            const msg = currentLang === 'hi' ? TRANSLATIONS.hi.invalid_image : 'Captured image is invalid or unsupported format.';
            alert(msg);
            return;
        }
        const mimeType = matches[1];
        const base64Data = matches[3];
        const byteString = atob(base64Data);
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }
        const blob = new Blob([ab], { type: mimeType });
        // create a File for better compatibility (multer expects file)
        const file = new File([blob], `capture-${Date.now()}.jpg`, { type: mimeType });
        formData.append('image', file); // must match multer upload.single('image')
    }

    try {
        // debug: show keys and types (File objects will show as File)
        for (const pair of formData.entries()) {
            console.log('FormData entry:', pair[0], pair[1]);
        }

        const res = await fetch(`${SERVER_URL}/user/registerComplain`, {
            method: 'POST',
            body: formData,
            credentials: 'include'
        });

        const result = await res.json();
        if (!res.ok) {
            const errMsg = result.error || result.message || 'Upload failed';
            throw new Error(errMsg);
        }

        // Success message with complaint ID
        const successMsg = currentLang === 'hi'
            ? `${TRANSLATIONS.hi.complaint_submitted}! ${TRANSLATIONS.hi.complaint_id}: ${result.complaintId}`
            : `Complaint submitted successfully! Complaint ID: ${result.complaintId}`;

        alert(successMsg);
        console.log('✅ Complaint registered with ID:', result.complaintId);

        // Reset form and close modal
        form.reset();
        closeReportModal();

        // Refresh complaints list to show the new complaint
        loadUserComplaints();

    } catch (err) {
        console.error('Complaint submit error:', err);
        const errorMsg = currentLang === 'hi'
            ? `${TRANSLATIONS.hi.submission_failed}: ${err.message}`
            : `Submission failed: ${err.message}`;
        alert(errorMsg);
    }
}


// --- Other Action/Helper Functions ---

async function openTrackComplaint() {
    try {
        const response = await fetch(`${SERVER_URL}/user/trackComplain`, {
            credentials: 'include'
        });
        const data = await response.json();

        if (response.ok && data.complaints) {
            showAllComplaints(data.complaints);
        } else {
            showNotification('Failed to load complaints', 'error');
        }
    } catch (error) {
        console.error('❌ Error loading complaints:', error);
        showNotification('Error loading complaints', 'error');
    }
}

function openPayBill() {
    alert('Pay bill interface will open here');
}

function openRequestCertificate() {
    alert('Request certificate interface will open here');
}

function openBookAppointment() {
    alert('Book appointment interface will open here');
}

// REMOVED: openService(serviceName) function is gone.

// These are the accessibility functions, they will work fine here
function toggleHighContrast() {
    document.body.classList.toggle('high-contrast');
    // You'll need to define .high-contrast in your CSS file
}

function increaseTextSize() {
    const currentSize = parseFloat(getComputedStyle(document.body).fontSize);
    document.body.style.fontSize = (currentSize + 2) + 'px';
}

function toggleScreenReader() {
    alert('Screen reader mode toggled (simulation)');
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        window.location.href = '../front.html';
    }
}

// Load initial notification count
async function loadInitialNotificationCount() {
    try {
        const response = await fetch(`${SERVER_URL}/user/trackComplain`, {
            credentials: 'include'
        });

        const data = await response.json();

        if (response.ok && data.complaints) {
            updateNotificationBadge(data.complaints.length);
        }
    } catch (error) {
        console.error('❌ Error loading notification count:', error);
    }
}

// Close profile menu and notifications panel when clicking outside
document.addEventListener('click', function (event) {
    const profileMenu = document.querySelector('.profile-menu');
    const profileMenuDropdown = document.getElementById('profileMenu');
    const notificationsBtn = document.querySelector('.notifications');
    const notificationsPanel = document.getElementById('notificationsPanel');

    // Close profile menu if clicking outside
    if (profileMenuDropdown && !profileMenu.contains(event.target) && !profileMenuDropdown.contains(event.target)) {
        profileMenuDropdown.classList.remove('active');
    }

    // Close notifications panel if clicking outside
    if (notificationsPanel &&
        !notificationsBtn.contains(event.target) &&
        !notificationsPanel.contains(event.target) &&
        notificationsPanel.classList.contains('active')) {
        notificationsPanel.classList.remove('active');
    }
});

// Fetch area problems function
async function fetchAreaProblems() {
    const contentDiv = document.getElementById('area-problems-content');
    const fetchBtn = document.querySelector('.fetch-problems-btn');

    if (!contentDiv) return;

    // Show loading state
    const loadingText = currentLang === 'hi' ? 'समस्याएं लोड हो रही हैं...' : 'Loading problems...';
    contentDiv.innerHTML = `<p style="color: #64748b; text-align: center; padding: 1rem;"><i class="fas fa-spinner fa-spin"></i> ${loadingText}</p>`;

    if (fetchBtn) {
        fetchBtn.disabled = true;
        fetchBtn.style.opacity = '0.6';
    }

    try {
        // Fetch area problems from the server (using viewLocalIssues endpoint)
        const response = await fetch(`${SERVER_URL}/user/viewLocalIssues`, {
            credentials: 'include'
        });

        const data = await response.json();

        if (response.ok && data.localIssues && data.localIssues.length > 0) {
            // Display the fetched problems
            contentDiv.innerHTML = '';

            data.localIssues.forEach(problem => {
                const alertItem = document.createElement('div');
                alertItem.className = 'alert-item';

                // Determine urgency based on status
                const urgencyClass = problem.status === 'pending' ? 'urgent' : 'info';
                alertItem.classList.add(urgencyClass);

                alertItem.innerHTML = `
                            <span class="alert-dot"></span>
                            <div>
                                <p>${problem.description ? problem.description.substring(0, 50) + '...' : 'Issue'}</p>
                                <small>${problem.City || 'Unknown location'} - ${new Date(problem.created_at).toLocaleDateString()}</small>
                            </div>
                        `;

                contentDiv.appendChild(alertItem);
            });

            showNotification('Area problems loaded successfully', 'success');
            // Toggle buttons: hide "View More" and show "View Less"
            try {
                const collapseBtn = document.querySelector('.collapse-problems-btn');
                if (collapseBtn) collapseBtn.style.display = 'block';
                if (fetchBtn) fetchBtn.style.display = 'none';
            } catch (err) {
                console.warn('Could not toggle area problems buttons', err);
            }
        } else {
            // No problems found
            const noProblemsText = currentLang === 'hi' ? 'आपके क्षेत्र में कोई समस्या नहीं मिली' : 'No problems found in your area';
            contentDiv.innerHTML = `<p style="color: #64748b; text-align: center; padding: 1rem;">${noProblemsText}</p>`;
            showNotification(noProblemsText, 'info');
            // Ensure buttons state stays sensible
            try {
                const collapseBtn = document.querySelector('.collapse-problems-btn');
                if (collapseBtn) collapseBtn.style.display = 'none';
                if (fetchBtn) fetchBtn.style.display = 'block';
            } catch (err) {
                console.warn('Could not set area problems button state', err);
            }
        }
    } catch (error) {
        console.error('❌ Error fetching area problems:', error);
        const errorText = currentLang === 'hi' ? 'समस्याएं लोड करने में त्रुटि' : 'Error loading problems';
        contentDiv.innerHTML = `<p style="color: #ef4444; text-align: center; padding: 1rem;"><i class="fas fa-exclamation-triangle"></i> ${errorText}</p>`;
        showNotification(errorText, 'error');
    } finally {
        // Re-enable button
        if (fetchBtn) {
            fetchBtn.disabled = false;
            fetchBtn.style.opacity = '1';
        }
    }
}

// Collapse area problems back to the default summary view
function collapseAreaProblems() {
    const contentDiv = document.getElementById('area-problems-content');
    const fetchBtn = document.querySelector('.fetch-problems-btn');
    const collapseBtn = document.querySelector('.collapse-problems-btn');

    if (!contentDiv) return;

    // Restore the default compact items (same markup as initial page)
    contentDiv.innerHTML = `
            <div class="alert-item urgent">
                <span class="alert-dot"></span>
                <div>
                    <p>Water service interruption</p>
                    <small>Main St. - Today 2-6 PM</small>
                </div>
            </div>
            <div class="alert-item info">
                <span class="alert-dot"></span>
                <div>
                    <p>Road construction</p>
                    <small>Oak Ave. - Next week</small>
                </div>
            </div>
    `;

    // Toggle buttons
    try {
        if (fetchBtn) fetchBtn.style.display = 'block';
        if (collapseBtn) collapseBtn.style.display = 'none';
    } catch (err) {
        console.warn('Could not toggle area problems buttons', err);
    }
}

// ==================== VOICE ASSISTANT FUNCTIONS ====================

let isRecording = false;
let isTTSEnabled = true;
let recognition = null;
let conversationContext = [];

// Initialize Speech Recognition
function initSpeechRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = currentLang === 'hi' ? 'hi-IN' : 'en-US';

        recognition.onstart = function () {
            console.log('🎤 Voice recognition started');
            const listeningText = currentLang === 'hi' ? TRANSLATIONS.hi.voice_listening : 'Listening...';
            updateVoiceStatus(listeningText, 'listening');
        };

        recognition.onresult = function (event) {
            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript;
                } else {
                    interimTranscript += transcript;
                }
            }

            // Update live transcript
            const transcriptDiv = document.getElementById('liveTranscript');
            if (transcriptDiv) {
                transcriptDiv.innerHTML = `<p>${finalTranscript || interimTranscript || 'Listening...'}</p>`;
            }

            // If final transcript, send to Gemini
            if (finalTranscript) {
                sendMessageToGemini(finalTranscript);
            }
        };

        recognition.onerror = function (event) {
            console.error('❌ Speech recognition error:', event.error);

            // Handle different error types
            if (event.error === 'network') {
                console.log('🔄 Network error - trying text input fallback');
                // Show text input option
                showTextInputFallback();
            } else if (event.error === 'no-speech') {
                const noSpeechMsg = currentLang === 'hi' ? 'कोई आवाज़ नहीं सुनाई दी' : 'No speech detected';
                updateVoiceStatus(noSpeechMsg, 'error');
            } else if (event.error === 'not-allowed') {
                const permissionMsg = currentLang === 'hi' ? 'माइक्रोफ़ोन की अनुमति नहीं' : 'Microphone permission denied';
                updateVoiceStatus(permissionMsg, 'error');
                alert(currentLang === 'hi' ? 'कृपया माइक्रोफ़ोन की अनुमति दें' : 'Please allow microphone access');
            } else {
                const errorMsg = currentLang === 'hi' ? TRANSLATIONS.hi.voice_error : 'Voice recognition error';
                updateVoiceStatus(errorMsg, 'error');
            }

            isRecording = false;
            updateMicButton();
        };

        recognition.onend = function () {
            console.log('🎤 Voice recognition ended');
            isRecording = false;
            updateMicButton();
            const statusMsg = currentLang === 'hi' ? 'बोलने के लिए क्लिक करें' : 'Click to speak';
            updateVoiceStatus(statusMsg, 'idle');
        };
    } else {
        console.error('❌ Speech recognition not supported');
        const errorMsg = currentLang === 'hi' ? TRANSLATIONS.hi.voice_not_supported : 'Voice recognition not supported';
        updateVoiceStatus(errorMsg, 'error');
    }
}

// Toggle voice recording
function toggleVoiceRecording() {
    if (!recognition) {
        initSpeechRecognition();
    }

    if (!recognition) {
        const alertMsg = currentLang === 'hi' ? TRANSLATIONS.hi.voice_not_supported : 'Your browser does not support voice recognition';
        alert(alertMsg);
        return;
    }

    if (isRecording) {
        recognition.stop();
        isRecording = false;
    } else {
        // Update language before starting
        recognition.lang = currentLang === 'hi' ? 'hi-IN' : 'en-US';
        recognition.start();
        isRecording = true;
    }

    updateMicButton();
}

// Update mic button appearance
function updateMicButton() {
    const micBtn = document.getElementById('micBtn');
    if (micBtn) {
        if (isRecording) {
            micBtn.classList.add('recording');
            micBtn.innerHTML = '<i class="fas fa-stop"></i>';
        } else {
            micBtn.classList.remove('recording');
            micBtn.innerHTML = '<i class="fas fa-microphone"></i>';
        }
    }
}

// Update voice status display
function updateVoiceStatus(message, state = 'idle') {
    const statusEl = document.getElementById('voiceStatus');
    if (statusEl) {
        statusEl.textContent = message;
        statusEl.className = `voice-status-${state}`;
    }
}

// Handle AI agent response - auto-fill forms
function handleAgentResponse(agentResponse) {
    if (!agentResponse) return;

    const { intent, fields, missingFields, followUpQuestion, action, targetPage } = agentResponse;

    console.log(' Handling agent response:', agentResponse);

    if (intent === 'REPORT_COMPLAINT' && fields) {
        // Find the complaint form
        const form = document.getElementById('report-issue-form');
        if (!form) {
            console.log(' Complaint form not found');
            return;
        }

        // Open the modal if closed
        if (typeof openReportIssue === 'function') {
            openReportIssue();
        }

        // Fill form fields
        Object.keys(fields).forEach(key => {
            const element = form.querySelector(`[name="${key}"]`);
            if (element && fields[key]) {
                element.value = fields[key];
                // Trigger change event to update any dependent fields
                element.dispatchEvent(new Event('change', { bubbles: true }));
                console.log(` Filled ${key}: ${fields[key]}`);
            }
        });

        // Show notification if form was filled
        if (Object.keys(fields).length > 0) {
            const fillMsg = currentLang === 'hi'
                ? 'Form fields filled automatically!'
                : 'Form fields filled automatically!';
            showNotification(fillMsg, 'success');
        }

        // Auto-submit if the agent says so
        if (agentResponse.autoSubmit) {
            console.log('🚀 Auto-submitting complaint form...');
            const submitBtn = document.querySelector('#submitComplaint');
            if (submitBtn) {
                // Short delay to allow UI to update
                setTimeout(() => {
                    submitBtn.click();
                    showNotification('Auto-submitting your complaint...', 'info');
                }, 1000);
            } else {
                console.warn('⚠️ Auto-submit button #submitComplaint not found');
            }
        }

        // If missing fields, the follow-up question is already shown in the chat
    } else if (intent === 'TRACK_COMPLAINT') {
        // Open track complaint modal
        if (typeof openTrackComplaint === 'function') {
            openTrackComplaint();
        }
    } else if (intent === 'HISTORY_REPORT') {
        // Generate report
        if (typeof generateReport === 'function') {
            generateReport();
        } else {
            // Fallback: navigate to report endpoint
            window.open(`${SERVER_URL}/api/chat/report?format=json`, '_blank');
        }
    }
}

// Send message to Gemini API
async function sendMessageToGemini(message) {
    const transcriptDiv = document.getElementById('liveTranscript');

    try {
        console.log('🎤 Sending message to Gemini:', message);
        const processingText = currentLang === 'hi' ? TRANSLATIONS.hi.voice_processing : 'Getting response...';
        updateVoiceStatus(processingText, 'processing');

        const youText = currentLang === 'hi' ? TRANSLATIONS.hi.you : 'You';
        const generatingText = currentLang === 'hi' ? TRANSLATIONS.hi.generating_response : 'Generating response...';

        if (transcriptDiv) {
            transcriptDiv.innerHTML = `<p><strong>${youText}:</strong> ${message}</p><p><i class="fas fa-spinner fa-spin"></i> ${generatingText}</p>`;
        }

        // Build context from conversation history
        const context = conversationContext.slice(-3).map(c => `User: ${c.user}\nAssistant: ${c.assistant}`).join('\n\n');

        console.log('📡 Calling API:', `${SERVER_URL}/api/chat/message`);
        const response = await fetch(`${SERVER_URL}/api/chat/message`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                message: message,
                language: currentLang,
                context: context,
                useAgent: true
            })
        });

        console.log('📥 Response status:', response.status);

        // Check if response is ok before parsing JSON
        if (!response.ok) {
            let errorMessage = 'Failed to get response';
            try {
                const errorData = await response.json();
                errorMessage = errorData.error || errorData.errorHi || errorMessage;
            } catch (e) {
                errorMessage = `Server error: ${response.status} ${response.statusText}`;
            }
            throw new Error(errorMessage);
        }

        const data = await response.json();
        console.log('📦 Response data:', data);

        if (data.success) {
            // Handle agent response or regular response
            const aiResponse = data.agentResponse
                ? (data.agentResponse.followUpQuestion || data.agentResponse.message || data.response)
                : data.response;

            if (!aiResponse) {
                throw new Error(data.error || data.errorHi || 'No response received');
            }

            // Update conversation context
            conversationContext.push({
                user: message,
                assistant: aiResponse
            });

            // Keep only last 5 exchanges
            if (conversationContext.length > 5) {
                conversationContext.shift();
            }

            // Display response
            const youText = currentLang === 'hi' ? TRANSLATIONS.hi.you : 'You';
            const assistantText = currentLang === 'hi' ? TRANSLATIONS.hi.assistant : 'Assistant';

            if (transcriptDiv) {
                transcriptDiv.innerHTML = `
                            <p><strong>${youText}:</strong> ${message}</p>
                            <p><strong>${assistantText}:</strong> ${aiResponse}</p>
                        `;
            }

            // Handle agent response - auto-fill form if needed
            if (data.agentResponse) {
                console.log('🎯 Agent Response Detected:', data.agentResponse.intent);
                handleAgentResponse(data.agentResponse);
            }

            // Speak response if TTS enabled
            if (isTTSEnabled) {
                speakText(aiResponse);
            }

            const idleText = currentLang === 'hi' ? TRANSLATIONS.hi.click_to_speak : 'Click to speak';
            updateVoiceStatus(idleText, 'idle');
        } else {
            throw new Error(data.error || data.errorHi || 'Failed to get response');
        }
    } catch (error) {
        console.error('❌ Error sending message to Gemini:', error);

        // Check if it's an authentication error
        if (error.message.includes('User not found') || error.message.includes('Authentication token')) {
            const authErrorMsg = currentLang === 'hi'
                ? 'सत्र समाप्त हो गया। कृपया फिर से लॉगिन करें।'
                : 'Session expired. Please login again.';

            if (transcriptDiv) {
                transcriptDiv.innerHTML = `
                            <p style="color: #fca5a5;">
                                <i class="fas fa-exclamation-triangle"></i> ${authErrorMsg}
                            </p>
                            <button onclick="window.location.href='/user/login'" style="margin-top: 1rem; padding: 0.5rem 1rem; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer;">
                                ${currentLang === 'hi' ? 'लॉगिन पेज पर जाएं' : 'Go to Login'}
                            </button>
                        `;
            }

            updateVoiceStatus(authErrorMsg, 'error');
            showNotification(authErrorMsg, 'error');
        } else {
            const errorMsg = currentLang === 'hi' ? TRANSLATIONS.hi.error_loading_notifications : 'Error getting response';

            if (transcriptDiv) {
                transcriptDiv.innerHTML = `<p style="color: #fca5a5;"><i class="fas fa-exclamation-triangle"></i> ${errorMsg}</p>`;
            }

            updateVoiceStatus(errorMsg, 'error');
            showNotification(errorMsg, 'error');
        }
    }
}

// Text-to-Speech function
function speakText(text) {
    if ('speechSynthesis' in window) {
        // Cancel any ongoing speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = currentLang === 'hi' ? 'hi-IN' : 'en-US';
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        utterance.onstart = function () {
            console.log('🔊 TTS started');
        };

        utterance.onend = function () {
            console.log('🔊 TTS ended');
        };

        utterance.onerror = function (event) {
            console.error('❌ TTS error:', event);
        };

        window.speechSynthesis.speak(utterance);
    } else {
        console.warn('⚠️ Text-to-speech not supported');
    }
}

// Toggle TTS on/off
function toggleTTS() {
    isTTSEnabled = !isTTSEnabled;
    const ttsBtn = document.querySelector('.tts-toggle');

    if (ttsBtn) {
        if (isTTSEnabled) {
            ttsBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
            ttsBtn.classList.remove('disabled');
            const enabledMsg = currentLang === 'hi' ? TRANSLATIONS.hi.voice_enabled : 'Voice enabled';
            showNotification(enabledMsg, 'success');
        } else {
            ttsBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
            ttsBtn.classList.add('disabled');
            window.speechSynthesis.cancel(); // Stop any ongoing speech
            const disabledMsg = currentLang === 'hi' ? TRANSLATIONS.hi.voice_disabled : 'Voice disabled';
            showNotification(disabledMsg, 'info');
        }
    }
}

// Show text input fallback when voice fails
function showTextInputFallback() {
    const transcriptDiv = document.getElementById('liveTranscript');
    if (transcriptDiv) {
        const placeholder = currentLang === 'hi' ? 'अपना संदेश यहाँ टाइप करें...' : 'Type your message here...';
        const sendText = currentLang === 'hi' ? 'भेजें' : 'Send';

        transcriptDiv.innerHTML = `
                    <div style="display: flex; gap: 8px; align-items: center;">
                        <input type="text" id="textInputFallback"
                               placeholder="${placeholder}"
                               style="flex: 1; padding: 8px; border: 1px solid rgba(255,255,255,0.3);
                                      border-radius: 8px; background: rgba(255,255,255,0.1);
                                      color: white; font-size: 0.9rem;"
                               onkeypress="if(event.key==='Enter') sendTextMessage()">
                        <button onclick="sendTextMessage()"
                                style="padding: 8px 16px; background: rgba(255,255,255,0.2);
                                       border: none; border-radius: 8px; color: white;
                                       cursor: pointer; font-weight: 600;">
                            ${sendText}
                        </button>
                    </div>
                `;

        // Focus on input
        setTimeout(() => {
            const input = document.getElementById('textInputFallback');
            if (input) input.focus();
        }, 100);
    }

    const fallbackMsg = currentLang === 'hi' ? 'टेक्स्ट इनपुट का उपयोग करें' : 'Use text input';
    updateVoiceStatus(fallbackMsg, 'idle');
}

// Send text message from fallback input
function sendTextMessage() {
    const input = document.getElementById('textInputFallback');
    if (input && input.value.trim()) {
        const message = input.value.trim();
        sendMessageToGemini(message);
    }
}

// Initialize speech recognition on page load
document.addEventListener('DOMContentLoaded', function () {
    initSpeechRecognition();
});