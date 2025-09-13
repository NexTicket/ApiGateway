import admin from 'firebase-admin';
import path from 'path';

class FirebaseConfig {
    constructor() {
        this.admin = null;
        this.initialized = false;
    }

    /**
     * Initialize Firebase Admin SDK
     * @param {Object} options - Configuration options
     * @param {string} options.serviceAccountPath - Path to service account key file
     * @param {Object} options.serviceAccountObject - Service account object (alternative to file path)
     * @param {string} options.projectId - Firebase project ID
     */
    initialize(options = {}) {
        if (this.initialized) {
            console.log('Firebase Admin SDK already initialized');
            return this.admin;
        }

        try {
            let credential;

            // Try to use service account file path first
            if (options.serviceAccountPath) {
                const serviceAccountPath = path.resolve(options.serviceAccountPath);
                credential = admin.credential.cert(serviceAccountPath);
            } 
            // Use service account object if provided
            else if (options.serviceAccountObject) {
                credential = admin.credential.cert(options.serviceAccountObject);
            }
            // Use environment variable for service account
            else if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
                const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
                credential = admin.credential.cert(serviceAccount);
            }
            // Use default credentials (for deployed environments)
            else {
                credential = admin.credential.applicationDefault();
            }

            this.admin = admin.initializeApp({
                credential: credential,
                projectId: options.projectId || process.env.FIREBASE_PROJECT_ID
            });

            this.initialized = true;
            console.log('Firebase Admin SDK initialized successfully');
            return this.admin;

        } catch (error) {
            console.error('Failed to initialize Firebase Admin SDK:', error.message);
            throw new Error(`Firebase initialization failed: ${error.message}`);
        }
    }

    /**
     * Get Firebase Admin instance
     * @returns {admin.app.App} Firebase admin instance
     */
    getAdmin() {
        if (!this.initialized) {
            throw new Error('Firebase Admin SDK not initialized. Call initialize() first.');
        }
        return this.admin;
    }

    /**
     * Verify Firebase ID token
     * @param {string} idToken - Firebase ID token
     * @returns {Promise<admin.auth.DecodedIdToken>} Decoded token
     */
    async verifyIdToken(idToken) {
        if (!this.initialized) {
            throw new Error('Firebase Admin SDK not initialized');
        }

        try {
            const decodedToken = await this.admin.auth().verifyIdToken(idToken);
            return decodedToken;
        } catch (error) {
            throw new Error(`Token verification failed: ${error.message}`);
        }
    }

    /**
     * Get user by UID
     * @param {string} uid - User UID
     * @returns {Promise<admin.auth.UserRecord>} User record
     */
    async getUserByUid(uid) {
        if (!this.initialized) {
            throw new Error('Firebase Admin SDK not initialized');
        }

        try {
            const userRecord = await this.admin.auth().getUser(uid);
            return userRecord;
        } catch (error) {
            throw new Error(`Failed to get user: ${error.message}`);
        }
    }

    /**
     * Set custom user claims (roles)
     * @param {string} uid - User UID
     * @param {Object} customClaims - Custom claims object
     * @returns {Promise<void>}
     */
    async setCustomUserClaims(uid, customClaims) {
        if (!this.initialized) {
            throw new Error('Firebase Admin SDK not initialized');
        }

        try {
            await this.admin.auth().setCustomUserClaims(uid, customClaims);
        } catch (error) {
            throw new Error(`Failed to set custom claims: ${error.message}`);
        }
    }
}

// Export singleton instance
const firebaseConfig = new FirebaseConfig();
export default firebaseConfig;