const axios = require('axios');

const API_BASE_URL = 'http://localhost:8001';

async function testRegistration() {
    try {
        console.log('Testing user registration...');
        
        const response = await axios.post(`${API_BASE_URL}/auth/registration`, {
            username: 'testuser',
            email: 'test@example.com',
            password: 'password123'
        });
        
        console.log('✅ Registration successful:', response.data);
        
        // Проверяем, что пользователю назначена роль "user"
        if (response.data.user && response.data.user.role) {
            console.log(`✅ User role assigned: ${response.data.user.role.name}`);
        } else {
            console.log('⚠️  User role not found in response');
        }
        
        return response.data.user;
    } catch (error) {
        console.error('❌ Registration failed:', error.response?.data || error.message);
        return null;
    }
}

async function testUsersList() {
    try {
        console.log('\nTesting users list...');
        
        const response = await axios.get(`${API_BASE_URL}/api/user/`);
        
        console.log('✅ Users list:', response.data);
        return response.data;
    } catch (error) {
        console.error('❌ Users list failed:', error.response?.data || error.message);
        return null;
    }
}

async function testUsersWithRoles() {
    try {
        console.log('\nTesting users with roles...');
        
        const response = await axios.get(`${API_BASE_URL}/api/user/with-roles`);
        
        console.log('✅ Users with roles:', response.data);
        return response.data;
    } catch (error) {
        console.error('❌ Users with roles failed:', error.response?.data || error.message);
        return null;
    }
}

async function runTest() {
    console.log('Starting simple API test...\n');
    
    // Тестируем регистрацию
    const user = await testRegistration();
    
    if (user) {
        // Тестируем список пользователей
        await testUsersList();
        
        // Тестируем пользователей с ролями
        await testUsersWithRoles();
    }
    
    console.log('\nTest completed!');
}

runTest().catch(console.error);
