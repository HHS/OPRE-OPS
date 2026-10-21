export const RELEASE_NOTES_TYPES = {
    NEW_FEATURE: "New Feature",
    FIXES: "Fixes",
    IMPROVEMENTS: "Improvements"
};

/*
    NOTE: Shared by ReleaseNote (full release-notes list) and ReleaseNotesCards' LeftCard
    (homepage summary card) — both render the same three change types as Tag pills, so a
    color change can't require editing the same string independently in two files again.
*/
export const RELEASE_NOTES_TYPE_CLASSES = {
    [RELEASE_NOTES_TYPES.NEW_FEATURE]: "bg-brand-primary text-white",
    [RELEASE_NOTES_TYPES.FIXES]: "bg-brand-release-changes-fixes text-ink",
    [RELEASE_NOTES_TYPES.IMPROVEMENTS]: "bg-brand-release-changes-improvements text-ink"
};
