// Initialize staff dashboard

let fullUserData = {};
let allComplaints = [];

async function loadStaffData() {
    console.log("Loading staff data...");

    try {
        const resp = await fetch('/official/profile/data', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin' // send cookies (auth token)
        });
        if (resp.status === 401) {
            // Not authenticated — redirect to login
            window.location.href = '/official/login';
            return;
        }
        const response = await resp.json();
        console.log('Full response from backend:', response);


        if (response.profile && response.profile.length > 0) {
            fullUserData = response.profile[0];
            allComplaints = response.profile; // Saare complaints

            console.log('Official Data:', fullUserData);
            console.log('All Complaints:', allComplaints);

            // Display official details in sidebar
            $("#staffName").html(fullUserData.First_name + ' ' + fullUserData.Last_name);
            $("#staffDept").html(fullUserData.Name); // Department name

            // Display official info in header
            $(".user-avatar").html(fullUserData.First_name.charAt(0).toUpperCase());
            $(".user-profile span").html(fullUserData.First_name);

            // Update stats and display complaints
            updateStats();
            displayComplaints();
        }
    }
    catch (error) {
        console.error('Error fetching staff profile data:', error);
        alert('Error loading profile data. Please try again.');
    }
}

// Stats update karne ke liye function
function updateStats() {
    const totalComplaints = allComplaints.filter(c => c.complaint_id).length;
    const inProgress = allComplaints.filter(c => c.status === 'in-progress').length;
    const resolved = allComplaints.filter(c => c.status === 'resolved').length;
    const reported = allComplaints.filter(c => c.status === 'reported').length;

    // Update stat cards
    $(".stat-card").eq(0).find(".stat-number").html(totalComplaints);
    $(".stat-card").eq(0).find(".stat-label").html("Total Complaints");

    $(".stat-card").eq(1).find(".stat-number").html(inProgress);
    $(".stat-card").eq(1).find(".stat-label").html("In Progress");

    $(".stat-card").eq(2).find(".stat-number").html(resolved);
    $(".stat-card").eq(2).find(".stat-label").html("Resolved");

    $(".stat-card").eq(3).find(".stat-number").html(reported);
    $(".stat-card").eq(3).find(".stat-label").html("Reported");

    // Update task counter in header
    $(".task-counter").html(`<i class="fas fa-tasks"></i> ${totalComplaints} Total Complaints`);
}

// Complaints display karne ke liye function - DEPARTMENT & CATEGORY VIEW
function displayComplaints() {
    const complaintsContainer = $("#mainContent");
    complaintsContainer.empty();

    // Filter out complaints (complaint_id null nahi hona chahiye)
    const validComplaints = allComplaints.filter(c => c.complaint_id);

    // Update tasks count header
    const pendingCount = validComplaints.filter(c => c.status !== 'resolved').length;
    $("#tasksCount").html(`${pendingCount} complaints pending`);

    if (validComplaints.length === 0) {
        complaintsContainer.html(`
                        <div style="padding: 40px; text-align: center; color: #666;">
                            <i class="fas fa-inbox" style="font-size: 3rem; margin-bottom: 15px; opacity: 0.5;"></i>
                            <p style="font-size: 1.1rem;">No complaints in the system yet.</p>
                        </div>
                    `);
        $("#tasksCount").html('0 complaints');
        return;
    }

    // Group complaints by department first, then by category
    const departmentGroups = {};
    validComplaints.forEach(complaint => {
        const deptName = complaint.department_name || 'Uncategorized Department';
        if (!departmentGroups[deptName]) {
            departmentGroups[deptName] = {};
        }

        const categoryName = complaint.category_name || 'Uncategorized';
        if (!departmentGroups[deptName][categoryName]) {
            departmentGroups[deptName][categoryName] = [];
        }
        departmentGroups[deptName][categoryName].push(complaint);
    });

    // Display each department with its categories
    Object.keys(departmentGroups).sort().forEach(deptName => {
        const deptCategories = departmentGroups[deptName];
        const deptComplaints = Object.values(deptCategories).flat();
        const deptCount = deptComplaints.length;
        const deptReported = deptComplaints.filter(c => c.status === 'reported').length;
        const deptInProgress = deptComplaints.filter(c => c.status === 'in-progress').length;
        const deptResolved = deptComplaints.filter(c => c.status === 'resolved').length;

        // Department header with stats
        const departmentHeader = `
                        <div class="department-header" style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
                             padding: 1.25rem 1.75rem; border-radius: 15px; margin: 2rem 0 1rem 0;
                             color: white; box-shadow: 0 6px 12px rgba(0,0,0,0.15);">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                                <div>
                                    <h2 style="margin: 0; font-size: 1.5rem; display: flex; align-items: center; gap: 0.75rem;">
                                        <i class="fas fa-building"></i>
                                        ${deptName}
                                    </h2>
                                    <p style="margin: 0.5rem 0 0 0; font-size: 1rem; opacity: 0.9;">
                                        ${deptCount} total complaint${deptCount !== 1 ? 's' : ''} • ${Object.keys(deptCategories).length} categor${Object.keys(deptCategories).length !== 1 ? 'ies' : 'y'}
                                    </p>
                                </div>
                                <div style="display: flex; gap: 1rem; font-size: 0.9rem;">
                                    <span style="background: rgba(255,255,255,0.25); padding: 0.5rem 1rem; border-radius: 8px; font-weight: 600;">
                                        <i class="fas fa-exclamation-circle"></i> ${deptReported} Reported
                                    </span>
                                    <span style="background: rgba(255,255,255,0.25); padding: 0.5rem 1rem; border-radius: 8px; font-weight: 600;">
                                        <i class="fas fa-spinner"></i> ${deptInProgress} In Progress
                                    </span>
                                    <span style="background: rgba(255,255,255,0.25); padding: 0.5rem 1rem; border-radius: 8px; font-weight: 600;">
                                        <i class="fas fa-check-circle"></i> ${deptResolved} Resolved
                                    </span>
                                </div>
                            </div>
                        </div>
                    `;
        complaintsContainer.append(departmentHeader);

        // Display each category within this department
        Object.keys(deptCategories).sort().forEach(categoryName => {
            const categoryComplaints = deptCategories[categoryName];
            const categoryCount = categoryComplaints.length;
            const reportedCount = categoryComplaints.filter(c => c.status === 'reported').length;
            const inProgressCount = categoryComplaints.filter(c => c.status === 'in-progress').length;
            const resolvedCount = categoryComplaints.filter(c => c.status === 'resolved').length;

            // Category header with stats
            const categoryHeader = `
                            <div class="category-header" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                                 padding: 1rem 1.5rem; border-radius: 12px; margin: 1rem 0 0.75rem 1.5rem;
                                 color: white; display: flex; justify-content: space-between; align-items: center;
                                 box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                                <div>
                                    <h3 style="margin: 0; font-size: 1.2rem; display: flex; align-items: center; gap: 0.5rem;">
                                        <i class="fas fa-folder-open"></i>
                                        ${categoryName}
                                    </h3>
                                    <p style="margin: 0.25rem 0 0 0; font-size: 0.85rem; opacity: 0.9;">
                                        ${categoryCount} complaint${categoryCount !== 1 ? 's' : ''}
                                    </p>
                                </div>
                                <div style="display: flex; gap: 0.75rem; font-size: 0.8rem;">
                                    <span style="background: rgba(255,255,255,0.2); padding: 0.35rem 0.7rem; border-radius: 6px;">
                                        <i class="fas fa-exclamation-circle"></i> ${reportedCount}
                                    </span>
                                    <span style="background: rgba(255,255,255,0.2); padding: 0.35rem 0.7rem; border-radius: 6px;">
                                        <i class="fas fa-spinner"></i> ${inProgressCount}
                                    </span>
                                    <span style="background: rgba(255,255,255,0.2); padding: 0.35rem 0.7rem; border-radius: 6px;">
                                        <i class="fas fa-check-circle"></i> ${resolvedCount}
                                    </span>
                                </div>
                            </div>
                        `;
            complaintsContainer.append(categoryHeader);

            // Display complaints in this category
            categoryComplaints.forEach(complaint => {
                const priorityClass = complaint.status === 'reported' ? 'high' :
                    complaint.status === 'in-progress' ? 'medium' : 'low';

                const statusBadge = complaint.status === 'reported' ? '🔴 Reported' :
                    complaint.status === 'in-progress' ? '🟡 In Progress' : '🟢 Resolved';

                const complaintHTML = `
                                <div class="task-item" style="margin-left: 3rem; margin-bottom: 0.75rem;">
                                    <div class="task-priority ${priorityClass}"></div>
                                    <div class="task-content">
                                        <div class="task-title">Complaint #${complaint.complaint_id} - ${statusBadge}</div>
                                        <div class="task-description">${complaint.description || 'No description provided'}</div>
                                        <div class="task-meta">
                                            <span><i class="fas fa-calendar"></i> ${new Date(complaint.created_at).toLocaleDateString()}</span>
                                            <span><i class="fas fa-map-marker-alt"></i> ${complaint.City}, ${complaint.State}</span>
                                            ${complaint.detected_city ? `<span><i class="fas fa-location-arrow" style="color: #6366f1;"></i> ${complaint.detected_city}, ${complaint.detected_state}</span>` : ''}
                                            <span><i class="fas fa-home"></i> ${complaint.Address_Line || 'N/A'}</span>
                                            <span><i class="fas fa-map-pin"></i> ${complaint.Pincode || 'N/A'}</span>
                                        </div>
                                    </div>
                                    <div class="task-actions">
                                        ${complaint.status === 'reported' ?
                        `<button class="task-btn start" onclick="startTask(${complaint.complaint_id})">
                                                <i class="fas fa-play"></i> Start Work
                                            </button>
                                            <button class="task-btn reject" onclick="openRejectModal(${complaint.complaint_id})" style="background:#ef4444;color:white;margin-left:6px;">
                                                <i class="fas fa-ban"></i> Reject
                                            </button>` : ''}
                                        ${complaint.status === 'in-progress' ?
                        `<button class="task-btn complete" onclick="completeTask(${complaint.complaint_id})">
                                                <i class="fas fa-check"></i> Mark Resolved
                                            </button>` : ''}
                                        <button class="task-btn view" onclick="viewTask(${complaint.complaint_id})">
                                            <i class="fas fa-eye"></i> View Details
                                        </button>
                                    </div>
                                </div>
                            `;

                complaintsContainer.append(complaintHTML);
            });
        });
    });
}

// Open a modal to enter rejection reason and submit rejection
window.openRejectModal = function (complaintId) {
    // Remove existing modal if present
    const existing = document.getElementById('reject-modal-overlay');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'reject-modal-overlay';
    modal.className = 'modal-overlay';
    modal.style.cssText = 'position: fixed; top:0; left:0; right:0; bottom:0; display:flex; align-items:center; justify-content:center; background: rgba(0,0,0,0.5); z-index:12000;';

    modal.innerHTML = `
        <div style="background:white; border-radius:12px; width: 480px; max-width: 90%; padding: 1rem; box-shadow: 0 10px 30px rgba(0,0,0,0.15);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
                <h3 style="margin:0; font-size:1.1rem; color:#1e3a8a;"><i class="fas fa-ban"></i> Reject Complaint #${complaintId}</h3>
                <button onclick="document.getElementById('reject-modal-overlay').remove()" style="background:transparent;border:none;font-size:1.1rem;cursor:pointer;">&times;</button>
            </div>
            <p style="color:#64748b; margin-top:0;">Please provide a brief reason for rejecting this complaint. This reason will be recorded and visible to supervisors.</p>
            <textarea id="reject-reason-text" placeholder="Enter rejection reason (required)" style="width:100%; height:120px; padding:0.5rem; margin-top:0.5rem; border:1px solid #e2e8f0; border-radius:6px;"></textarea>
            <div style="display:flex; gap:0.5rem; justify-content:flex-end; margin-top:0.75rem;">
                <button onclick="document.getElementById('reject-modal-overlay').remove()" style="padding:0.5rem 0.9rem; border: none; background:#94a3b8; color:white; border-radius:6px; cursor:pointer;">Cancel</button>
                <button onclick="submitReject(${complaintId})" style="padding:0.5rem 0.9rem; border:none; background:#ef4444; color:white; border-radius:6px; cursor:pointer;">Reject Complaint</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    document.getElementById('reject-reason-text').focus();
}

window.submitReject = async function (complaintId) {
    const reasonEl = document.getElementById('reject-reason-text');
    if (!reasonEl) return alert('Reason input not found');
    const reason = reasonEl.value.trim();
    if (!reason) return alert('Please provide a reason for rejection');

    try {
        const res = await fetch('/official/rejectComplaint', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({ complaint_id: complaintId, reason })
        });
        const data = await res.json();
        if (res.ok) {
            alert(data.message || 'Complaint rejected');
            // Close modal and refresh data
            const modal = document.getElementById('reject-modal-overlay');
            if (modal) modal.remove();
            await loadStaffData();
        } else {
            alert(data.message || 'Failed to reject complaint');
        }
    } catch (err) {
        console.error('Error rejecting complaint:', err);
        alert('Error rejecting complaint');
    }
}

window.onload = function () {
    loadStaffData();
    setupEventListeners();
};


function setupEventListeners() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            setActiveNavItem(item);
        });
    });
}

function setActiveNavItem(activeItem) {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    activeItem.classList.add('active');
}

let currentComplaintId = null;

// Make functions globally accessible
window.startTask = async function (taskId) {
    console.log('startTask called with taskId:', taskId);
    currentComplaintId = taskId;
    await openWorkerModal(taskId);
}

window.openWorkerModal = async function (complaintId) {
    console.log('openWorkerModal called with complaintId:', complaintId);
    const modal = document.getElementById('workerModal');
    console.log('Modal element:', modal);

    if (!modal) {
        console.error('Worker modal element not found');
        alert('Error: Modal element not found');
        return;
    }
    modal.style.display = 'flex';

    // Fetch workers
    try {
        const res = await fetch(`/official/getWorkers?complaint_id=${complaintId}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin'
        });
        const data = await res.json();
        console.log('Workers data:', data);
        displayWorkers(data.workers, complaintId);
    } catch (error) {
        console.error('Error fetching workers:', error);
        alert('Failed to load workers');
    }
}

window.closeWorkerModal = function () {
    console.log('closeWorkerModal called');
    const modal = document.getElementById('workerModal');
    if (!modal) {
        console.error('Worker modal element not found');
        return;
    }
    modal.style.display = 'none';
    currentComplaintId = null;

    // Hide add worker form if open
    const form = document.getElementById('addWorkerForm');
    if (form && form.style.display !== 'none') {
        toggleAddWorkerForm();
    }
}

function displayWorkers(workers, complaintId) {
    const tbody = document.getElementById('workersTableBody');
    tbody.innerHTML = '';

    if (workers.length === 0) {
        tbody.innerHTML = `
                    <tr>
                        <td colspan="4" style="text-align: center; padding: 2rem; color: #666;">
                            <i class="fas fa-users-slash" style="font-size: 2rem; margin-bottom: 0.5rem; display: block;"></i>
                            No workers found. Add workers to get started.
                        </td>
                    </tr>
                `;
        return;
    }

    workers.forEach(worker => {
        const isAssignedToThis = worker.assignment_status === 'assigned';
        const isBusy = worker.assignment_status === 'busy';
        let statusText = 'No';
        if (isAssignedToThis) statusText = `Assigned`;
        else if (isBusy) statusText = `Busy (Complaint #${worker.other_complaint_id || 'N/A'})`;

        const row = document.createElement('tr');
        row.innerHTML = `
                    <td>${worker.First_name} ${worker.Last_name}</td>
                    <td>${worker.Phone}</td>
                    <td>${statusText}</td>
                    <td>
                        <button
                            class="assign-btn"
                            onclick="assignWorkerToComplaint(${worker.worker_id}, ${complaintId})"
                            ${isAssignedToThis || isBusy ? 'disabled' : ''}
                        >
                            ${isAssignedToThis ? 'Already Assigned' : (isBusy ? 'Busy' : 'Assign to Task')}
                        </button>
                    </td>
                `;
        tbody.appendChild(row);
    });
}
window.toggleAddWorkerForm = function () {
    const form = document.getElementById('addWorkerForm');
    if (form.style.display === 'none') {
        form.style.display = 'block';
    } else {
        form.style.display = 'none';
        // Clear form
        document.getElementById('workerFirstName').value = '';
        document.getElementById('workerLastName').value = '';
        document.getElementById('workerPhone').value = '';
    }
}

window.submitNewWorker = async function () {
    const firstName = document.getElementById('workerFirstName').value.trim();
    const lastName = document.getElementById('workerLastName').value.trim();
    const phone = document.getElementById('workerPhone').value.trim();

    if (!firstName || !lastName || !phone) {
        alert('Please fill in all required fields (marked with *)');
        return;
    }

    try {
        const res = await fetch('/official/addWorker', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({
                First_name: firstName,
                Last_name: lastName,
                Phone: phone
            })
        });

        const data = await res.json();

        if (res.ok) {
            alert('Worker added successfully!');
            window.toggleAddWorkerForm();
            // Reload workers
            await window.openWorkerModal(currentComplaintId);
        } else {
            alert(data.message || 'Failed to add worker');
        }
    } catch (error) {
        console.error('Error adding worker:', error);
        alert('Failed to add worker');
    }
}

window.assignWorkerToComplaint = async function (workerId, complaintId) {
    if (!confirm('Are you sure you want to assign this worker to the task?')) {
        return;
    }

    try {
        const res = await fetch('/official/assignWorker', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({
                worker_id: workerId,
                complaint_id: complaintId
            })
        });

        const data = await res.json();

        if (res.ok) {
            alert('Worker assigned successfully! Complaint status updated to in-progress.');
            window.closeWorkerModal();
            // Reload complaints to show updated status
            await loadStaffData();
        } else {
            alert(data.message || 'Failed to assign worker');
        }
    } catch (error) {
        console.error('Error assigning worker:', error);
        alert('Failed to assign worker');
    }
}


async function completeTask(taskId) {
    if (!confirm('Are you sure you want to mark this task as resolved?')) return;

    try {
        const res = await fetch('/official/completeTask', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({ complaint_id: taskId })
        });

        const data = await res.json();

        if (res.ok) {
            alert(data.message || 'Task marked as resolved.');
            await loadStaffData();
        } else {
            alert(data.message || 'Failed to complete task.');
        }
    } catch (error) {
        console.error('Error marking task completed:', error);
        alert('Failed to complete task.');
    }
}

function viewTask(taskId) {
    const complaint = allComplaints.find(c => c.complaint_id === taskId);
    if (!complaint) {
        alert('Complaint not found');
        return;
    }

    // Create modal
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 10000;';

    const statusColor = complaint.status === 'resolved' ? '#10b981' :
        complaint.status === 'in-progress' ? '#f59e0b' : '#ef4444';

    const statusIcon = complaint.status === 'resolved' ? 'fa-check-circle' :
        complaint.status === 'in-progress' ? 'fa-spinner' : 'fa-exclamation-circle';

    modal.innerHTML = `
                <div style="background: white; border-radius: 16px; max-width: 700px; width: 90%; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 1.5rem; border-radius: 16px 16px 0 0; color: white;">
                        <div style="display: flex; justify-content: space-between; align-items: start;">
                            <div>
                                <h2 style="margin: 0; font-size: 1.5rem; display: flex; align-items: center; gap: 0.5rem;">
                                    <i class="fas fa-ticket-alt"></i>
                                    Complaint #${complaint.complaint_id}
                                </h2>
                                <p style="margin: 0.5rem 0 0 0; opacity: 0.9; font-size: 0.95rem;">
                                    ${complaint.category_name || 'Uncategorized'} - ${complaint.department_name || 'N/A'}
                                </p>
                            </div>
                            <button onclick="this.closest('.modal-overlay').remove()" style="background: rgba(255,255,255,0.2); border: none; color: white; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; font-size: 1.2rem; display: flex; align-items: center; justify-content: center;">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    </div>

                    <!-- Content -->
                    <div style="padding: 1.5rem;">
                        <!-- Status Badge -->
                        <div style="margin-bottom: 1.5rem;">
                            <span style="display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; background: ${statusColor}; color: white; border-radius: 8px; font-weight: 600;">
                                <i class="fas ${statusIcon}"></i>
                                ${complaint.status.toUpperCase()}
                            </span>
                        </div>

                        <!-- Description -->
                        <div style="margin-bottom: 1.5rem;">
                            <h3 style="margin: 0 0 0.5rem 0; color: #1e3a8a; font-size: 1.1rem;">
                                <i class="fas fa-align-left"></i> Description
                            </h3>
                            <p style="margin: 0; padding: 1rem; background: #f8fafc; border-radius: 8px; color: #334155; line-height: 1.6;">
                                ${complaint.description || 'No description provided'}
                            </p>
                        </div>

                        <!-- Location Details -->
                        <div style="margin-bottom: 1.5rem;">
                            <h3 style="margin: 0 0 0.75rem 0; color: #1e3a8a; font-size: 1.1rem;">
                                <i class="fas fa-map-marker-alt"></i> Location Details
                            </h3>
                            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem;">
                                <div style="padding: 0.75rem; background: #f8fafc; border-radius: 8px;">
                                    <small style="color: #64748b; display: block; margin-bottom: 0.25rem;">City</small>
                                    <strong style="color: #1e3a8a;">${complaint.City || 'N/A'}</strong>
                                </div>
                                <div style="padding: 0.75rem; background: #f8fafc; border-radius: 8px;">
                                    <small style="color: #64748b; display: block; margin-bottom: 0.25rem;">State</small>
                                    <strong style="color: #1e3a8a;">${complaint.State || 'N/A'}</strong>
                                </div>
                                <div style="padding: 0.75rem; background: #f8fafc; border-radius: 8px;">
                                    <small style="color: #64748b; display: block; margin-bottom: 0.25rem;">Pincode</small>
                                    <strong style="color: #1e3a8a;">${complaint.Pincode || 'N/A'}</strong>
                                </div>
                                <div style="padding: 0.75rem; background: #f8fafc; border-radius: 8px;">
                                    <small style="color: #64748b; display: block; margin-bottom: 0.25rem;">Address</small>
                                    <strong style="color: #1e3a8a;">${complaint.Address_Line || 'N/A'}</strong>
                                </div>
                                ${complaint.detected_city ? `
                                <div style="padding: 0.75rem; background: #eef2ff; border-radius: 8px; grid-column: 1 / -1; border-left: 3px solid #6366f1;">
                                    <small style="color: #4338ca; display: block; margin-bottom: 0.25rem;">
                                        <i class="fas fa-location-arrow" style="font-size: 0.8rem;"></i> Detected Location
                                    </small>
                                    <strong style="color: #3730a3;">${complaint.detected_city}, ${complaint.detected_state}</strong>
                                    <div style="font-size: 0.8rem; color: #6366f1; margin-top: 2px;">${complaint.detected_address}</div>
                                </div>
                                ` : ''}
                            </div>
                        </div>

                        <!-- User Details -->
                        ${complaint.user_first_name ? `
                            <div style="margin-bottom: 1.5rem;">
                                <h3 style="margin: 0 0 0.75rem 0; color: #1e3a8a; font-size: 1.1rem;">
                                    <i class="fas fa-user"></i> Reported By
                                </h3>
                                <div style="padding: 1rem; background: #f8fafc; border-radius: 8px;">
                                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem;">
                                        <div>
                                            <small style="color: #64748b;">Name:</small>
                                            <strong style="color: #1e3a8a; margin-left: 0.5rem;">${complaint.user_first_name} ${complaint.user_last_name}</strong>
                                        </div>
                                        <div>
                                            <small style="color: #64748b;">Phone:</small>
                                            <strong style="color: #1e3a8a; margin-left: 0.5rem;">${complaint.user_phone || 'N/A'}</strong>
                                        </div>
                                        <div style="grid-column: 1 / -1;">
                                            <small style="color: #64748b;">Email:</small>
                                            <strong style="color: #1e3a8a; margin-left: 0.5rem;">${complaint.user_email || 'N/A'}</strong>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ` : ''}

                        <!-- Worker Assignment -->
                        ${complaint.worker_first_name ? `
                            <div style="margin-bottom: 1.5rem;">
                                <h3 style="margin: 0 0 0.75rem 0; color: #1e3a8a; font-size: 1.1rem;">
                                    <i class="fas fa-user-hard-hat"></i> Assigned Worker
                                </h3>
                                <div style="padding: 1rem; background: #f0fdf4; border-radius: 8px; border-left: 4px solid #10b981;">
                                    <div style="display: flex; justify-content: space-between; align-items: center;">
                                        <div>
                                            <strong style="color: #1e3a8a; font-size: 1.05rem;">${complaint.worker_first_name} ${complaint.worker_last_name}</strong>
                                            ${complaint.assigned_date ? `
                                                <p style="margin: 0.25rem 0 0 0; color: #64748b; font-size: 0.9rem;">
                                                    Assigned on: ${new Date(complaint.assigned_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                                </p>
                                            ` : ''}
                                        </div>
                                        <i class="fas fa-check-circle" style="color: #10b981; font-size: 1.5rem;"></i>
                                    </div>
                                </div>
                            </div>
                        ` : ''}

                        <!-- Image -->
                        ${complaint.imageUrl ? `
                            <div style="margin-bottom: 1.5rem;">
                                <h3 style="margin: 0 0 0.75rem 0; color: #1e3a8a; font-size: 1.1rem;">
                                    <i class="fas fa-image"></i> Attached Image
                                </h3>
                                <img src="${complaint.imageUrl}" alt="Complaint Image"
                                     style="width: 100%; max-height: 400px; object-fit: contain; border-radius: 8px; border: 2px solid #e2e8f0;"
                                     onclick="window.open('${complaint.imageUrl}', '_blank')">
                                <p style="margin: 0.5rem 0 0 0; text-align: center; color: #64748b; font-size: 0.85rem;">
                                    <i class="fas fa-expand"></i> Click to view full size
                                </p>
                            </div>
                        ` : ''}

                        <!-- Timestamps -->
                        <div style="margin-bottom: 1.5rem;">
                            <h3 style="margin: 0 0 0.75rem 0; color: #1e3a8a; font-size: 1.1rem;">
                                <i class="fas fa-clock"></i> Timeline
                            </h3>
                            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem;">
                                <div style="padding: 0.75rem; background: #f8fafc; border-radius: 8px;">
                                    <small style="color: #64748b; display: block; margin-bottom: 0.25rem;">Created</small>
                                    <strong style="color: #1e3a8a;">${new Date(complaint.created_at).toLocaleString()}</strong>
                                </div>
                                <div style="padding: 0.75rem; background: #f8fafc; border-radius: 8px;">
                                    <small style="color: #64748b; display: block; margin-bottom: 0.25rem;">Last Updated</small>
                                    <strong style="color: #1e3a8a;">${new Date(complaint.updated_at).toLocaleString()}</strong>
                                </div>
                            </div>
                        </div>

                        <!-- Action Buttons -->
                        <div style="display: flex; gap: 0.75rem; padding-top: 1rem; border-top: 2px solid #e2e8f0;">
                            ${complaint.status === 'reported' ? `
                                <button onclick="this.closest('.modal-overlay').remove(); startTask(${complaint.complaint_id});"
                                        style="flex: 1; padding: 0.75rem 1.5rem; background: #3b82f6; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
                                    <i class="fas fa-play"></i> Start Work
                                </button>
                            ` : ''}
                            ${complaint.status === 'in-progress' ? `
                                <button onclick="this.closest('.modal-overlay').remove(); completeTask(${complaint.complaint_id});"
                                        style="flex: 1; padding: 0.75rem 1.5rem; background: #10b981; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
                                    <i class="fas fa-check"></i> Mark Resolved
                                </button>
                            ` : ''}
                            <button onclick="this.closest('.modal-overlay').remove()"
                                    style="flex: 1; padding: 0.75rem 1.5rem; background: #64748b; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
                                <i class="fas fa-times"></i> Close
                            </button>
                        </div>
                    </div>
                </div>
            `;

    document.body.appendChild(modal);
}

// Voice Recognition Variables
let recognition = null;
let isRecording = false;
let voiceTranscript = '';

// Initialize Speech Recognition
function initSpeechRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = function () {
            console.log('🎤 Voice recognition started');
            isRecording = true;
        };

        recognition.onresult = function (event) {
            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript + ' ';
                } else {
                    interimTranscript += transcript;
                }
            }

            voiceTranscript = finalTranscript || interimTranscript;
            console.log('Transcript:', voiceTranscript);
        };

        recognition.onerror = function (event) {
            console.error('Speech recognition error:', event.error);
            isRecording = false;
        };

        recognition.onend = function () {
            console.log('🎤 Voice recognition ended');
            isRecording = false;
        };
    } else {
        console.warn('Speech recognition not supported');
    }
}

function reportIssue() {
    const issue = prompt('Describe the issue or obstacle you are facing:');
    if (issue && issue.trim()) {
        alert(`Issue reported: "${issue}"\n\nYour supervisor will be notified.`);
        console.log('Issue reported:', issue);
        // TODO: Send to backend
    }
}

function requestSupport() {
    const support = prompt('What kind of support do you need from your supervisor?');
    if (support && support.trim()) {
        alert(`Support request: "${support}"\n\nYour supervisor will be contacted.`);
        console.log('Support requested:', support);
        // TODO: Send to backend
    }
}

function updateLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            function (position) {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                alert(`Location updated!\n\nLatitude: ${lat}\nLongitude: ${lon}\n\nYour current work location has been recorded.`);
                console.log('Location:', lat, lon);
                // TODO: Send to backend
            },
            function (error) {
                alert('Unable to get location. Please enable location services.');
                console.error('Geolocation error:', error);
            }
        );
    } else {
        alert('Geolocation is not supported by your browser.');
    }
}

function voiceUpdate() {
    if (!recognition) {
        initSpeechRecognition();
    }

    if (!recognition) {
        alert('Voice recording is not supported in your browser.');
        return;
    }

    if (isRecording) {
        // Stop recording
        recognition.stop();
        isRecording = false;

        if (voiceTranscript.trim()) {
            alert(`Voice Update Recorded:\n\n"${voiceTranscript}"\n\nYour progress update has been saved.`);
            console.log('Voice update:', voiceTranscript);
            // TODO: Send to backend
            voiceTranscript = '';
        } else {
            alert('No speech detected. Please try again.');
        }
    } else {
        // Start recording
        voiceTranscript = '';
        recognition.start();
        alert('🎤 Recording started...\n\nSpeak your progress update now.\nClick "Voice Update" again to stop recording.');
    }
}

// Work History Modal Functions
window.showWorkHistory = async function (event) {
    if (event) event.preventDefault();
    const modal = document.getElementById('work-history-modal');
    if (modal) {
        modal.style.display = 'flex';
        await loadWorkHistory();
    }
}

window.closeWorkHistoryModal = function () {
    const modal = document.getElementById('work-history-modal');
    if (modal) modal.style.display = 'none';
}

async function loadWorkHistory() {
    const content = document.getElementById('work-history-content');
    if (!content) return;

    try {
        // Fetch all assignments for this official's department
        const response = await fetch('/official/profile/data', {
            credentials: 'same-origin'
        });
        const data = await response.json();

        if (response.ok && data.profile) {
            const complaints = data.profile;
            const assignedComplaints = complaints.filter(c => c.worker_id);

            if (assignedComplaints.length === 0) {
                content.innerHTML = `
                            <div style="text-align: center; padding: 2rem; color: #64748b;">
                                <i class="fas fa-inbox" style="font-size: 2rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                                <p>No worker assignments yet.</p>
                            </div>
                        `;
                return;
            }

            let historyHTML = '<div style="display: flex; flex-direction: column; gap: 1rem;">';

            assignedComplaints.forEach(complaint => {
                const workerName = `${complaint.worker_first_name || ''} ${complaint.worker_last_name || ''}`.trim();
                const assignedDate = complaint.assigned_date ?
                    new Date(complaint.assigned_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A';
                const statusColor = complaint.status === 'resolved' ? '#10b981' :
                    complaint.status === 'in-progress' ? '#8b5cf6' : '#f59e0b';

                historyHTML += `
                            <div style="background: #f8fafc; padding: 1rem; border-radius: 12px; border-left: 4px solid ${statusColor};">
                                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
                                    <div>
                                        <strong style="color: #1e3a8a; font-size: 1.05rem;">
                                            <i class="fas fa-ticket-alt"></i> Complaint #${complaint.complaint_id}
                                        </strong>
                                        <p style="color: #64748b; margin: 0.25rem 0; font-size: 0.9rem;">
                                            ${complaint.category_name || 'N/A'} - ${complaint.department_name || 'N/A'}
                                        </p>
                                    </div>
                                    <span style="padding: 0.25rem 0.75rem; background: ${statusColor}; color: white; border-radius: 6px; font-size: 0.85rem; font-weight: 500;">
                                        ${complaint.status}
                                    </span>
                                </div>
                                <div style="background: white; padding: 0.75rem; border-radius: 8px; margin-top: 0.5rem;">
                                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.5rem;">
                                        <div>
                                            <small style="color: #64748b; display: block;">Worker Assigned:</small>
                                            <strong style="color: #1e3a8a;">${workerName || 'N/A'}</strong>
                                        </div>
                                        <div>
                                            <small style="color: #64748b; display: block;">Assigned Date:</small>
                                            <strong style="color: #1e3a8a;">${assignedDate}</strong>
                                        </div>
                                        <div>
                                            <small style="color: #64748b; display: block;">Location:</small>
                                            <strong style="color: #1e3a8a;">${complaint.City || 'N/A'}</strong>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `;
            });

            historyHTML += '</div>';
            content.innerHTML = historyHTML;
        } else {
            content.innerHTML = `
                        <div style="text-align: center; padding: 2rem; color: #ef4444;">
                            <i class="fas fa-exclamation-circle" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                            <p>Failed to load work history.</p>
                        </div>
                    `;
        }
    } catch (error) {
        console.error('Error loading work history:', error);
        content.innerHTML = `
                    <div style="text-align: center; padding: 2rem; color: #ef4444;">
                        <i class="fas fa-exclamation-circle" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                        <p>Error loading work history.</p>
                    </div>
                `;
    }
}

// Resources Modal Functions
window.showResources = function (event) {
    if (event) event.preventDefault();
    const modal = document.getElementById('resources-modal');
    if (modal) modal.style.display = 'flex';
}

window.closeResourcesModal = function () {
    const modal = document.getElementById('resources-modal');
    if (modal) modal.style.display = 'none';
}

// API Logs Modal Functions - Show All User Interactions
window.showVoiceReports = async function (event) {
    if (event) event.preventDefault();
    const modal = document.getElementById('voice-reports-modal');
    if (modal) {
        modal.style.display = 'flex';
        await loadApiLogs();
        await loadApiStats();
    }
}

window.closeVoiceReportsModal = function () {
    const modal = document.getElementById('voice-reports-modal');
    if (modal) modal.style.display = 'none';
}

window.filterApiLogs = async function () {
    await loadApiLogs();
}

async function loadApiLogs() {
    const content = document.getElementById('voice-reports-content');
    if (!content) return;

    content.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: #64748b;">
                    <i class="fas fa-spinner fa-spin" style="font-size: 2rem;"></i>
                    <p>Loading API logs...</p>
                </div>
            `;

    try {
        // Get filter values
        const userType = document.getElementById('filter-user-type')?.value || '';
        const endpoint = document.getElementById('filter-endpoint')?.value || '';

        const queryParams = new URLSearchParams();
        if (userType) queryParams.append('user_type', userType);
        if (endpoint) queryParams.append('endpoint', endpoint);
        queryParams.append('limit', '50');

        const response = await fetch(`/official/apiLogs?${queryParams.toString()}`, {
            credentials: 'same-origin'
        });

        if (!response.ok) {
            throw new Error('Failed to fetch API logs');
        }

        const data = await response.json();
        console.log('API logs:', data);

        if (data.success && data.logs && data.logs.length > 0) {
            let html = '<div style="display: flex; flex-direction: column; gap: 0.75rem;">';

            data.logs.forEach(log => {
                const date = new Date(log.created_at).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                });

                // Status color
                let statusColor = '#10b981'; // green for 2xx
                if (log.response_status >= 400) statusColor = '#ef4444'; // red for 4xx/5xx
                else if (log.response_status >= 300) statusColor = '#f59e0b'; // orange for 3xx

                // User type badge color
                const userTypeBadge = {
                    'citizen': { bg: '#3b82f6', text: 'Citizen' },
                    'official': { bg: '#8b5cf6', text: 'Official' },
                    'admin': { bg: '#ec4899', text: 'Admin' },
                    'guest': { bg: '#64748b', text: 'Guest' }
                }[log.user_type] || { bg: '#64748b', text: 'Unknown' };

                // Method badge color
                const methodColor = {
                    'GET': '#10b981',
                    'POST': '#3b82f6',
                    'PUT': '#f59e0b',
                    'DELETE': '#ef4444'
                }[log.method] || '#64748b';

                html += `
                            <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 1rem; transition: all 0.2s;" onmouseover="this.style.boxShadow='0 4px 6px rgba(0,0,0,0.1)'" onmouseout="this.style.boxShadow='none'">
                                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.75rem;">
                                    <div style="flex: 1;">
                                        <div style="display: flex; gap: 0.5rem; align-items: center; margin-bottom: 0.5rem;">
                                            <span style="padding: 0.25rem 0.5rem; background: ${methodColor}; color: white; border-radius: 4px; font-size: 0.75rem; font-weight: bold;">
                                                ${log.method}
                                            </span>
                                            <span style="padding: 0.25rem 0.5rem; background: ${userTypeBadge.bg}; color: white; border-radius: 4px; font-size: 0.75rem;">
                                                ${userTypeBadge.text}
                                            </span>
                                            <span style="padding: 0.25rem 0.5rem; background: ${statusColor}; color: white; border-radius: 4px; font-size: 0.75rem;">
                                                ${log.response_status || 'N/A'}
                                            </span>
                                        </div>
                                        <div style="font-family: monospace; font-size: 0.9rem; color: #1e40af; margin-bottom: 0.5rem;">
                                            ${log.endpoint}
                                        </div>
                                        ${log.First_name ? `
                                            <div style="font-size: 0.85rem; color: #64748b;">
                                                <i class="fas fa-user"></i> ${log.First_name} ${log.Last_name}
                                                ${log.Email ? `| <i class="fas fa-envelope"></i> ${log.Email}` : ''}
                                            </div>
                                        ` : ''}
                                    </div>
                                    <div style="text-align: right; font-size: 0.8rem; color: #64748b;">
                                        <i class="fas fa-clock"></i> ${date}
                                    </div>
                                </div>

                                ${log.request_body && log.request_body !== 'null' ? `
                                    <details style="margin-top: 0.5rem;">
                                        <summary style="cursor: pointer; color: #3b82f6; font-size: 0.85rem; font-weight: 600;">
                                            <i class="fas fa-arrow-up"></i> Request Body
                                        </summary>
                                        <pre style="background: #f8fafc; padding: 0.75rem; border-radius: 6px; margin-top: 0.5rem; font-size: 0.8rem; overflow-x: auto; max-height: 200px;">${log.request_body}</pre>
                                    </details>
                                ` : ''}

                                ${log.request_params && log.request_params !== 'null' && log.request_params !== '{}' ? `
                                    <details style="margin-top: 0.5rem;">
                                        <summary style="cursor: pointer; color: #8b5cf6; font-size: 0.85rem; font-weight: 600;">
                                            <i class="fas fa-link"></i> Request Params
                                        </summary>
                                        <pre style="background: #f8fafc; padding: 0.75rem; border-radius: 6px; margin-top: 0.5rem; font-size: 0.8rem; overflow-x: auto;">${log.request_params}</pre>
                                    </details>
                                ` : ''}

                                ${log.request_query && log.request_query !== 'null' && log.request_query !== '{}' ? `
                                    <details style="margin-top: 0.5rem;">
                                        <summary style="cursor: pointer; color: #f59e0b; font-size: 0.85rem; font-weight: 600;">
                                            <i class="fas fa-search"></i> Query Params
                                        </summary>
                                        <pre style="background: #f8fafc; padding: 0.75rem; border-radius: 6px; margin-top: 0.5rem; font-size: 0.8rem; overflow-x: auto;">${log.request_query}</pre>
                                    </details>
                                ` : ''}

                                ${log.response_data && log.response_data !== 'null' ? `
                                    <details style="margin-top: 0.5rem;">
                                        <summary style="cursor: pointer; color: #10b981; font-size: 0.85rem; font-weight: 600;">
                                            <i class="fas fa-arrow-down"></i> Response Data
                                        </summary>
                                        <pre style="background: #f0fdf4; padding: 0.75rem; border-radius: 6px; margin-top: 0.5rem; font-size: 0.8rem; overflow-x: auto; max-height: 200px;">${log.response_data}</pre>
                                    </details>
                                ` : ''}

                                ${log.error_message ? `
                                    <div style="margin-top: 0.5rem; padding: 0.5rem; background: #fef2f2; border-left: 3px solid #ef4444; border-radius: 4px;">
                                        <strong style="color: #dc2626; font-size: 0.85rem;">
                                            <i class="fas fa-exclamation-triangle"></i> Error:
                                        </strong>
                                        <span style="color: #991b1b; font-size: 0.85rem; margin-left: 0.5rem;">${log.error_message}</span>
                                    </div>
                                ` : ''}

                                ${log.ip_address ? `
                                    <div style="margin-top: 0.5rem; font-size: 0.75rem; color: #94a3b8;">
                                        <i class="fas fa-network-wired"></i> IP: ${log.ip_address}
                                    </div>
                                ` : ''}
                            </div>
                        `;
            });

            html += '</div>';
            content.innerHTML = html;
        } else {
            content.innerHTML = `
                        <div style="text-align: center; padding: 3rem; color: #64748b;">
                            <i class="fas fa-server" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;"></i>
                            <p style="font-size: 1.1rem; margin: 0;">No API logs found</p>
                            <small style="color: #94a3b8;">User interactions will appear here</small>
                        </div>
                    `;
        }
    } catch (error) {
        console.error('Error loading API logs:', error);
        content.innerHTML = `
                    <div style="text-align: center; padding: 2rem; color: #ef4444;">
                        <i class="fas fa-exclamation-circle" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                        <p>Failed to load API logs</p>
                        <small style="color: #64748b;">${error.message}</small>
                    </div>
                `;
    }
}

async function loadApiStats() {
    const statsContainer = document.getElementById('api-stats');
    if (!statsContainer) return;

    try {
        const response = await fetch('/official/apiLogs/stats', {
            credentials: 'same-origin'
        });

        if (!response.ok) {
            throw new Error('Failed to fetch stats');
        }

        const data = await response.json();
        console.log('API stats:', data);

        if (data.success && data.stats) {
            const stats = data.stats;
            statsContainer.innerHTML = `
                        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 1rem; border-radius: 8px; color: white;">
                            <div style="font-size: 1.5rem; font-weight: bold;">${stats.total_requests || 0}</div>
                            <div style="font-size: 0.85rem; opacity: 0.9;">Total Requests</div>
                        </div>
                        <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 1rem; border-radius: 8px; color: white;">
                            <div style="font-size: 1.5rem; font-weight: bold;">${stats.unique_users || 0}</div>
                            <div style="font-size: 0.85rem; opacity: 0.9;">Unique Users</div>
                        </div>
                        <div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); padding: 1rem; border-radius: 8px; color: white;">
                            <div style="font-size: 1.5rem; font-weight: bold;">${stats.successful_requests || 0}</div>
                            <div style="font-size: 0.85rem; opacity: 0.9;">Successful</div>
                        </div>
                        <div style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); padding: 1rem; border-radius: 8px; color: white;">
                            <div style="font-size: 1.5rem; font-weight: bold;">${stats.failed_requests || 0}</div>
                            <div style="font-size: 0.85rem; opacity: 0.9;">Failed</div>
                        </div>
                        <div style="background: linear-gradient(135deg, #30cfd0 0%, #330867 100%); padding: 1rem; border-radius: 8px; color: white;">
                            <div style="font-size: 1.5rem; font-weight: bold;">${stats.citizen_requests || 0}</div>
                            <div style="font-size: 0.85rem; opacity: 0.9;">Citizen Requests</div>
                        </div>
                    `;
        }
    } catch (error) {
        console.error('Error loading API stats:', error);
    }
}

// Initialize speech recognition on page load
$(document).ready(function () {
    initSpeechRecognition();
});