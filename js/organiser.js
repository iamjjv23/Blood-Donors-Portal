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

function showSection(sectionId, clickedBtn) {
    document.querySelectorAll('.section').forEach(sec => sec.classList.remove('active'));
    document.getElementById(sectionId).classList.add('active');
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active-tab'));
    clickedBtn.classList.add('active-tab');
    document.getElementById('message').textContent = '';
}

async function fetchDonorCount() {
    try {
        // Find all Data Entry users under this Organiser
        const { data: myUsers } = await supabaseClient.from('users').select('id').eq('created_by', currentUserId);
        const myUserIds = (myUsers || []).map(u => u.id);
        myUserIds.push(currentUserId); // Include Organiser's own entries

        // Count donors entered by this team
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

document.getElementById('addUserForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const msgDiv = document.getElementById('message');
    msgDiv.textContent = 'Creating user...';
    msgDiv.style.color = '#0056b3';

    try {
        const { error } = await supabaseClient.from('users').insert({
            username: document.getElementById('newUsername').value.trim(),
            password: document.getElementById('newPassword').value,
            role: document.getElementById('newRole').value,
            created_by: currentUserId
        });

        if (error) throw error;

        msgDiv.textContent = 'User successfully created!';
        msgDiv.style.color = 'green';
        document.getElementById('addUserForm').reset();
    } catch (error) {
        msgDiv.textContent = 'Username already exists or connection failed.';
        msgDiv.style.color = 'red';
    }
});

function logout() {
    localStorage.clear();
    window.location.href = '../index.html';
}
