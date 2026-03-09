const http = require('http');

console.log("Testing Backend Registration, Login, and Complaint Creation...");

const BASE_URL = 'http://localhost:4000/api';

const makeRequest = (path, method, body = null, token = null) => {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 4000,
            path: `/api${path}`,
            method,
            headers: {
                'Content-Type': 'application/json',
            }
        };

        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve(JSON.parse(data || '{}'));
                } else {
                    reject({ status: res.statusCode, error: data });
                }
            });
        });

        req.on('error', reject);

        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
};

async function runTests() {
    try {
        // 1. Generate unique email
        const email = `test.student.${Date.now()}@college.edu`;

        console.log(`\n1️⃣ Testing Registration with ${email}...`);
        const registerResponse = await makeRequest('/auth/register', 'POST', {
            name: "Test Student",
            email: email,
            password: "password123",
            roomNumber: "C-101",
            role: "student"
        });
        console.log("✅ Registration Success:", { id: registerResponse.id, token: registerResponse.token.substring(0, 15) + "..." });

        console.log(`\n2️⃣ Testing Login with ${email}...`);
        const loginResponse = await makeRequest('/auth/login', 'POST', {
            email: email,
            password: "password123"
        });
        console.log("✅ Login Success:", { name: loginResponse.name, role: loginResponse.role });
        const token = loginResponse.token;

        console.log(`\n3️⃣ Testing Protected Endpoint (Get Profile)...`);
        const profileResponse = await makeRequest('/auth/profile', 'GET', null, token);
        console.log("✅ Profile Fetched:", profileResponse.email);

        console.log(`\n4️⃣ Testing Creating a Complaint...`);
        const complaintResponse = await makeRequest('/complaints', 'POST', {
            category: "maintenance",
            title: "Test Complaint via API",
            description: "Just testing if the database and Auth ties together properly."
        }, token);
        console.log("✅ Complaint Created:", complaintResponse.title);

        console.log(`\n5️⃣ Testing Fetching Complaints...`);
        const fetchResponse = await makeRequest('/complaints', 'GET', null, token);
        console.log(`✅ Fetched ${fetchResponse.length} complaints from Database successfully.`);

        console.log("\n🎉 ALL BACKEND TESTS PASSED!");

    } catch (error) {
        console.error("❌ Test Failed:", error);
    }
}

runTests();
