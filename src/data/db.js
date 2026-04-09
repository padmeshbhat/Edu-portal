/**
 * EduPortal Simulated DB
 * Uses localStorage to store "collections".
 * Uses window 'storage' event to simulate real-time listeners (onSnapshot).
 */

const DB_PREFIX = 'eduportal_';

export const db = {
    /**
     * Get all documents in a collection
     */
    getCollection: (name) => {
        const data = localStorage.getItem(DB_PREFIX + name);
        return data ? JSON.parse(data) : [];
    },

    /**
     * Save/Overwrite the whole collection
     */
    saveCollection: (name, data) => {
        localStorage.setItem(DB_PREFIX + name, JSON.stringify(data));
        // Manual dispatch for same-tab updates
        window.dispatchEvent(new Event('storage_manual'));
    },

    /**
     * Add a single document
     */
    addDoc: (collectionName, doc) => {
        const data = db.getCollection(collectionName);
        const newDoc = { 
            id: doc.id || Math.random().toString(36).substr(2, 9),
            createdAt: new Date().toISOString(),
            ...doc 
        };
        data.push(newDoc);
        db.saveCollection(collectionName, data);
        return newDoc;
    },

    /**
     * Update a document by field (usually id)
     */
    updateDoc: (collectionName, id, updates) => {
        const data = db.getCollection(collectionName);
        const idx = data.findIndex(d => d.id === id || d.uid === id);
        if (idx !== -1) {
            data[idx] = { ...data[idx], ...updates, updatedAt: new Date().toISOString() };
            db.saveCollection(collectionName, data);
            return true;
        }
        return false;
    },

    /**
     * Real-time listener simulation
     */
    onSnapshot: (collectionName, callback) => {
        // Initial fetch
        callback(db.getCollection(collectionName));

        // Listener for cross-tab (standard 'storage' event)
        const storageHandler = (e) => {
            if (e.key === DB_PREFIX + collectionName || !e.key) {
                callback(db.getCollection(collectionName));
            }
        };

        // Listener for same-tab (custom manual event)
        const manualHandler = () => {
            callback(db.getCollection(collectionName));
        };

        window.addEventListener('storage', storageHandler);
        window.addEventListener('storage_manual', manualHandler);

        // Return unsubscribe function
        return () => {
            window.removeEventListener('storage', storageHandler);
            window.removeEventListener('storage_manual', manualHandler);
        };
    }
};

window.eduDB = db;
