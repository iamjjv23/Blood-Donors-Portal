const supabaseUrl = 'https://pkjrqjaavmxhegktwuuk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBranJxamFhdm14aGVna3R3dXVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwNzM1MDIsImV4cCI6MjEwNTY0OTUwMn0.TQLtFxYw6pROFdnlnFpZ-B7duqSywnCnEOHtS6T_Xwc';
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

const token = localStorage.getItem('token');
const role = localStorage.getItem('role');
const currentUserId = localStorage.getItem('userId');

window.onload = () => {
    if (!token || (role !== 'Organiser_user' && role !== 'Master_admin')) {
        alert('Unauthorized access. Redirecting to login.');
        window.location.href = '../index.html'; 
    } else {
        fetchDonorCount();
    }
};

async function logActivity(actionDetails) {
    try {
        await supabaseClient.from('activity_logs').insert({
            user_id: currentUserId,
            action_details: actionDetails + ' (via Web)' 
        });
    } catch (e) {
        console.error("Failed to log activity:", e);
    }
}

function showSection(sectionId, clickedBtn) {
    document.querySelectorAll('.section').forEach(sec => sec.classList.remove('active'));
    document.getElementById(sectionId).classList.add('active');
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active-tab'));
    clickedBtn.classList.add('active-tab');
    document.getElementById('message').textContent = '';
    
    // NEW: Fetch users when the Manage Team tab is clicked
    if (sectionId === 'userSection') {
        fetchMyTeam();
    }
}

async function fetchDonorCount() {
    try {
        const { data: myUsers } = await supabaseClient.from('users').select('id').eq('created_by', currentUserId);
        const myUserIds = (myUsers || []).map(u => u.id);
        myUserIds.push(currentUserId); 

        const { count, error } = await supabaseClient
            .from('donors')
            .select('*', { count: 'exact', head: true })
            .in('entered_by', myUserIds);

        if (error) throw error;
        document.getElementById('teamDonorsCount').textContent = count;
    } catch (error) {
        document.getElementById('message').textContent = 'Error fetching stats.';
    }
}

// ==========================================
// NEW: MANAGE TEAM LOGIC
// ==========================================
async function fetchMyTeam() {
    const tbody = document.getElementById('usersTableBody');
    try {
        const { data: teamMembers, error } = await supabaseClient.from('users').select('*').eq('created_by', currentUserId);
        if (error) throw error;

        tbody.innerHTML = '';
        if (!teamMembers || teamMembers.length === 0) {
            return tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">You have no Data Entry users yet.</td></tr>';
        }

        teamMembers.forEach(user => {
            const safeId = user.id.replace(/'/g, "\\'");
            const safeName = (user.name || '').replace(/'/g, "\\'");
            const safeUser = user.username.replace(/'/g, "\\'");
            const safePass = user.password.replace(/'/g, "\\'");
            
            const isActive = user.is_active !== false;
            const statusBadge = isActive ? '<span style="color: #28a745; font-weight:bold;">🟢 Active</span>' : '<span style="color: #dc3545; font-weight:bold;">🔴 Disabled</span>';

            tbody.innerHTML += `<tr>
                <td><strong>${user.name || '-'}</strong></td>
                <td>${user.username}</td>
                <td>${user.password}</td>
                <td>${statusBadge}</td>
                <td>
                    <button class="btn-sm btn-edit" style="margin-right: 5px;" onclick="triggerEditUser('${safeId}', '${safeName}', '${safeUser}', '${safePass}')">Edit</button>
                    <button class="btn-sm btn-delete" onclick="deleteUser('${safeId}', '${safeUser}')">Delete</button>
                </td>
            </tr>`;
        });
    } catch (error) {
        tbody.innerHTML = '<tr><td colspan="5" style="color:red; text-align:center;">Error loading team.</td></tr>';
    }
}

document.getElementById('addUserForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const msgDiv = document.getElementById('message');
    msgDiv.textContent = 'Processing...';
    msgDiv.style.color = '#0056b3';

    const userId = document.getElementById('editUserId').value;
    const name = document.getElementById('newName').value.trim();
    const username = document.getElementById('newUsername').value.trim();
    const password = document.getElementById('newPassword').value; // Don't trim password

    try {
        if (userId) {
            // ================== EDIT MODE ==================
            const payload = { name: name, username: username };
            if (password !== "") { payload.password = password; } // Only update pass if they typed one
            
            const { error } = await supabaseClient.from('users').update(payload).eq('id', userId);
            if (error) throw error;

            await logActivity(`Updated Data Entry user credentials for: ${name || username}`);
            msgDiv.textContent = 'User successfully updated!';
            msgDiv.style.color = 'green';
        } else {
            // ================== ADD MODE ==================
            if (password === "") throw new Error("Password is required for new users.");
            
            const payload = {
                name: name,
                username: username,
                password: password,
                role: 'Data_entry_user',
                created_by: currentUserId,
                is_active: true
            };

            const { error } = await supabaseClient.from('users').insert(payload);
            if (error) throw error;

            await logActivity(`Created new Data Entry user: ${name || username}`);
            msgDiv.textContent = 'User successfully created!';
            msgDiv.style.color = 'green';
        }

        resetUserForm();
        fetchMyTeam(); // Refresh the table
    } catch (error) {
        msgDiv.textContent = error.message || 'Username already exists or connection failed.';
        msgDiv.style.color = 'red';
    }
});

function triggerEditUser(id, name, username, password) {
    document.getElementById('editUserId').value = id;
    document.getElementById('newName').value = name;
    document.getElementById('newUsername').value = username;
    
    // Clear the password field and make it optional so they don't accidentally overwrite it
    document.getElementById('newPassword').value = '';
    document.getElementById('newPassword').removeAttribute('required');
    document.getElementById('passwordHint').style.display = 'block';

    document.getElementById('formTitle').textContent = 'Edit Team Member';
    document.getElementById('submitUserBtn').textContent = 'Save Changes';
    document.getElementById('cancelEditBtn').style.display = 'block';
    
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
}

function resetUserForm() {
    document.getElementById('addUserForm').reset();
    document.getElementById('editUserId').value = '';
    
    document.getElementById('newPassword').setAttribute('required', 'true');
    document.getElementById('passwordHint').style.display = 'none';

    document.getElementById('formTitle').textContent = 'Create New User';
    document.getElementById('submitUserBtn').textContent = 'Create User';
    document.getElementById('cancelEditBtn').style.display = 'none';
}

async function deleteUser(id, username) {
    if (!confirm(`Are you sure you want to delete User '${username}'?`)) return;
    try {
        const { error } = await supabaseClient.from('users').delete().eq('id', id);
        if (error) throw error;
        
        await logActivity(`Deleted Data Entry user: ${username}`);
        fetchMyTeam();
    } catch (error) { 
        alert('Error: Cannot delete a user that has already entered donor data.'); 
    }
}

function logout() {
    localStorage.clear();
    window.location.href = '../index.html';
}
