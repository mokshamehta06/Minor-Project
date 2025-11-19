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
                loading_complaints: 'शिकायतें लोड हो रही हैं...'
            }
        };

        function translatePage(lang) {
            if (!lang || lang === 'en') return; // nothing to do for English baseline
            const t = TRANSLATIONS[lang];
            if (!t) return;

            // Simple selector-based translations
            const selSet = [
                {sel: '.logo span', key: 'logo'},
                {sel: '.quick-actions h3', key: 'quick_actions'},
                {sel: '.action-btn:nth-child(1) span', key: 'report_issue'},
                {sel: '.action-btn:nth-child(2) span', key: 'track_complaint'},
                {sel: '.action-btn:nth-child(3) span', key: 'pay_bill'},
                {sel: '.action-btn:nth-child(4) span', key: 'request_certificate'},
                {sel: '.action-btn:nth-child(5) span', key: 'book_appointment'},
                {sel: '.voice-assistant h4', key: 'voice_assistant'},
                {sel: '#voiceStatus', key: 'click_to_speak'},
                {sel: '.alert-card .card-header h3', key: 'my_area_problems'},
                {sel: '.bills-card .card-header h3', key: 'bills_dues'},
                {sel: '.requests-card .card-header h3', key: 'my_recent_complaints'},
                {sel: 'section.my-complaints-section h2', key: 'all_my_complaints'},
                {sel: '#report-issue-modal h3', key: 'report_issue'},
                {sel: '#report-issue-form label[for="issue-category"]', key: 'select_category'},
                {sel: '#report-issue-form label[for="issue-department"]', key: 'select_department'},
                {sel: '#report-issue-form label[for="issue-description"]', key: 'description'},
                {sel: '#report-issue-modal button[type="submit"]', key: 'submit'}
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
        document.addEventListener('DOMContentLoaded', function() {
            // set language selector
            const langSelect = document.getElementById('languageSelect');
            if (langSelect) {
                langSelect.value = currentLang;
                langSelect.addEventListener('change', (e) => setLanguage(e.target.value));
            }

            loadDepartments();
            loadCategories();
            loadUserComplaints();

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
       console.log(response);
                const data = await response.json();

                if (response.ok) {
                    displayComplaints(data.complaints);
                    displayAllComplaintsInDashboard(data.complaints);
                }
            } catch (error) {
                console.error('❌ Error loading complaints:', error);
            }
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
            modalContent.style.cssText = 'max-width: 800px; max-height: 80vh; overflow-y: auto; padding: 2rem;';

            let complaintsHTML = `
                <span class="close-btn" onclick="this.parentElement.parentElement.remove()">&times;</span>
                <h3 style="margin-bottom: 20px; color: #1e3a8a;">All My Complaints</h3>
                <div style="display: flex; flex-direction: column; gap: 1rem;">
            `;

            complaints.forEach(complaint => {
                const statusClass = complaint.status === 'resolved' ? 'resolved' :
                                    complaint.status === 'in-progress' ? 'in-progress' : 'pending';
                const statusText = complaint.status.charAt(0).toUpperCase() + complaint.status.slice(1).replace('-', ' ');

                complaintsHTML += `
                    <div class="request-item" style="padding: 1rem; background: #f8fafc; border-radius: 8px;">
                        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
                            <div class="request-info">
                                <span style="font-weight: 600;">${complaint.category_name || 'Complaint'}</span>
                                <small style="display: block; color: #64748b;">ID: ${complaint.complaint_id}</small>
                                <small style="display: block;">Submitted: ${new Date(complaint.created_at).toLocaleDateString()}</small>
                            </div>
                            <span class="status ${statusClass}">${statusText}</span>
                        </div>
                        <p style="color: #475569; margin: 0.5rem 0;">${complaint.description}</p>
                        <small style="color: #64748b;">
                            <i class="fas fa-map-marker-alt"></i> ${complaint.City}, ${complaint.State} - ${complaint.Pincode}
                        </small>
                    </div>
                `;
            });

            complaintsHTML += '</div>';
            modalContent.innerHTML = complaintsHTML;
            modal.appendChild(modalContent);
            document.body.appendChild(modal);

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
            // This assumes you have a notifications panel with ID 'notificationsPanel'
            // I'll add a simple alert for now as the panel HTML is missing.
            alert('Notifications panel will open here');
        }

        function toggleProfileMenu() {
            const menu = document.getElementById('profileMenu');
            if (menu) {
                // Using classList.toggle is more robust for animated menus
                menu.classList.toggle('active'); 
                // Assumes your CSS file has .profile-menu-dropdown.active { ... }
                // For this code, I'll revert to your original style logic
                menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
            }
        }

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

        // UPDATED: closeModal now closes all modals
        function closeModal() {
            closeReportModal();
            closeSettingsModal(); // Also close settings modal
        }

        async function submitComplaint(event) {
            console.log("submitComplaint called");
            event.preventDefault();

            const complaintData = {
                category: document.getElementById('issue-category').value,
                department: document.getElementById('issue-department').value,
                description: document.getElementById('issue-description').value,
                imageUrl: document.getElementById('issue-image').value || null,
                Pincode: document.getElementById('issue-pincode').value,
                State: document.getElementById('issue-state').value,
                City: document.getElementById('issue-city').value,
                Address_Line: document.getElementById('issue-address').value || null
            };

            console.log("📤 Sending complaint data:", complaintData);

            try {
                const response = await fetch(`${SERVER_URL}/user/registerComplain`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include',
                    body: JSON.stringify(complaintData)
                });

                const data = await response.json();
                console.log("📥 Server response:", data);
                console.log("Response status:", response.status);

                if (response.ok) {
                    console.log("✅ Complaint submitted successfully!");
                    document.getElementById('report-issue-form').reset();
                    closeReportModal();
                    showNotification('Complaint submitted successfully!', 'success');
                    loadUserComplaints(); // Reload complaints
                } else {
                    console.error("❌ Server error:", data);
                    showNotification(data.error || data.message || 'Error submitting complaint', 'error');
                }
            } catch (error) {
                console.error('❌ Error submitting complaint:', error);
                showNotification('Error submitting complaint. Please try again.', 'error');
            }
        }

        // --- Other Action/Helper Functions ---

        async function openTrackComplaint() {
            try {
                const response = await fetch(`${SERVER_URL}/complaints/my-complaints`, {
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

        // Close profile menu when clicking outside
        document.addEventListener('click', function(event) {
            const profileMenu = document.querySelector('.profile-menu');
            const profileMenuDropdown = document.getElementById('profileMenu');

            // This logic ensures that clicking *on* the profile menu button doesn't
            // immediately close the dropdown.
            if (profileMenuDropdown && !profileMenu.contains(event.target) && !profileMenuDropdown.contains(event.target)) {
                profileMenuDropdown.style.display = 'none';
            }
        });