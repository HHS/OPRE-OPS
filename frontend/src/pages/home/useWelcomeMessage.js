import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import {
    getVisitClassification,
    hasVisitClassification,
    setVisitClassification
} from "../../helpers/visitSessionCache.helpers";

const useWelcomeMessage = () => {
    const activeUser = useSelector((state) => state.auth?.activeUser);
    const [isReturning, setIsReturning] = useState(false);

    useEffect(() => {
        const userId = activeUser?.id;
        if (userId == null) {
            // Logged out (or auth not yet hydrated): don't show a stale "Welcome back"
            // left over from a previous user.
            setIsReturning(false);
            return;
        }
        if (hasVisitClassification(userId)) {
            // Already classified earlier in this tab session (e.g. this component
            // unmounted and remounted via SPA navigation, or Strict Mode's dev-only
            // double-invocation) — reuse it instead of re-reading localStorage, so a
            // first-time visitor doesn't get misclassified as returning on a second pass.
            setIsReturning(getVisitClassification(userId));
            return;
        }
        const key = `hasVisited_${userId}`;
        const hasVisited = !!localStorage.getItem(key);
        setVisitClassification(userId, hasVisited);
        setIsReturning(hasVisited);
        localStorage.setItem(key, "true");
    }, [activeUser?.id]);

    const firstName = activeUser?.first_name ?? null;
    const greeting = isReturning
        ? firstName
            ? `Welcome back ${firstName}`
            : "Welcome back"
        : firstName
          ? `Welcome ${firstName}`
          : "Welcome";

    return { greeting };
};

export default useWelcomeMessage;
