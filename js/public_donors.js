const supabaseUrl = 'https://pkjrqjaavmxhegktwuuk.supabase.co/rest/v1/';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBranJxamFhdm14aGVna3R3dXVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwNzM1MDIsImV4cCI6MjEwNTY0OTUwMn0.TQLtFxYw6pROFdnlnFpZ-B7duqSywnCnEOHtS6T_Xwc';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);



let allDonorsCache = [];
let currentRenderedDonors = [];

window.onload = () => {
    fetchPublicDonors();
};

async function fetchPublicDonors() {
    const msgDiv = document.getElementById('message');
    
    try {
        const response = await fetch(`${API}?action=getPublicDonors`);
        const result = await response.json();

        if (result.status === 'success') {
            msgDiv.style.display = 'none'; 
            allDonorsCache = result.donors || [];
            applyFilters(); 
        } else {
            msgDiv.textContent = 'Error: ' + result.message;
            msgDiv.style.color = 'red';
        }
    } catch (error) {
        msgDiv.textContent = 'Connection error while fetching data.';
        msgDiv.style.color = 'red';
    }
}

function applyFilters() {
    const bgFilter = document.getElementById('filterBloodGroup').value;
    const statusFilter = document.getElementById('filterStatus').value;
    
    let filteredData = allDonorsCache;
    
    if (bgFilter !== 'All') {
        filteredData = filteredData.filter(d => d.bloodGroup === bgFilter);
    }
    if (statusFilter !== 'All') {
        filteredData = filteredData.filter(d => d.status === statusFilter);
    }
    
    currentRenderedDonors = filteredData;
    renderTable(filteredData);
}

function renderTable(donorsArray) {
    const tableBody = document.getElementById('donorTableBody');
    tableBody.innerHTML = '';
    
    if (donorsArray.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No donors found matching criteria.</td></tr>';
        return;
    }

    donorsArray.forEach(donor => {
        // Matched your exact styling and emoji placement
        const statusDisplay = donor.status === 'Active' ? '🟢 Active' : '🩸 Rest';
        const statusColor = donor.status === 'Active' ? '#78B159' : '#DD2E44';

        const row = `<tr>
            <td><strong>${donor.name}</strong></td>
            <td><span class="blood-badge">${donor.bloodGroup}</span></td>
            <td style="color: #666; font-style: italic;">${donor.contact}</td>
            <td>${donor.location}</td>
            <td style="color: ${statusColor}; font-weight: bold;">${statusDisplay}</td>
        </tr>`;
        tableBody.innerHTML += row;
    });
}
