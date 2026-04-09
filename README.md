# EduPortal - Career Mentorship Ecosystem

EduPortal is an end-to-end frontend prototype designed to connect students with industry mentors based on their desired learning tracks. It features two distinct pathways (Student and Mentor), dynamic multi-step profile creation forms, and highly interactive dashboards. 

## 🌟 Features

*   **Distinct Portals:** Seamlessly switch between Student and Mentor workflows.
*   **Modern "Luminous Ether" Aesthetic:** A custom, premium design system featuring glassmorphism surfaces, subtle glow effects, floating interactive components, and smooth micro-animations.
*   **Dual Dashboards:** 
    *   **Student Dashboard:** Find mentors, track session applications, join classes, and access shared resources.
    *   **Mentor Dashboard:** Match with student requests, review mentee profiles, arrange class sessions, and manage shared resource feeds.
*   **Dynamic Onboarding:** Multi-step profile workflows that adapt actively to chosen tracks (Technical vs Non-Technical).
*   **Client-Side Persistence:** Uses `localStorage` to simulate an authenticated session state and cross-page data passing.

## 🛠 Tech Stack

*   **HTML5:** Semantic structure.
*   **Vanilla CSS:** Flexbox/Grid layouts, custom variables, complex keyframes, and glassmorphism styling.
*   **Vanilla JavaScript (ES6+):** Module-free script structure with direct DOM manipulation, simulated state management, and particle animations.

## 🚀 Running the Project

This project leverages native ES Modules and `fetch` (if expanded later), so it is best viewed via a local web server to avoid CORS issues and ensure seamless file references.

### Option 1: Using Node.js (http-server)

1.  Make sure you have [Node.js](https://nodejs.org/) installed.
2.  Install `http-server` globally if you haven't already:
    ```bash
    npm install -g http-server
    ```
3.  Navigate to the project directory:
    ```bash
    cd path/to/eduportal
    ```
4.  Start the server:
    ```bash
    http-server -c-1 -p 8080
    ```
5.  Open your browser and navigate to: `http://localhost:8080`

### Option 2: VS Code Live Server
If you use Visual Studio Code, you can install the **Live Server** extension by Ritwick Dey. Simply right-click on `index.html` and select **"Open with Live Server"**.

## 🔄 The User Journey

1.  **Authentication (`index.html`)**: The user starts here.
    *   If they create a new account, they select their role (Student/Mentor).
    *   They are directed to their respective profile creation pages.
2.  **Profile Generation (`student-profile.html` / `mentor-profile.html`)**: 
    *   Dynamic forms that adapt to their specific background (technical vs non-technical).
    *   Upon completion, data is persisted to `localStorage` and they proceed to the dashboard.
3.  **Dashboards (`student-dashboard.html` / `mentor-dashboard.html`)**:
    *   The respective dashboards load. Because state is guarded, attempting to hit a dashboard URL directly without "logging in" will bounce the user back to the index.
    *   On the dashboards, data entered during the profile stage is actively fetched and displayed directly within the interface (e.g., matching the Student's learning track).

## 📝 Important Notes for Developers
- **Security Warning:** The current "authentication" is a pure frontend simulation relying solely on `localStorage`. It is entirely insecure and meant exclusively as a functional UI/UX demo. **Do not use this pattern for real user data.**
- To cleanly restart workflows for testing, use the **Logout** button found at the bottom of the sidebar navigation in either dashboard. This will wipe the session tokens.

---
*Built with ❤️ for the future of mentorship.*
