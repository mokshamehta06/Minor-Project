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

        async function startTask(taskId) {  // this part is added new
            // alert(`Starting task: ${taskId}`);
            const res = await fetch(`/official/getWorkers`,{
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'same-origin' // send cookies (auth token)
            });
            const WorkerData = await res.json();
            console.log('Workers assigned to official:', WorkerData.workers);    
            const CompleteWorkersInfo = WorkerData.workers;
            console.log(CompleteWorkersInfo[0]);
            console.log(CompleteWorkersInfo[1]);   
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