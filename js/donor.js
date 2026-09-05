const API = 'UPH';
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
                document.getElementById('message').textContent = 'Error: No Donor ID provided in the URL.';
                document.getElementById('message').style.color = 'red';
            } else {
                fetchDonorDetails(donorId);
            }
        };

        async function fetchDonorDetails(donorId) {
            const msgDiv = document.getElementById('message');
            const card = document.getElementById('profileCard');
            
            try {
                const response = await fetch(`${API}?action=getDonor&id=${donorId}&token=${token}`);
                const result = await response.json();

                if (result.status === 'success') {
                    msgDiv.style.display = 'none';
                    card.style.display = 'block';

                    document.getElementById('lblId').textContent = result.donor.id;
                    document.getElementById('lblName').textContent = result.donor.name;
                    document.getElementById('lblBloodGroup').textContent = result.donor.bloodGroup;
                    document.getElementById('lblContact').textContent = result.donor.contact;
                    document.getElementById('lblLocation').textContent = result.donor.location;
                    
                    let rawDate = result.donor.lastDonation;
                    let displayDate = rawDate;
                    
                    if (rawDate && rawDate !== 'Never' && rawDate.includes('T')) {
                        const dateObj = new Date(rawDate);
                        displayDate = dateObj.toLocaleDateString('en-GB', { 
                            day: 'numeric', month: 'short', year: 'numeric' 
                        });
                    }
                    
                    document.getElementById('lblLastDonation').textContent = displayDate;
                    
                    const statusEl = document.getElementById('lblStatus');
                    // UPDATE: Visual Formatter applied to Profile
                    if (result.donor.status === 'Active') {
                        statusEl.innerHTML = '🟢 Active';
                        statusEl.style.color = 'green';
                        statusEl.style.fontWeight = 'bold';
                    } else {
                        statusEl.innerHTML = 'Rest 🩸';
                        statusEl.style.color = 'orange';
                        statusEl.style.fontWeight = 'bold';
                    }
                } else {
                    msgDiv.textContent = 'Error: ' + result.message;
                    msgDiv.style.color = 'red';
                }
            } catch (error) {
                msgDiv.textContent = 'Connection error while fetching donor profile.';
                msgDiv.style.color = 'red';
                console.error(error);
            }
        }

        function goBack() {
            if (role === 'Organiser_user') {
                window.location.href = 'organiser.html';
            } else if (role === 'Data_entry_user') {
                window.location.href = 'data_entry.html';
            } else {
                window.history.back(); 
            }
        }
