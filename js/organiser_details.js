const supabaseUrl = 'https://pkjrqjaavmxhegktwuuk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBranJxamFhdm14aGVna3R3dXVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwNzM1MDIsImV4cCI6MjEwNTY0OTUwMn0.TQLtFxYw6pROFdnlnFpZ-B7duqSywnCnEOHtS6T_Xwc';
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

const token = localStorage.getItem('token');
const role = localStorage.getItem('role');

window.onload = () => {
    if (!token || role !== 'Master_admin') {
        alert('Unauthorized access.');
        window.location.href = '../index.html'; 
        return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const orgId = urlParams.get('orgId'); // Changed from name to ID for precision
    const orgName = urlParams.get('name');

    if (!orgId) {
        document.getElementById('message').textContent = 'Error: No Organiser specified.';
        document.getElementById('message').style.color = 'red';
    } else {
        document.getElementById('displayOrgName').textContent = orgName || 'Unknown';
        fetchOrganiserDonors(orgId);
    }
};

async function fetchOrganiserDonors(orgId) {
    const tableBody = document.getElementById('donorTableBody');
    const msgDiv = document.getElementById('message');
    
    try {
        const { data: myUsers } = await supabaseClient.from('users').select('id').eq('created_by', orgId);
        const myUserIds = (myUsers || []).map(u => u.id);
        myUserIds.push(orgId); 

        const { data: donors, error } = await supabaseClient
            .from('donors_with_status')
            .select('*')
            .in('entered_by', myUserIds);

        if (error) throw error;

        msgDiv.style.display = 'none'; 
        tableBody.innerHTML = '';
        
        if (!donors || donors.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center;">No donors found for this team.</td></tr>';
            return;
        }

        donors.forEach(donor => {
            let actionHtml = `<a href="donor.html?id=${donor.id}" class="btn-view">View</a>`;
            actionHtml += ` <button class="btn-sm btn-edit" style="margin-left: 5px;" onclick="window.location.href='data_entry.html?edit=${donor.id}'">Edit</button>`;

            const statusDisplay = donor.status === 'Active' ? '🟢 Active' : '🩸 Rest';
            const statusColor = donor.status === 'Active' ? 'green' : 'orange';

            tableBody.innerHTML += `<tr>
                <td><strong>${donor.name}</strong></td>
                <td><span class="blood-badge">${donor.blood_group}</span></td>
                <td>${donor.contact}</td>
                <td>${donor.location}</td>
                <td>${donor.camp_name || 'General'}</td>
                <td style="color: ${statusColor}; font-weight: bold;">${statusDisplay}</td>
                <td>${actionHtml}</td>
            </tr>`;
        });
    } catch (error) {
        msgDiv.textContent = 'Connection error while fetching data.';
        msgDiv.style.color = 'red';
    }
}

function logout() {
    localStorage.clear();
    window.location.href = '../index.html';
}
