const supabaseUrl = 'https://pkjrqjaavmxhegktwuuk.supabase.co/rest/v1/';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBranJxamFhdm14aGVna3R3dXVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwNzM1MDIsImV4cCI6MjEwNTY0OTUwMn0.TQLtFxYw6pROFdnlnFpZ-B7duqSywnCnEOHtS6T_Xwc';
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);


window.onload = () => localStorage.clear();


document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault(); 
    
    const msgDiv = document.getElementById('message');
    const user = document.getElementById('username').value.trim();
    const pass = document.getElementById('password').value.trim();

    msgDiv.textContent = 'Connecting...';
    msgDiv.style.color = '#ffeb3b';

    try {
        // Query the Supabase 'users' table directly
        const { data, error } = await supabaseClient
            .from('users')
            .select('*')
            .eq('username', user)
            .eq('password', pass)
            .single(); // .single() ensures we only get one matching row back

        // If Supabase returns an error (like no user found), login fails
        if (error || !data) {
            msgDiv.textContent = 'Invalid credentials. Please try again.';
            msgDiv.style.color = '#ff4e4e';
            return;
        }

        // If a user IS found, login succeeds!
        msgDiv.textContent = 'Login successful! Redirecting...';
        msgDiv.style.color = '#4caf50';
        
        // Store user data in browser
        localStorage.setItem('token', data.id); // Using user ID as the local session token
        localStorage.setItem('role', data.role);
        localStorage.setItem('userId', data.id);

        // Redirect based on role
        if (data.role === 'Master_admin') {
            window.location.href = 'fetch/master.html';
        } else if (data.role === 'Organiser_user') {
            window.location.href = 'fetch/organiser.html';
        } else if (data.role === 'Data_entry_user') {
            window.location.href = 'fetch/data_entry.html';
        } else {
            msgDiv.textContent = 'Unknown role assigned.';
            msgDiv.style.color = '#ff4e4e';
        }
        
    } catch (err) {
        msgDiv.textContent = 'Connection failed. Check your network.';
        msgDiv.style.color = '#ff4e4e';
        console.error(err);
    }
});
