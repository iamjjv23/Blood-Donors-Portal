const supabaseUrl = 'https://pkjrqjaavmxhegktwuuk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBranJxamFhdm14aGVna3R3dXVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwNzM1MDIsImV4cCI6MjEwNTY0OTUwMn0.TQLtFxYw6pROFdnlnFpZ-B7duqSywnCnEOHtS6T_Xwc';
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

const token = localStorage.getItem('token');
const role = localStorage.getItem('role');
const currentUserId = localStorage.getItem('userId');

window.onload = () => {
    if (!token) {
        alert('Unauthorized access. Redirecting to login.');
        window.location.href = '../index.html'; 
        return;
    }

    if (role === 'Organiser_user' || role === 'Master_admin') {
        const navContainer = document.getElementById('navButtons');
        const backBtn = document.createElement('button');
        backBtn.className = 'btn-nav';
        backBtn.textContent = 'Dashboard';
        backBtn.onclick = () => window.location.href = (role === 'Organiser_user') ? 'organiser.html' : 'master.html';
        navContainer.insertBefore(backBtn, navContainer.firstChild);
    }

    const navContainer = document.getElementById('navButtons');
    const viewBtn = document.createElement('button');
    viewBtn.className = 'btn-nav';
    viewBtn.textContent = 'View All Donors';
    viewBtn.onclick = () => window.location.href = 'view_donors.html';
    navContainer.insertBefore(viewBtn, navContainer.firstChild);

    document.getElementById('lastDonation').value = new Date().toISOString().split('T')[0];
    fetchInitialData();

    const urlParams = new URLSearchParams(window.location.search);
    const editId = urlParams.get('edit');
    if (editId) {
        loadDonorForEdit(editId);
    }
};

async function fetchInitialData() {
    try {
        const { data: camps } = await supabaseClient.from('camps').select('name');
        const campSelect = document.getElementById('campName');
        campSelect.innerHTML = ''; 
        
        camps.forEach(camp => {
            const opt = document.createElement('option');
            opt.value = camp.name; opt.textContent = camp.name;
            campSelect.appendChild(opt);
        });

        // Set default camp based on user role
        const { data: userData } = await supabaseClient.from('users').select('default_camp, created_by').eq('id', currentUserId).single();
        if (userData) {
            let defCamp = userData.default_camp;
            if (role === 'Data_entry_user' && userData.created_by) {
                const { data: orgData } = await supabaseClient.from('users').select('default_camp').eq('id', userData.created_by).single();
                if (orgData) defCamp = orgData.default_camp;
            }
            campSelect.value = defCamp || 'General';
        }
    } catch (err) { console.error("Error loading camps", err); }
}

async function loadDonorForEdit(editId) {
    const msgDiv = document.getElementById('message');
    msgDiv.textContent = 'Loading donor data...';
    msgDiv.style.color = '#0056b3';
    
    try {
        const { data: donor, error } = await supabaseClient.from('donors').select('*').eq('id', editId).single();
        if (error) throw error;
        
        msgDiv.textContent = '';
        
        // Strict URL Hierarchy Verification
        let canEdit = false;
        
        if (role === 'Master_admin') {
            canEdit = true;
        } else if (role === 'Data_entry_user') {
            if (donor.entered_by === currentUserId) canEdit = true;
        } else if (role === 'Organiser_user') {
            const { data: teamUsers } = await supabaseClient.from('users').select('id').eq('created_by', currentUserId);
            const teamIds = (teamUsers || []).map(u => u.id);
            teamIds.push(currentUserId);
            
            // Only allow edit if the donor's author is inside the Organiser's team array
            if (teamIds.includes(donor.entered_by)) canEdit = true;
        }

        if (!canEdit) {
            alert("Security Error: You do not have permission to edit this record.");
            window.location.href = `donor.html?id=${donor.id}`;
            return;
        }

        document.getElementById('editDonorId').value = donor.id;
        document.getElementById('name').value = donor.name;
        document.getElementById('bloodGroup').value = donor.blood_group;
        document.getElementById('contact').value = donor.contact;
        document.getElementById('location').value = donor.location;
        
        const campSelect = document.getElementById('campName');
        if (!Array.from(campSelect.options).some(opt => opt.value === donor.camp_name)) {
            campSelect.innerHTML += `<option value="${donor.camp_name}">${donor.camp_name}</option>`;
        }
        campSelect.value = donor.camp_name;

        document.getElementById('lastDonation').value = donor.last_donation || new Date().toISOString().split('T')[0];
        document.getElementById('submitBtnText').textContent = 'Update Donor Details';
        document.getElementById('cancelEditBtn').style.display = 'block';
        document.getElementById('message').innerHTML = `<span style="color:orange;">Editing Donor</span>`;
    } catch (e) {
        msgDiv.textContent = 'Failed to load donor data.';
        msgDiv.style.color = 'red';
    }
}

function cancelEdit() {
    document.getElementById('donorForm').reset();
    document.getElementById('editDonorId').value = '';
    document.getElementById('submitBtnText').textContent = 'Register Donor';
    document.getElementById('cancelEditBtn').style.display = 'none';
    document.getElementById('message').textContent = '';
    document.getElementById('lastDonation').value = new Date().toISOString().split('T')[0];
    const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
    window.history.pushState({ path: newUrl }, '', newUrl);
}

document.getElementById('donorForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const msgDiv = document.getElementById('message');
    const editId = document.getElementById('editDonorId').value;
    const isEditing = editId !== "";
    
    msgDiv.textContent = isEditing ? 'Updating donor data...' : 'Saving donor data...';
    msgDiv.style.color = '#0056b3';

    const payload = {
        name: document.getElementById('name').value.trim(),
        blood_group: document.getElementById('bloodGroup').value,
        contact: document.getElementById('contact').value.trim(),
        camp_name: document.getElementById('campName').value.trim(),
        location: document.getElementById('location').value.trim(),
        last_donation: document.getElementById('lastDonation').value || null
    };

    try {
        if (isEditing) {
            const { error } = await supabaseClient.from('donors').update(payload).eq('id', editId);
            if (error) throw error;
            
            // Log the edit action
            await supabaseClient.from('activity_logs').insert({ user_id: currentUserId, action_details: `Updated details for Donor: ${payload.name}` });
            
            msgDiv.innerHTML = `Success! Donor updated.`;
        } else {
            payload.entered_by = currentUserId;
            const { error } = await supabaseClient.from('donors').insert(payload);
            if (error) throw error;
            
            // Log the creation action
            await supabaseClient.from('activity_logs').insert({ user_id: currentUserId, action_details: `Registered new Donor: ${payload.name}` });
            
            msgDiv.innerHTML = `Success! Donor registered.`;
        }
        msgDiv.style.color = 'green';
        cancelEdit();
    } catch (error) {
        msgDiv.textContent = 'Error: ' + error.message;
        msgDiv.style.color = 'red';
        if (error.message && error.message.includes('unique constraint')) {
            alert("This contact number is already registered!");
        }
    }
});

function logout() {
    localStorage.clear();
    window.location.href = '../index.html'; 
}
