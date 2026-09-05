const API = 'UPH';
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('role');

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
                const response = await fetch(`${API}?action=getStats&token=${token}`);
                const result = await response.json();

                if (result.status === 'success') {
                    document.getElementById('teamDonorsCount').textContent = result.teamCount;
                } else {
                    document.getElementById('message').textContent = 'Error: ' + result.message;
                }
            } catch (error) {
                document.getElementById('message').textContent = 'Connection error while fetching data.';
            }
        }

        document.getElementById('addUserForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const msgDiv = document.getElementById('message');
            msgDiv.textContent = 'Creating user...';
            msgDiv.style.color = '#0056b3';

            const payload = {
                action: 'addUser',
                token: token,
                userData: {
                    username: document.getElementById('newUsername').value.trim(),
                    password: document.getElementById('newPassword').value,
                    role: document.getElementById('newRole').value
                }
            };

            try {
                const response = await fetch(API, { 
                    method: 'POST', 
                    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                    body: JSON.stringify(payload) 
                });
                const result = await response.json();

                if (result.status === 'success') {
                    msgDiv.textContent = 'User successfully created!';
                    msgDiv.style.color = 'green';
                    document.getElementById('addUserForm').reset();
                } else {
                    msgDiv.textContent = 'Error: ' + result.message;
                    msgDiv.style.color = 'red';
                }
            } catch (error) {
                msgDiv.textContent = 'Connection failed.';
                msgDiv.style.color = 'red';
            }
        });

        function logout() {
            localStorage.clear();
            window.location.href = '../index.html';
        }
