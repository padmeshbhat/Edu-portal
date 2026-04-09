import { DEMO_MENTORS } from './demoMentors.js';
import { DEMO_STUDENTS } from './demoStudents.js';

function seedDemoStudents() {
    let existingStudents = [];
    try {
        const stored = localStorage.getItem('eduportal_students');
        if (stored) {
            existingStudents = JSON.parse(stored);
        }
    } catch (e) {
        console.error("Error reading students from local storage", e);
    }

    let modified = false;

    DEMO_STUDENTS.forEach(demoStudent => {
        const exists = existingStudents.some(s => s.id === demoStudent.id || s.uid === demoStudent.id);
        if (!exists) {
            existingStudents.push({
                ...demoStudent,
                uid: demoStudent.id,
                createdAt: new Date().toISOString()
            });
            modified = true;
        }
    });

    if (modified) {
        localStorage.setItem('eduportal_students', JSON.stringify(existingStudents));
    }
}

function seedDemoMentors() {
    let existingMentors = [];
    try {
        const stored = localStorage.getItem('eduportal_mentors');
        if (stored) {
            existingMentors = JSON.parse(stored);
        }
    } catch (e) {
        console.error("Error reading mentors from local storage", e);
    }

    let modified = false;

    DEMO_MENTORS.forEach(demoMentor => {
        const exists = existingMentors.some(m => m.id === demoMentor.id || m.uid === demoMentor.id);
        if (!exists) {
            existingMentors.push({
                ...demoMentor,
                uid: demoMentor.id,
                createdAt: new Date().toISOString()
            });
            modified = true;
        }
    });

    if (modified) {
        localStorage.setItem('eduportal_mentors', JSON.stringify(existingMentors));
    }
}

// Ensure eduDB exists before seeding if possible, or just seed directly to localStorage
// Since this is a module, we can wait a tick or just rely on localStorage which db.js also uses.
seedDemoMentors();
seedDemoStudents();
