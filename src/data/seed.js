/**
 * EduPortal Data Seeder (Firebase Firestore)
 * Populates Firestore with demo mentors and students if collections are empty.
 */

import { DEMO_MENTORS } from './demoMentors.js';
import { DEMO_STUDENTS } from './demoStudents.js';

export async function seedDatabase() {
    if (!window.eduDB) return;

    // Check if seeding is needed by checking a marker in localStorage 
    // (We use localStorage for the "seeded" flag to avoid API calls every reload)
    if (localStorage.getItem('eduportal_seeded_fs') === 'true') return;

    console.log('🌱 Seeding Firestore with demo data...');

    try {
        // Seed Mentors
        for (const mentor of DEMO_MENTORS) {
            await window.eduDB.addDoc('mentors', {
                ...mentor,
                type: 'mentor',
                isDemo: true
            });
        }

        // Seed Students
        for (const student of DEMO_STUDENTS) {
            await window.eduDB.addDoc('students', {
                ...student,
                type: 'student',
                isDemo: true
            });
        }

        localStorage.setItem('eduportal_seeded_fs', 'true');
        console.log('✅ Seeding complete.');
    } catch (e) {
        console.error('❌ Seeding failed:', e);
    }
}

// Start seeding process
seedDatabase();
