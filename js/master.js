const API = 'UPH';
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('role');
        const currentUserId = localStorage.getItem('userId');
        
        let globalHierarchy = {}; 
        let masterCamps = ['General'];
        let masterOrganisers = [];

        window.onload = () => {
            if (!token || role !== 'Master_admin') {
                alert('Unauthorized access.');
                window.location.href = '../index.html'; 
            } else {
                fetchMasterStats();
                fetchMasterConfig(); 
            }
        };

        function showSection(sectionId, clickedBtn) {
            document.querySelectorAll('.section').forEach(sec => sec.classList.remove('active'));
            document.getElementById(sectionId).classList.add('active');
            
            if(clickedBtn) {
                document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active-tab'));
                clickedBtn.classList.add('active-tab');
            }
            document.getElementById('message').textContent = '';

            if(sectionId === 'manageSection') fetchOrganisersList();
        }

        async function fetchMasterStats() {
            try {
                const response = await fetch(`${API}?action=getStats&token=${token}`);
                const result = await response.json();

                if (result.status === 'success') {
                    document.getElementById('masterTotalDonors').textContent = result.totalDonors;
                    globalHierarchy = result.hierarchyStats;
                    
                    const listObj = document.getElementById('orgStatsList');
                    listObj.innerHTML = ''; 
                    let orgCount = 0;

                    for (const [orgId, data] of Object.entries(globalHierarchy)) {
                        if (orgId === 'master') {
                            if (data.totalDonors > 0) {
                                listObj.innerHTML += `
                                    <li style="background-color: #f8f9fa;">
                                        <span style="color: #555; font-weight: bold;">${data.orgName}</span>
                                        <span class="org-count">${data.totalDonors} donors</span>
                                    </li>`;
                            }
                        } else {
                            orgCount++;
                            listObj.innerHTML += `
                                <li title="Click to view team details" onclick="showBreakdownSection('${orgId}')">
                                    <span class="org-link">${data.orgName}</span>
                                    <span class="org-count">${data.totalDonors} donors</span>
                                </li>`;
                        }
                    }
                    document.getElementById('masterTotalOrgs').textContent = orgCount;
                }
            } catch (error) {
                document.getElementById('message').textContent = 'Failed to load stats.';
                document.getElementById('message').style.color = 'red';
            }
        }

        function showHierarchySection() {
            document.querySelectorAll('.section').forEach(sec => sec.classList.remove('active'));
            document.getElementById('orgHierarchySection').classList.add('active');
            const tbody = document.getElementById('hierarchyTableBody');
            tbody.innerHTML = '';
            
            for (const [orgId, data] of Object.entries(globalHierarchy)) {
                if (orgId === 'master' && data.totalDonors === 0) continue;
                tbody.innerHTML += `
                    <tr class="hover-row" onclick="showBreakdownSection('${orgId}')">
                        <td><strong>${data.orgName}</strong></td>
                        <td>${data.deCount} Data Entry Users</td>
                        <td style="color: #d32f2f; font-weight: bold;">${data.totalDonors} Entries</td>
                    </tr>`;
            }
        }

        function showBreakdownSection(orgId) {
            document.querySelectorAll('.section').forEach(sec => sec.classList.remove('active'));
            document.getElementById('deBreakdownSection').classList.add('active');
            
            const data = globalHierarchy[orgId];
            document.getElementById('breakdownTitle').textContent = `Team Entries: ${data.orgName}`;
            
            const tbody = document.getElementById('breakdownTableBody');
            tbody.innerHTML = '';

            data.breakdownArray.forEach(user => {
                if (user.name === '[Organiser Direct Entry]' && user.count === 0) return;
                if (user.name === '[Master Direct]' && user.count === 0) return;

                let displayName = user.name;
                if (user.name === '[Organiser Direct Entry]') displayName = '<em>Organiser (Direct Entry)</em>';
                if (user.name === '[Master Direct]') displayName = '<em>Master Admin (Direct Entry)</em>';

                const safeName = user.name.replace(/'/g, "\\'");
                tbody.innerHTML += `
                    <tr class="hover-row" onclick="fetchUserDonors('${user.userId}', '${safeName}', '${orgId}')">
                        <td><strong>${displayName}</strong></td>
                        <td style="color: #d32f2f; font-weight: bold;">${user.count}</td>
                    </tr>`;
            });
        }

        async function fetchUserDonors(targetUserId, rawName, orgId) {
            document.querySelectorAll('.section').forEach(sec => sec.classList.remove('active'));
            document.getElementById('individualDonorsSection').classList.add('active');
            
            let displayName = rawName;
            if (rawName === '[Organiser Direct Entry]') displayName = 'Organiser (Direct Entry)';
            if (rawName === '[Master Direct]') displayName = 'Master Admin (Direct Entry)';
            
            document.getElementById('individualDonorsTitle').textContent = `Entries logged by: ${displayName}`;
            
            document.getElementById('individualDonorsSection').dataset.currentUser = targetUserId;
            document.getElementById('individualDonorsSection').dataset.currentName = rawName;
            document.getElementById('individualDonorsSection').dataset.currentOrgId = orgId;

            document.getElementById('btnBackToBreakdown').onclick = () => showBreakdownSection(orgId);
            
            const tbody = document.getElementById('individualDonorsTableBody');
            tbody.innerHTML = '<tr><td colspan="7">Loading...</td></tr>';
            
            try {
                const response = await fetch(`${API}?action=getDonorsByUserId&targetUserId=${targetUserId}&token=${token}`);
                const result = await response.json();
                
                if (result.status === 'success') {
                    tbody.innerHTML = '';
                    if (result.donors.length === 0) {
                        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">No donors entered by this user.</td></tr>';
                        return;
                    }
                    result.donors.forEach(donor => {
                        let actionHtml = `<a href="donor.html?id=${donor.id}" class="btn-view">View</a>`;
                        actionHtml += ` <button class="btn-sm btn-edit" style="margin-left:5px;" onclick="window.location.href='data_entry.html?edit=${donor.id}'">Edit</button>`;
                        actionHtml += ` <button class="btn-sm btn-delete" style="margin-left:5px;" onclick="deleteDonorRecord('${donor.id}')">Delete</button>`;

                        // UPDATE: Visual Formatter Logic for Master Table
                        const statusDisplay = donor.status === 'Active' ? '🟢 Active' : 'Rest 🩸';
                        const statusColor = donor.status === 'Active' ? 'green' : 'orange';

                        tbody.innerHTML += `<tr>
                            <td><strong>${donor.name}</strong></td>
                            <td><span class="blood-badge">${donor.bloodGroup}</span></td>
                            <td>${donor.contact}</td>
                            <td>${donor.location}</td>
                            <td>${donor.campName || 'General'}</td>
                            <td style="color: ${statusColor}; font-weight: bold;">${statusDisplay}</td>
                            <td>${actionHtml}</td>
                        </tr>`;
                    });
                }
            } catch (error) {
                tbody.innerHTML = '<tr><td colspan="7" style="color:red">Failed to load individual data.</td></tr>';
            }
        }

        async function deleteDonorRecord(donorId) {
            if(!confirm("Are you sure you want to delete this donor? This action cannot be undone.")) return;
            const payload = { action: 'deleteDonorRecord', token: token, donorId: donorId };
            
            try {
                const response = await fetch(API, { 
                    method: 'POST', 
                    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                    body: JSON.stringify(payload) 
                });
                const result = await response.json();
                if(result.status === 'success') {
                    const section = document.getElementById('individualDonorsSection');
                    fetchUserDonors(section.dataset.currentUser, section.dataset.currentName, section.dataset.currentOrgId);
                    fetchMasterStats();
                } else {
                    alert('Error: ' + result.message);
                }
            } catch(e) {
                alert('Connection failed while deleting.');
            }
        }

        async function fetchMasterConfig() {
            try {
                const response = await fetch(`${API}?action=getMasterConfig&token=${token}`);
                const result = await response.json();
                if(result.status === 'success') {
                    masterCamps = result.camps;
                    masterOrganisers = result.organisers;
                    
                    renderCampsUI();
                    populateCampDropdowns();
                }
            } catch (e) {}
        }

        function renderCampsUI() {
            const tbody = document.getElementById('campsTableBody');
            tbody.innerHTML = '';
            masterCamps.forEach((camp, index) => {
                tbody.innerHTML += `
                    <tr>
                        <td><strong>${camp}</strong></td>
                        <td>
                            <button class="btn-sm btn-edit" onclick="editCamp(${index})">Edit</button>
                            <button class="btn-sm btn-delete" onclick="deleteCamp(${index})">Delete</button>
                        </td>
                    </tr>`;
            });
        }

        function populateCampDropdowns() {
            const selects = [document.getElementById('orgDefaultCamp'), document.getElementById('assignCampSelect')];
            selects.forEach(select => {
                if(!select) return;
                select.innerHTML = '';
                masterCamps.forEach(camp => { select.innerHTML += `<option value="${camp}">${camp}</option>`; });
            });

            const orgSelect = document.getElementById('assignOrgSelect');
            if(orgSelect) {
                orgSelect.innerHTML = '';
                masterOrganisers.forEach(org => { orgSelect.innerHTML += `<option value="${org.id}">${org.username}</option>`; });
            }
        }

        async function addCamp() {
            const val = document.getElementById('newCampInput').value.trim();
            if(!val) return;
            if(masterCamps.includes(val)) return alert("Camp already exists!");
            masterCamps.push(val);
            document.getElementById('newCampInput').value = '';
            await saveCampsToServer();
        }

        async function editCamp(index) {
            const oldName = masterCamps[index];
            const newName = prompt("Edit camp name:", oldName);
            if(!newName || newName.trim() === "" || newName === oldName) return;
            if(masterCamps.includes(newName)) return alert("Camp name already exists!");
            masterCamps[index] = newName.trim();
            await saveCampsToServer();
        }

        async function deleteCamp(index) {
            if(!confirm("Delete this camp from the master list?")) return;
            masterCamps.splice(index, 1);
            if(masterCamps.length === 0) masterCamps = ['General']; 
            await saveCampsToServer();
        }

        async function saveCampsToServer() {
            const payload = { action: 'updateCamps', token: token, camps: masterCamps };
            try {
                const response = await fetch(API, { 
                    method: 'POST', 
                    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                    body: JSON.stringify(payload) 
                });
                const result = await response.json();
                if(result.status === 'success') {
                    renderCampsUI();
                    populateCampDropdowns(); 
                }
            } catch(e) { alert('Connection failed.'); }
        }

        async function assignDefaultCamp() {
            const orgId = document.getElementById('assignOrgSelect').value;
            const campName = document.getElementById('assignCampSelect').value;
            if(!orgId || !campName) return;
            const payload = { action: 'assignCamp', token: token, orgId: orgId, campName: campName };
            try {
                const response = await fetch(API, { 
                    method: 'POST', 
                    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                    body: JSON.stringify(payload) 
                });
                const result = await response.json();
                if(result.status === 'success') {
                    const org = masterOrganisers.find(o => o.id === orgId);
                    if(org) org.defaultCamp = campName;
                    fetchOrganisersList(); 
                }
            } catch(e) { alert('Connection failed.'); }
        }

        async function fetchOrganisersList() {
            const tbody = document.getElementById('orgTableBody');
            try {
                const response = await fetch(`${API}?action=getOrganisers&token=${token}`);
                const result = await response.json();

                if (result.status === 'success') {
                    tbody.innerHTML = '';
                    if (result.organisers.length === 0) {
                        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center">No organisers found.</td></tr>';
                        return;
                    }
                    result.organisers.forEach(org => {
                        const safeId = org.id.replace(/'/g, "\\'");
                        const safeUser = org.username.replace(/'/g, "\\'");
                        const safePass = org.password.replace(/'/g, "\\'");
                        const safeCamp = org.defaultCamp.replace(/'/g, "\\'");
                        tbody.innerHTML += `
                            <tr>
                                <td><strong>${org.username}</strong></td>
                                <td>${org.password}</td>
                                <td style="color:#0056b3; font-weight:bold;">${org.defaultCamp}</td>
                                <td>
                                    <button class="btn-sm btn-edit" onclick="triggerEdit('${safeId}', '${safeUser}', '${safePass}', '${safeCamp}')">Edit</button>
                                    <button class="btn-sm btn-delete" onclick="deleteOrganiser('${safeId}')">Delete</button>
                                </td>
                            </tr>`;
                    });
                }
            } catch (error) { tbody.innerHTML = '<tr><td colspan="4" style="color:red">Error loading organisers.</td></tr>'; }
        }

        document.getElementById('orgForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const msgDiv = document.getElementById('message');
            const orgId = document.getElementById('orgId').value;
            const username = document.getElementById('orgUsername').value.trim();
            const password = document.getElementById('orgPassword').value;
            const defaultCamp = document.getElementById('orgDefaultCamp').value; 

            const actionType = orgId ? 'editUser' : 'addUser';
            const payload = { action: actionType, token: token, userData: { username, password, defaultCamp } };
            
            if (orgId) payload.userData.id = orgId;
            else payload.userData.role = 'Organiser_user';

            try {
                const response = await fetch(API, { 
                    method: 'POST', 
                    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                    body: JSON.stringify(payload) 
                });
                const result = await response.json();

                if (result.status === 'success') {
                    resetOrgForm();
                    fetchOrganisersList(); 
                    fetchMasterConfig(); 
                } else {
                    alert('Error: ' + result.message);
                }
            } catch (error) {}
        });

        function triggerEdit(id, username, password, camp) {
            document.getElementById('orgId').value = id;
            document.getElementById('orgUsername').value = username;
            document.getElementById('orgPassword').value = password;
            document.getElementById('orgDefaultCamp').value = camp; 
            document.getElementById('orgFormTitle').textContent = 'Edit Organiser';
            document.getElementById('orgSubmitBtn').textContent = 'Update Details';
            document.getElementById('orgCancelBtn').style.display = 'block';
            window.scrollTo({ top: 0, behavior: 'smooth' }); 
        }

        function resetOrgForm() {
            document.getElementById('orgForm').reset();
            document.getElementById('orgId').value = '';
            document.getElementById('orgFormTitle').textContent = 'Add New Organiser';
            document.getElementById('orgSubmitBtn').textContent = 'Create Organiser';
            document.getElementById('orgCancelBtn').style.display = 'none';
        }

        async function deleteOrganiser(id) {
            if (!confirm('Are you sure you want to delete this Organiser?')) return;
            const payload = { action: 'deleteUser', token: token, userId: id };
            try {
                const response = await fetch(API, { 
                    method: 'POST', 
                    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                    body: JSON.stringify(payload) 
                });
                const result = await response.json();
                if (result.status === 'success') {
                    fetchOrganisersList();
                    fetchMasterStats();
                } else {
                    alert('Error: ' + result.message);
                }
            } catch (error) {}
        }

        document.getElementById('settingsForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!confirm("Are you sure you want to change the database configuration?")) return;

            const payload = { action: 'updateSettings', token: token, settingsData: [{ key: 'Donor_Sheet_ID', value: document.getElementById('donorSheetId').value.trim() }] };
            try {
                const response = await fetch(API, { 
                    method: 'POST', 
                    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                    body: JSON.stringify(payload) 
                });
                const result = await response.json();
                if (result.status === 'success') {
                    alert('Success: Database link updated!');
                    document.getElementById('settingsForm').reset();
                }
            } catch (error) {}
        });

        function logout() {
            localStorage.clear();
            window.location.href = '../index.html'; 
        }
