// TODO: update this data with actual release notes
// NOTE: types of changes are 'New Feature', 'Improvements', 'Fixes'
export const data = [
    {
        version: "1.1.0",
        date: "2025-07-10",
        changes: [
            {
                id: 1,
                subject: "User Profiles",
                type: "New Feature",
                description:
                    "Added support for users to create, edit, and delete their profiles, including uploading profile pictures."
            },
            {
                id: 2,
                subject: "Dashboard Performance",
                type: "Improvements",
                description: "Optimized dashboard loading times and improved responsiveness on mobile devices."
            },
            {
                id: 3,
                subject: "Session Timeout",
                type: "Fixes",
                description:
                    "Resolved an issue where users were unexpectedly logged out after short periods of inactivity."
            }
        ]
    },
    {
        version: "1.0.1",
        date: "2025-06-18",
        changes: [
            {
                id: 1,
                subject: "Notification System",
                type: "New Feature",
                description: "Implemented in-app notifications for important account and system updates."
            },
            {
                id: 2,
                subject: "Accessibility",
                type: "Improvements",
                description: "Improved color contrast and added keyboard navigation support for main navigation."
            },
            {
                id: 3,
                subject: "Login Redirect",
                type: "Fixes",
                description: "Fixed a bug where users were not redirected to the dashboard after logging in."
            }
        ]
    },
    {
        version: "1.0.0",
        date: "2025-06-01",
        changes: [
            {
                id: 1,
                subject: "Initial Release",
                type: "New Feature",
                description:
                    "Released the first version of the application with user authentication, dashboard, and basic reporting features."
            }
        ]
    }
];
