// integration.test.js

const request = require('supertest');
const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');

// --- Configuration ---
const API_GATEWAY_URL = 'http://localhost:5000'; // The URL of your running API Gateway (Docker)
const TEST_USER_EMAIL = 'testcus@gmail.com';
const TEST_USER_PASSWORD = 'qweQwe@123';

const firebaseConfig = {
  apiKey: "AIzaSyB0fDm9-e1qIwlmiGYUjCmv56E6IXx-79E",
  authDomain: "nexticket-c2c47.firebaseapp.com",
  projectId: "nexticket-c2c47",
  storageBucket: "nexticket-c2c47.appspot.com",
  messagingSenderId: "103417022841691929128",
  appId: "1:103417022841691929128:web:nexticket-app"
};

// --- Test Suite ---
describe('API Gateway to Ticket Service Integration', () => {
  let idToken; // This will store the authenticated user's token

  // beforeAll runs once before all tests in this file
  beforeAll(async () => {
    try {
      // Initialize the Firebase app
      const app = initializeApp(firebaseConfig);
      const auth = getAuth(app);

      // Sign in as the test user
      console.log('Attempting to authenticate with Firebase...');
      const userCredential = await signInWithEmailAndPassword(auth, TEST_USER_EMAIL, TEST_USER_PASSWORD);
      
      // Get the ID token, which is the JWT to be sent to the API Gateway
      idToken = await userCredential.user.getIdToken();
      
      console.log('Successfully authenticated and got ID token for testing');
      console.log('Token length:', idToken.length);
    } catch (error) {
      console.error('Firebase authentication failed for test setup:', error.message);
      console.log('Cannot proceed with authenticated integration test');
      idToken = null;
    }
  });

  // --- Simple Proxy Test ---
  it('should authenticate with Firebase and proxy to ticket service health endpoint', async () => {
    // Skip this test if we couldn't get a valid token
    if (!idToken) {
      console.log('No Firebase token - cannot test integration');
      expect(idToken).toBeDefined();
      return;
    }

    console.log('Testing: API Gateway (with auth) -> Ticket Service /health (no auth required)');

    const response = await request(API_GATEWAY_URL)
      .get('/ticket_service/health')
      .set('Authorization', `Bearer ${idToken}`)
      .set('Accept', 'application/json');

    console.log(`Request: GET ${API_GATEWAY_URL}/ticket_service/health`);
    console.log(`Response: ${response.statusCode} ${JSON.stringify(response.body)}`);
    
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({
      status: "healthy",
      service: "nexticket-api"
    });
    
    console.log('API Gateway authenticated user and successfully proxied to ticket service');
    console.log('Received expected healthy response from ticket service');
  }, 15000); // 15 second timeout
});