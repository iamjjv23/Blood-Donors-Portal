const API = 'UPH';
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('role');
        const currentUserId = localStorage.getItem('userId');

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
                const response = await fetch(`${API}?action=getAllDonors&token=${token}`);
                const result = await response.json();

                if (result.status === 'success') {
                    msgDiv.style.display = 'none'; 
                    tableBody.innerHTML = '';
                    
                    if (result.donors.length === 0) {
                        tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No donors found in the database.</td></tr>';
                        return;
                    }

                    result.donors.forEach(donor => {
                        let actionsHtml = `<a href="donor.html?id=${donor.id}" class="btn-view">View</a>`;
                        
                        let canEdit = false;
                        if (role === 'Master_admin' || role === 'Organiser_user') canEdit = true;
                        else if (role === 'Data_entry_user' && donor.enteredBy === currentUserId) canEdit = true;

                        if (canEdit) {
                            actionsHtml += ` <button class="btn-sm btn-edit" style="margin-left: 5px;" onclick="window.location.href='data_entry.html?edit=${donor.id}'">Edit</button>`;
                        }
                        
                        if (role === 'Master_admin') {
                            actionsHtml += ` <button class="btn-sm btn-delete" style="margin-left: 5px;" onclick="deleteDonorRecord('${donor.id}')">Delete</button>`;
                        }

                        // UPDATE: Visual Formatter Logic for Tables
                        const statusDisplay = donor.status === 'Active' ? '🟢 Active' : 'Rest 🩸';
                        const statusColor = donor.status === 'Active' ? '#78B159' : '#DD2E44';

                        const row = `<tr>
                            <td><strong>${donor.name}</strong></td>
                            <td><span class="blood-badge">${donor.bloodGroup}</span></td>
                            <td>${donor.contact}</td>
                            <td>${donor.location}</td>
                            <td style="color: ${statusColor}; font-weight: bold;">
                                ${statusDisplay}
                            </td>
                            <td>${actionsHtml}</td>
                        </tr>`;
                        tableBody.innerHTML += row;
                    });
                } else {
                    msgDiv.textContent = 'Error: ' + result.message;
                    msgDiv.style.color = 'red';
                }
            } catch (error) {
                msgDiv.textContent = 'Connection error while fetching data.';
                msgDiv.style.color = 'red';
            }
        }

        async function deleteDonorRecord(donorId) {
            if(!confirm("Are you sure you want to delete this donor? This action cannot be undone.")) return;
            
            const msgDiv = document.getElementById('message');
            msgDiv.style.display = 'block';
            msgDiv.textContent = 'Deleting donor...';
            
            const payload = { action: 'deleteDonorRecord', token: token, donorId: donorId };
            
            try {
                const response = await fetch(API, { 
                    method: 'POST', 
                    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                    body: JSON.stringify(payload) 
                });
                const result = await response.json();
                
                if(result.status === 'success') {
                    fetchDonors(); 
                } else {
                    alert('Error: ' + result.message);
                }
            } catch(e) {
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
