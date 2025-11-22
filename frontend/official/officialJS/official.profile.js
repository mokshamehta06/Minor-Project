     // Initialize staff dashboard

            let fullUserData = {};
            let allComplaints = [];

            async function loadStaffData() {
                console.log("Loading staff data...");

                try
                {
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
                catch(error)
                {
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

            // Complaints display karne ke liye function
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
                            <p style="font-size: 1.1rem;">No complaints assigned to your department yet.</p>
                        </div>
                    `);
                    $("#tasksCount").html('0 complaints');
                    return;
                }

                // Har complaint ke liye HTML create karo
                validComplaints.forEach(complaint => {
                    const priorityClass = complaint.status === 'reported' ? 'high' :
                                         complaint.status === 'in-progress' ? 'medium' : 'low';

                    const statusBadge = complaint.status === 'reported' ? '🔴 Reported' :
                                       complaint.status === 'in-progress' ? '🟡 In Progress' : '🟢 Resolved';

                    const complaintHTML = `
                        <div class="task-item">
                            <div class="task-priority ${priorityClass}"></div>
                            <div class="task-content">
                                <div class="task-title">Complaint #${complaint.complaint_id} - ${statusBadge}</div>
                                <div class="task-description">${complaint.description || 'No description provided'}</div>
                                <div class="task-meta">
                                    <span><i class="fas fa-calendar"></i> ${new Date(complaint.created_at).toLocaleDateString()}</span>
                                    <span><i class="fas fa-map-marker-alt"></i> ${complaint.City}, ${complaint.State}</span>
                                    <span><i class="fas fa-home"></i> ${complaint.Address_Line || 'N/A'}</span>
                                </div>
                            </div>
                            <div class="task-actions">
                                ${complaint.status === 'reported' ?
                                    `<button class="task-btn start" onclick="startTask(${complaint.complaint_id})">Start Work</button>` : ''}
                                ${complaint.status === 'in-progress' ?
                                    `<button class="task-btn complete" onclick="completeTask(${complaint.complaint_id})">Mark Resolved</button>` : ''}
                                <button class="task-btn view" onclick="viewTask(${complaint.complaint_id})">View Details</button>
                            </div>
                        </div>
                    `;

                    complaintsContainer.append(complaintHTML);
                });
            }

        window.onload = function() {
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
        window.startTask = async function(taskId) {
            console.log('startTask called with taskId:', taskId);
            currentComplaintId = taskId;
            await openWorkerModal(taskId);
        }

        window.openWorkerModal = async function(complaintId) {
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

        window.closeWorkerModal = function() {
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
                const isAssigned = worker.assignment_status === 'assigned';
                const statusText = isAssigned ? 'Yes' : 'No';

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${worker.First_name} ${worker.Last_name}</td>
                    <td>${worker.Phone}</td>
                    <td>${statusText}</td>
                    <td>
                        <button
                            class="assign-btn"
                            onclick="assignWorkerToComplaint(${worker.worker_id}, ${complaintId})"
                            ${isAssigned ? 'disabled' : ''}
                        >
                            ${isAssigned ? 'Already Assigned' : 'Assign to Task'}
                        </button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        }
        window.toggleAddWorkerForm = function() {
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

        window.submitNewWorker = async function() {
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

        window.assignWorkerToComplaint = async function(workerId, complaintId) {
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
        

        function completeTask(taskId) {
            alert(`Completing task: ${taskId}`);
        }

        function viewTask(taskId) {
            alert(`Viewing task details: ${taskId}`);
        }

        function reportIssue() {
            alert('Issue reporting interface will open here');
        }

        function requestSupport() {
            alert('Support request interface will open here');
        }

        function updateLocation() {
            alert('Location update interface will open here');
        }

        function voiceUpdate() {
            alert('Voice update recording will start here');
        }