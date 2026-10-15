// Single source of truth for the Home route tree's path segments, so index.jsx's actual
// routes and NavMenu.jsx's "is this a Home child route" check can't silently drift apart.

export const HOME_RELATIVE_PATHS = {
    whatsNew: "", // default/index tab for the redesigned home page
    opsAtAGlance: "ops-at-a-glance",
    opsBenefits: "ops-benefits",
    releaseNotes: "release-notes", // legacy path; also the redesign's compat redirect
    next: "next" // legacy path; also the redesign's compat redirect
};

export const HOME_CHILD_PATHS = [
    "/",
    `/${HOME_RELATIVE_PATHS.releaseNotes}`,
    `/${HOME_RELATIVE_PATHS.next}`,
    `/${HOME_RELATIVE_PATHS.opsAtAGlance}`,
    `/${HOME_RELATIVE_PATHS.opsBenefits}`
];
