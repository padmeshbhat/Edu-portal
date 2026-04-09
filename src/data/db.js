/**
 * EduPortal Real-Time DB (Firebase Firestore)
 * Replaces simulated localStorage logic with a production-ready real-time backend.
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { 
    getFirestore, collection, addDoc, updateDoc, doc, onSnapshot, query, orderBy, getDocs 
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import firebaseConfig from "./firebase-config.js";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db_fs = getFirestore(app);

export const db = {
    /**
     * Add a single document
     */
    addDoc: async (collectionName, data) => {
        try {
            const docRef = await addDoc(collection(db_fs, collectionName), {
                ...data,
                createdAt: new Date().toISOString()
            });
            return { id: docRef.id, ...data };
        } catch (e) {
            console.error("Error adding document: ", e);
            throw e;
        }
    },

    /**
     * Update a document by ID
     */
    updateDoc: async (collectionName, id, updates) => {
        try {
            const docRef = doc(db_fs, collectionName, id);
            await updateDoc(docRef, {
                ...updates,
                updatedAt: new Date().toISOString()
            });
            return true;
        } catch (e) {
            console.error("Error updating document: ", e);
            return false;
        }
    },

    /**
     * Real-time listener
     */
    onSnapshot: (collectionName, callback) => {
        const q = query(collection(db_fs, collectionName), orderBy("createdAt", "desc"));
        
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const docs = [];
            querySnapshot.forEach((doc) => {
                docs.push({ id: doc.id, ...doc.data() });
            });
            callback(docs);
        });

        return unsubscribe;
    }
};

window.eduDB = db;
