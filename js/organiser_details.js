const API = 'UPH';
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('role');

        window.onload = () => {
            if (!token || role !== 'Master_admin') {
                alert('Unauthorized access. Redirecting to login.');
                window.location.href = '../index.html'; 
                return;
            }

            const urlParams = new URLSearchParams(window.location.search);
            const orgName = urlParams.get('name');

            if (!orgName) {
                document.getElementById('message').textContent = 'Error: No Organiser specified in the URL.';
                document.getElementById('message').style.color = 'red';
                document.getElementById('displayOrgName').textContent = 'Unknown';
            } else {
                document.getElementById('displayOrgName').textContent = orgName;
                fetchOrganiserDonors(orgName);
            }
        };

        async function fetchOrganiserDonors(orgName) {
            const tableBody = document.getElementById('donorTableBody');
            const msgDiv = document.getElementById('message');
            
            try {
                const response = await fetch(`${API}?action=getOrganiserDonors&orgName=${encodeURIComponent(orgName)}&token=${token}`);
                const result = await response.json();

                if (result.status === 'success') {
                    msgDiv.style.display = 'none'; 
                    tableBody.innerHTML = '';
                    
                    if (result.donors.length === 0) {
                        tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center;">No donors found for this team.</td></tr>';
                        return;
                    }

                    result.donors.forEach(donor => {
                        let actionHtml = `<a href="donor.html?id=${donor.id}" class="btn-view">View</a>`;
                        actionHtml += ` <button class="btn-sm btn-edit" style="margin-left: 5px;" onclick="window.location.href='data_entry.html?edit=${donor.id}'">Edit</button>`;

                        // UPDATE: Visual Formatter Logic
                        const statusDisplay = donor.status === 'Active' ? '🟢 Active' : 'Rest 🩸';
                        const statusColor = donor.status === 'Active' ? 'green' : 'orange';

                        const row = `<tr>
                            <td><strong>${donor.name}</strong></td>
                            <td><span class="blood-badge">${donor.bloodGroup}</span></td>
                            <td>${donor.contact}</td>
                            <td>${donor.location}</td>
                            <td>${donor.campName || 'General'}</td>
                            <td style="color: ${statusColor}; font-weight: bold;">
                                ${statusDisplay}
                            </td>
                            <td>${actionHtml}</td>
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

        function logout() {
            localStorage.clear();
            window.location.href = '../index.html';
        }
