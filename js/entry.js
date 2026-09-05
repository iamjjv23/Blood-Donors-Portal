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

            const today = new Date().toISOString().split('T')[0];
            document.getElementById('lastDonation').value = today;

            fetchInitialData();

            // Handle "Edit" button click from Tables
            const urlParams = new URLSearchParams(window.location.search);
            const editId = urlParams.get('edit');
            if (editId) {
                const msgDiv = document.getElementById('message');
                msgDiv.textContent = 'Loading donor data...';
                msgDiv.style.color = '#0056b3';
                
                fetch(`${API}?action=getDonor&id=${editId}&token=${token}`)
                    .then(res => res.json())
                    .then(result => {
                        if (result.status === 'success') {
                            msgDiv.textContent = '';
                            populateFormForEdit(result.donor);
                        } else {
                            msgDiv.textContent = 'Failed to load donor data for editing.';
                            msgDiv.style.color = 'red';
                        }
                    }).catch(err => {
                        msgDiv.textContent = 'Connection error.';
                        msgDiv.style.color = 'red';
                    });
            }
        };

        async function fetchInitialData() {
            fetch(`${API}?action=getFormConfig&token=${token}`)
                .then(res => res.json())
                .then(result => {
                    if (result.status === 'success') {
                        const campSelect = document.getElementById('campName');
                        campSelect.innerHTML = ''; 
                        result.camps.forEach(camp => {
                            const opt = document.createElement('option');
                            opt.value = camp; opt.textContent = camp;
                            campSelect.appendChild(opt);
                        });
                        if (result.defaultCamp && result.camps.includes(result.defaultCamp)) {
                            campSelect.value = result.defaultCamp;
                        }
                    }
                }).catch(err => console.error("Error loading camps", err));
        }

        function populateFormForEdit(donor) {
            let canEdit = false;
            if (role === 'Master_admin' || role === 'Organiser_user') canEdit = true;
            else if (role === 'Data_entry_user' && donor.enteredBy === currentUserId) canEdit = true;

            if (!canEdit) {
                alert("You don't have permission to edit this record. Redirecting to view profile.");
                window.location.href = `donor.html?id=${donor.id}`;
                return;
            }

            document.getElementById('editDonorId').value = donor.id;
            document.getElementById('name').value = donor.name;
            document.getElementById('bloodGroup').value = donor.bloodGroup;
            document.getElementById('contact').value = donor.contact;
            
            const campSelect = document.getElementById('campName');
            let campExists = false;
            for(let i=0; i<campSelect.options.length; i++) {
                if(campSelect.options[i].value === donor.campName) campExists = true;
            }
            if(!campExists && donor.campName) {
                campSelect.innerHTML += `<option value="${donor.campName}">${donor.campName}</option>`;
            }
            campSelect.value = donor.campName;
            
            document.getElementById('location').value = donor.location;

            let dDate = donor.lastDonation;
            if (dDate && dDate !== 'Never' && dDate.includes('T')) {
                dDate = new Date(dDate).toISOString().split('T')[0];
            } else {
                dDate = new Date().toISOString().split('T')[0];
            }
            document.getElementById('lastDonation').value = dDate;

            document.getElementById('submitBtnText').textContent = 'Update Donor Details';
            document.getElementById('cancelEditBtn').style.display = 'block';
            document.getElementById('message').innerHTML = `<span style="color:orange;">Editing Donor: ${donor.id}</span>`;
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        function cancelEdit() {
            document.getElementById('donorForm').reset();
            document.getElementById('editDonorId').value = '';
            document.getElementById('submitBtnText').textContent = 'Register Donor';
            document.getElementById('cancelEditBtn').style.display = 'none';
            document.getElementById('message').textContent = '';
            document.getElementById('lastDonation').value = new Date().toISOString().split('T')[0];
            
            const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
            window.history.pushState({path:newUrl},'',newUrl);
        }

        document.getElementById('donorForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const msgDiv = document.getElementById('message');
            
            const editId = document.getElementById('editDonorId').value;
            const isEditing = editId !== "";
            
            msgDiv.textContent = isEditing ? 'Updating donor data...' : 'Saving donor data...';
            msgDiv.style.color = '#0056b3';

            const payload = {
                action: isEditing ? 'editDonor' : 'addDonor', 
                token: token,
                donorData: {
                    name: document.getElementById('name').value.trim(),
                    bloodGroup: document.getElementById('bloodGroup').value,
                    contact: document.getElementById('contact').value.trim(),
                    campName: document.getElementById('campName').value.trim(),
                    location: document.getElementById('location').value.trim(),
                    lastDonation: document.getElementById('lastDonation').value || 'Never'
                }
            };
            
            if (isEditing) payload.donorId = editId;

            try {
                const response = await fetch(API, { 
                    method: 'POST', 
                    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                    body: JSON.stringify(payload) 
                });
                const result = await response.json();

                if (result.status === 'success') {
                    msgDiv.innerHTML = isEditing ? `Success! Donor <strong>${editId}</strong> updated.` : `Success! Donor registered with ID: <strong>${result.id}</strong>`;
                    msgDiv.style.color = 'green';
                    
                    cancelEdit(); 
                } else {
                    msgDiv.textContent = 'Error: ' + result.message;
                    msgDiv.style.color = 'red';
                    // NEW: Duplicate Contact Alert Popup
                    if (result.message.toLowerCase().includes('contact number')) {
                        alert(result.message);
                    }
                }
            } catch (error) {
                msgDiv.textContent = 'Connection failed. Check your network.';
                msgDiv.style.color = 'red';
            }
        });

        function logout() {
            localStorage.clear();
            window.location.href = '../index.html'; 
        }
