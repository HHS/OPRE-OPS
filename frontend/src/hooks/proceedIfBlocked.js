/**
 * Attempts to call `blocker.proceed()` if the blocker is in the `"blocked"` state.
 *
 * React Router throws `"Invalid blocker state transition"` when `proceed()` is called
 * after the blocker has already transitioned (e.g. the navigation completed before the
 * async call ran). We catch and suppress that known error so callers don't have to
 * handle it. Any other error is re-thrown.
 *
 * NOTE: The string-match is fragile; revisit if upgrading react-router.
 *
 * @param {import("react-router-dom").Blocker} blocker
 * @returns {Promise<void>}
 */
export async function proceedIfBlocked(blocker) {
    if (!blocker || blocker.state !== "blocked") {
        return;
    }
    try {
        await blocker.proceed();
    } catch (error) {
        const message = error && typeof error.message === "string" ? error.message.trim() : "";
        if (message.startsWith("Invalid blocker state transition")) {
            console.warn("Ignored known React Router blocker exception:", message);
            return;
        }
        throw error;
    }
}
