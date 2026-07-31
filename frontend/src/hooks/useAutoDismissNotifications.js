import { useCallback, useEffect, useRef } from "react";

/**
 * Auto-dismisses each notification after `delay` ms; each notification gets its own
 * independent timer so a newly-arrived notification isn't cut short by an older one's clock.
 * @param {Array<{id: number}>} notifications
 * @param {(id: number) => void} onDismiss
 * @param {number} [delay]
 * @returns {(id: number) => void} dismiss - clears any pending timer for `id`, then calls `onDismiss(id)`. Use this for manual (e.g. close-button) dismissal so the auto-dismiss timer doesn't fire again later.
 */
export function useAutoDismissNotifications(notifications, onDismiss, delay = 6000) {
    const timerRefs = useRef(new Map());

    useEffect(() => {
        const timers = timerRefs.current;

        // Cancel timers for notifications that are no longer in the list
        const currentIds = new Set(notifications.map((n) => n.id));
        timers.forEach((timer, id) => {
            if (!currentIds.has(id)) {
                clearTimeout(timer);
                timers.delete(id);
            }
        });

        // Start new timers for notifications that don't have timers yet
        notifications.forEach((notification) => {
            if (!timers.has(notification.id)) {
                const timer = setTimeout(() => {
                    onDismiss(notification.id);
                    timers.delete(notification.id);
                }, delay);

                timers.set(notification.id, timer);
            }
        });
    }, [notifications, onDismiss, delay]);

    // Cleanup all timers on unmount only
    useEffect(() => {
        const timers = timerRefs.current;
        return () => {
            timers.forEach((timer) => clearTimeout(timer));
            timers.clear();
        };
    }, []);

    const dismiss = useCallback(
        (id) => {
            const timer = timerRefs.current.get(id);
            if (timer) {
                clearTimeout(timer);
                timerRefs.current.delete(id);
            }
            onDismiss(id);
        },
        [onDismiss]
    );

    return dismiss;
}
