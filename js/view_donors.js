const supabaseUrl = 'https://pkjrqjaavmxhegktwuuk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBranJxamFhdm14aGVna3R3dXVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwNzM1MDIsImV4cCI6MjEwNTY0OTUwMn0.TQLtFxYw6pROFdnlnFpZ-B7duqSywnCnEOHtS6T_Xwc';
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

const token = localStorage.getItem('token');
const role = localStorage.getItem('role');
const currentUserId = localStorage.getItem('userId');

let allDonorsCache = [];
let currentRenderedDonors = [];

window.onload = () => {
    if (!token) {
        alert('Unauthorized access. Redirecting to login.');
        window.location.href = '../index.html'; 
        return;
    }
    fetchDonors();
};

async function fetchDonors() {
    const tableBody = document.getElementById('donorTableBody');
    const msgDiv = document.getElementById('message');
    
    try {
        let query = supabaseClient.from('donors_with_status').select('*').order('name', { ascending: true });
        
        // If Data Entry user, only show their own records (Role Based Access Control)
        if (role === 'Data_entry_user') query = query.eq('entered_by', currentUserId);
        
        const { data, error } = await query;
        if (error) throw error;

        msgDiv.style.display = 'none'; 
        allDonorsCache = data || [];
        applyFilters();
    } catch (error) {
        msgDiv.textContent = 'Connection error while fetching data.';
        msgDiv.style.color = 'red';
    }
}

function applyFilters() {
    const bgFilter = document.getElementById('filterBloodGroup').value;
    const statusFilter = document.getElementById('filterStatus').value;
    
    let filteredData = allDonorsCache;
    
    if (bgFilter !== 'All') filteredData = filteredData.filter(d => d.blood_group === bgFilter);
    if (statusFilter !== 'All') filteredData = filteredData.filter(d => d.status === statusFilter);
    
    currentRenderedDonors = filteredData;
    renderTable(filteredData);
}

function renderTable(donorsArray) {
    const tableBody = document.getElementById('donorTableBody');
    tableBody.innerHTML = '';
    
    if (donorsArray.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No donors found matching criteria.</td></tr>';
        return;
    }

    donorsArray.forEach(donor => {
        let actionsHtml = `<a href="donor.html?id=${donor.id}" class="btn-view">View</a>`;
        
        let canEdit = false;
        if (role === 'Master_admin' || role === 'Organiser_user') canEdit = true;
        else if (role === 'Data_entry_user' && donor.entered_by === currentUserId) canEdit = true;

        if (canEdit) {
            actionsHtml += ` <button class="btn-sm btn-edit" style="margin-left: 5px;" onclick="window.location.href='data_entry.html?edit=${donor.id}'">Edit</button>`;
        }
        
        if (role === 'Master_admin') {
            actionsHtml += ` <button class="btn-sm btn-delete" style="margin-left: 5px;" onclick="deleteDonorRecord('${donor.id}')">Delete</button>`;
        }

        const statusDisplay = donor.status === 'Active' ? '🟢 Active' : '🩸 Rest';
        const statusColor = donor.status === 'Active' ? '#78B159' : '#DD2E44';

        tableBody.innerHTML += `<tr>
            <td><strong>${donor.name}</strong></td>
            <td><span class="blood-badge">${donor.blood_group}</span></td>
            <td>${donor.contact}</td>
            <td>${donor.location}</td>
            <td style="color: ${statusColor}; font-weight: bold;">${statusDisplay}</td>
            <td>${actionsHtml}</td>
        </tr>`;
    });
}

function exportToTxt() {
    if (currentRenderedDonors.length === 0) return alert("No donors to export.");
    let txtContent = "Blood Donors List\n==================\n\n";
    currentRenderedDonors.forEach((donor, index) => {
        txtContent += `${index + 1}. Name : ${donor.name}\n   Blood Group : ${donor.blood_group}\n   Address : ${donor.location}\n   Mobile: ${donor.contact}\n\n`;
    });
    const blob = new Blob([txtContent], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "Donors_List.txt";
    link.click();
}

async function deleteDonorRecord(donorId) {
    if (!confirm("Are you sure you want to delete this donor? This action cannot be undone.")) return;
    document.getElementById('message').style.display = 'block';
    document.getElementById('message').textContent = 'Deleting donor...';
    
    try {
        const { error } = await supabaseClient.from('donors').delete().eq('id', donorId);
        if (error) throw error;
        fetchDonors(); 
    } catch (e) {
        alert('Connection failed while deleting.');
    }
}

function goBack() {
    if (role === 'Master_admin') window.location.href = 'master.html';
    else if (role === 'Organiser_user') window.location.href = 'organiser.html';
    else if (role === 'Data_entry_user') window.location.href = 'data_entry.html';
    else window.location.href = '../index.html';
}

function logout() {
    localStorage.clear();
    window.location.href = '../index.html';
}
