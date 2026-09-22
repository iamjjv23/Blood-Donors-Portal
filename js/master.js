const supabaseUrl = 'https://pkjrqjaavmxhegktwuuk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBranJxamFhdm14aGVna3R3dXVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwNzM1MDIsImV4cCI6MjEwNTY0OTUwMn0.TQLtFxYw6pROFdnlnFpZ-B7duqSywnCnEOHtS6T_Xwc';
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

const token = localStorage.getItem('token');
const role = localStorage.getItem('role');

let globalHierarchy = {}; 
let masterCamps = [];
let masterOrganisers = [];

window.onload = () => {
    if (!token || role !== 'Master_admin') {
        window.location.href = '../index.html'; 
    } else {
        fetchMasterStats();
        fetchMasterConfig(); 
    }
};

function showSection(sectionId, clickedBtn) {
    document.querySelectorAll('.section').forEach(sec => sec.classList.remove('active'));
    document.getElementById(sectionId).classList.add('active');
    if (clickedBtn) {
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active-tab'));
        clickedBtn.classList.add('active-tab');
    }
    document.getElementById('message').textContent = '';
    if (sectionId === 'manageSection') fetchOrganisersList();
}

async function fetchMasterStats() {
    const msgDiv = document.getElementById('message');
    try {
        // Explicit Error Checking added here
        const { data: users, error: userErr } = await supabaseClient.from('users').select('*');
        if (userErr) throw new Error("Users Data Error: " + userErr.message);

        const { data: donors, error: donorErr } = await supabaseClient.from('donors').select('entered_by');
        if (donorErr) throw new Error("Donors Data Error: " + donorErr.message);
        
        // Safe fallbacks to prevent crashes if table is empty
        const safeUsers = users || [];
        const safeDonors = donors || [];
        
        document.getElementById('masterTotalDonors').textContent = safeDonors.length;
        
        globalHierarchy = {};
        safeUsers.forEach(u => {
            if (u.role === 'Organiser_user') {
                globalHierarchy[u.id] = { orgName: u.username, totalDonors: 0, deCount: 0, breakdownMap: {} };
                globalHierarchy[u.id].breakdownMap[u.id] = { name: '[Organiser Direct Entry]', count: 0 };
            }
        });
        globalHierarchy['master'] = { orgName: 'Master Admin Direct Entries', totalDonors: 0, deCount: 0, breakdownMap: { 'master': { name: '[Master Direct]', count: 0 } } };

        safeUsers.forEach(u => {
            if (u.role === 'Data_entry_user' && globalHierarchy[u.created_by]) {
                globalHierarchy[u.created_by].deCount++;
                globalHierarchy[u.created_by].breakdownMap[u.id] = { name: u.username, count: 0 };
            }
        });

        safeDonors.forEach(d => {
            const enteredBy = d.entered_by;
            const userObj = safeUsers.find(u => u.id === enteredBy);
            if (userObj) {
                if (userObj.role === 'Organiser_user' && globalHierarchy[enteredBy]) {
                    globalHierarchy[enteredBy].totalDonors++;
                    globalHierarchy[enteredBy].breakdownMap[enteredBy].count++;
                } else if (userObj.role === 'Data_entry_user' && globalHierarchy[userObj.created_by]) {
                    globalHierarchy[userObj.created_by].totalDonors++;
                    if(!globalHierarchy[userObj.created_by].breakdownMap[enteredBy]) globalHierarchy[userObj.created_by].breakdownMap[enteredBy] = {name: userObj.username, count: 0};
                    globalHierarchy[userObj.created_by].breakdownMap[enteredBy].count++;
                } else if (userObj.role === 'Master_admin') {
                    globalHierarchy['master'].totalDonors++;
                    globalHierarchy['master'].breakdownMap['master'].count++;
                }
            }
        });

        Object.keys(globalHierarchy).forEach(orgId => {
            globalHierarchy[orgId].breakdownArray = Object.keys(globalHierarchy[orgId].breakdownMap).map(uid => {
               return { userId: uid, name: globalHierarchy[orgId].breakdownMap[uid].name, count: globalHierarchy[orgId].breakdownMap[uid].count };
            });
        });

        const listObj = document.getElementById('orgStatsList');
        listObj.innerHTML = ''; 
        let orgCount = 0;

        for (const [orgId, data] of Object.entries(globalHierarchy)) {
            if (orgId === 'master') {
                if (data.totalDonors > 0) {
                    listObj.innerHTML += `<li style="background-color: #f8f9fa;"><span style="color: #555; font-weight: bold;">${data.orgName}</span><span class="org-count">${data.totalDonors} donors</span></li>`;
                }
            } else {
                orgCount++;
                listObj.innerHTML += `<li title="Click to view team details" onclick="showBreakdownSection('${orgId}')"><span class="org-link">${data.orgName}</span><span class="org-count">${data.totalDonors} donors</span></li>`;
            }
        }
        document.getElementById('masterTotalOrgs').textContent = orgCount;
        
    } catch (error) { 
        console.error(error);
        msgDiv.textContent = 'Failed to load stats: ' + error.message;
        msgDiv.style.color = 'red';
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
            <tr class="hover-row" onclick="window.location.href='organiser_details.html?orgId=${orgId}&name=${encodeURIComponent(data.orgName)}'">
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
        if (user.count === 0) return;
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
        const { data: donors, error } = await supabaseClient.from('donors_with_status').select('*').eq('entered_by', targetUserId);
        if (error) throw error;

        tbody.innerHTML = '';
        if (!donors || donors.length === 0) return tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">No donors entered by this user.</td></tr>';
        
        donors.forEach(donor => {
            let actionHtml = `<a href="donor.html?id=${donor.id}" class="btn-view">View</a>`;
            actionHtml += ` <button class="btn-sm btn-edit" style="margin-left:5px;" onclick="window.location.href='data_entry.html?edit=${donor.id}'">Edit</button>`;
            actionHtml += ` <button class="btn-sm btn-delete" style="margin-left:5px;" onclick="deleteDonorRecord('${donor.id}')">Delete</button>`;

            const statusDisplay = donor.status === 'Active' ? '🟢 Active' : '🩸 Rest';
            const statusColor = donor.status === 'Active' ? 'green' : 'orange';

            tbody.innerHTML += `<tr>
                <td><strong>${donor.name}</strong></td>
                <td><span class="blood-badge">${donor.blood_group}</span></td>
                <td>${donor.contact}</td>
                <td>${donor.location}</td>
                <td>${donor.camp_name || 'General'}</td>
                <td style="color: ${statusColor}; font-weight: bold;">${statusDisplay}</td>
                <td>${actionHtml}</td>
            </tr>`;
        });
    } catch (error) { tbody.innerHTML = '<tr><td colspan="7" style="color:red">Failed to load individual data.</td></tr>'; }
}

async function deleteDonorRecord(donorId) {
    if(!confirm("Are you sure you want to delete this donor? This action cannot be undone.")) return;
    try {
        const { error } = await supabaseClient.from('donors').delete().eq('id', donorId);
        if (error) throw error;
        
        const section = document.getElementById('individualDonorsSection');
        fetchUserDonors(section.dataset.currentUser, section.dataset.currentName, section.dataset.currentOrgId);
        fetchMasterStats();
    } catch(e) { alert('Connection failed while deleting.'); }
}

async function fetchMasterConfig() {
    try {
        const { data: camps, error: campErr } = await supabaseClient.from('camps').select('name');
        if (campErr) throw campErr;
        masterCamps = (camps || []).map(c => c.name);
        renderCampsUI();
        
        const { data: orgs, error: orgErr } = await supabaseClient.from('users').select('*').eq('role', 'Organiser_user');
        if (orgErr) throw orgErr;
        masterOrganisers = orgs || [];
        populateCampDropdowns();
    } catch (e) {
        console.error("Config load error: ", e);
    }
}

function renderCampsUI() {
    const tbody = document.getElementById('campsTableBody');
    tbody.innerHTML = '';
    masterCamps.forEach((camp) => {
        tbody.innerHTML += `<tr>
            <td><strong>${camp}</strong></td>
            <td><button class="btn-sm btn-delete" onclick="deleteCamp('${camp}')">Delete</button></td>
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
    try {
        const { error } = await supabaseClient.from('camps').insert({name: val});
        if (error) throw error;
        document.getElementById('newCampInput').value = '';
        fetchMasterConfig();
    } catch(e) { alert("Error adding camp."); }
}

async function deleteCamp(campName) {
    if(!confirm("Delete this camp from the master list?")) return;
    try {
        const { error } = await supabaseClient.from('camps').delete().eq('name', campName);
        if (error) throw error;
        fetchMasterConfig();
    } catch(e) { alert('Error deleting camp (ensure no donors depend on it).'); }
}

async function assignDefaultCamp() {
    const orgId = document.getElementById('assignOrgSelect').value;
    const campName = document.getElementById('assignCampSelect').value;
    if(!orgId || !campName) return;
    try {
        const { error } = await supabaseClient.from('users').update({default_camp: campName}).eq('id', orgId);
        if (error) throw error;
        fetchOrganisersList(); 
    } catch(e) { alert('Connection failed.'); }
}

async function fetchOrganisersList() {
    const tbody = document.getElementById('orgTableBody');
    try {
        const { data: organisers, error } = await supabaseClient.from('users').select('*').eq('role', 'Organiser_user');
        if (error) throw error;

        tbody.innerHTML = '';
        if (!organisers || organisers.length === 0) return tbody.innerHTML = '<tr><td colspan="4" style="text-align:center">No organisers found.</td></tr>';
        
        organisers.forEach(org => {
            const safeId = org.id.replace(/'/g, "\\'");
            const safeUser = org.username.replace(/'/g, "\\'");
            const safePass = org.password.replace(/'/g, "\\'");
            const safeCamp = (org.default_camp || 'General').replace(/'/g, "\\'");
            tbody.innerHTML += `<tr>
                <td><strong>${org.username}</strong></td>
                <td>${org.password}</td>
                <td style="color:#0056b3; font-weight:bold;">${org.default_camp || 'General'}</td>
                <td>
                    <button class="btn-sm btn-edit" onclick="triggerEdit('${safeId}', '${safeUser}', '${safePass}', '${safeCamp}')">Edit</button>
                    <button class="btn-sm btn-delete" onclick="deleteOrganiser('${safeId}')">Delete</button>
                </td>
            </tr>`;
        });
    } catch (error) { tbody.innerHTML = '<tr><td colspan="4" style="color:red">Error loading organisers.</td></tr>'; }
}

document.getElementById('orgForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const orgId = document.getElementById('orgId').value;
    const payload = {
        username: document.getElementById('orgUsername').value.trim(),
        password: document.getElementById('orgPassword').value,
        default_camp: document.getElementById('orgDefaultCamp').value 
    };

    try {
        if (orgId) {
            const { error } = await supabaseClient.from('users').update(payload).eq('id', orgId);
            if (error) throw error;
        } else {
            payload.role = 'Organiser_user';
            const { error } = await supabaseClient.from('users').insert(payload);
            if (error) throw error;
        }
        resetOrgForm();
        fetchOrganisersList(); 
        fetchMasterConfig(); 
    } catch (error) { alert('Error updating database. Username may already exist.'); }
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
    try {
        const { error } = await supabaseClient.from('users').delete().eq('id', id);
        if (error) throw error;
        fetchOrganisersList();
        fetchMasterStats();
    } catch (error) { alert('Error: Cannot delete an Organiser that has active donors linked to their team.'); }
}

document.getElementById('settingsForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    alert('Settings are no longer required. You are successfully connected to Supabase PostgreSQL!');
});

function logout() {
    localStorage.clear();
    window.location.href = '../index.html'; 
}
