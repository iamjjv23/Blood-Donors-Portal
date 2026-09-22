const supabaseUrl = 'https://pkjrqjaavmxhegktwuuk.supabase.co/rest/v1/';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBranJxamFhdm14aGVna3R3dXVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwNzM1MDIsImV4cCI6MjEwNTY0OTUwMn0.TQLtFxYw6pROFdnlnFpZ-B7duqSywnCnEOHtS6T_Xwc';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);


  
        window.onload = () => localStorage.clear();

        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault(); // Prevents the page from refreshing
            
            const msgDiv = document.getElementById('message');
            const user = document.getElementById('username').value.trim();
            const pass = document.getElementById('password').value.trim();

            // UPDATED: Now shows "Connecting..." immediately upon click
            msgDiv.textContent = 'Connecting...';
            // msgDiv.style.color = '#ffeb3b'; High visibility on dark overlay

            const payload = { action: 'login', username: user, password: pass };

            try {
                const response = await fetch(API, {
                    method: 'POST',
                    headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // REQUIRED for Apps Script
                    body: JSON.stringify(payload)
                });
                
                const result = await response.json();

                // UPDATES THE STATUS AFTER CONNECTION IS COMPLETE
                if (result.status === 'success') {
                    msgDiv.textContent = 'Login successful! Redirecting...';
                    msgDiv.style.color = '#4caf50';
                    
                    localStorage.setItem('token', result.token);
                    localStorage.setItem('role', result.role);
                    localStorage.setItem('userId', result.userId);

                    if (result.role === 'Master_admin') {
                        window.location.href = 'fetch/master.html';
                    } else if (result.role === 'Organiser_user') {
                        window.location.href = 'fetch/organiser.html';
                    } else if (result.role === 'Data_entry_user') {
                        window.location.href = 'fetch/data_entry.html';
                    } else {
                        msgDiv.textContent = 'Unknown role assigned.';
                        msgDiv.style.color = '#ff4e4e';
                    }
                } else {
                    msgDiv.textContent = 'Invalid credentials. Please try again.';
                    //msgDiv.style.color = '#ff4e4e';
                }
            } catch (error) {
                msgDiv.textContent = 'Connection failed. Check your network or Web App URL.';
                msgDiv.style.color = '#ff4e4e';
                console.error(error);
            }
        });
