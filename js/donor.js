const supabaseUrl = 'https://pkjrqjaavmxhegktwuuk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBranJxamFhdm14aGVna3R3dXVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwNzM1MDIsImV4cCI6MjEwNTY0OTUwMn0.TQLtFxYw6pROFdnlnFpZ-B7duqSywnCnEOHtS6T_Xwc';
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

const token = localStorage.getItem('token');
const role = localStorage.getItem('role');

window.onload = () => {
    if (!token) {
        alert('Unauthorized access. Redirecting to login.');
        window.location.href = '../index.html'; 
        return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const donorId = urlParams.get('id');

    if (!donorId) {
        document.getElementById('message').textContent = 'Error: No Donor ID provided.';
        document.getElementById('message').style.color = 'red';
    } else {
        fetchDonorDetails(donorId);
    }
};

async function fetchDonorDetails(donorId) {
    const msgDiv = document.getElementById('message');
    const card = document.getElementById('profileCard');
    
    try {
        const { data: donor, error } = await supabaseClient
            .from('donors_with_status')
            .select('*')
            .eq('id', donorId)
            .single();

        if (error) throw error;

        msgDiv.style.display = 'none';
        card.style.display = 'block';

        document.getElementById('lblId').textContent = "Hidden (DB UUID)";
        document.getElementById('lblName').textContent = donor.name;
        document.getElementById('lblBloodGroup').textContent = donor.blood_group;
        document.getElementById('lblContact').textContent = donor.contact;
        document.getElementById('lblLocation').textContent = donor.location;
        
        let rawDate = donor.last_donation;
        let displayDate = rawDate ? new Date(rawDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Never';
        document.getElementById('lblLastDonation').textContent = displayDate;
        
        const statusEl = document.getElementById('lblStatus');
        if (donor.status === 'Active') {
            statusEl.innerHTML = '🟢 Active';
            statusEl.style.color = 'green';
            statusEl.style.fontWeight = 'bold';
        } else {
            statusEl.innerHTML = '🩸 Rest';
            statusEl.style.color = 'orange';
            statusEl.style.fontWeight = 'bold';
        }
    } catch (error) {
        msgDiv.textContent = 'Connection error while fetching donor profile.';
        msgDiv.style.color = 'red';
    }
}

function goBack() {
    if (role === 'Organiser_user') window.location.href = 'organiser.html';
    else if (role === 'Data_entry_user') window.location.href = 'data_entry.html';
    else window.history.back(); 
}
