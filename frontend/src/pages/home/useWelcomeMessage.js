import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";

const useWelcomeMessage = () => {
    const activeUser = useSelector((state) => state.auth?.activeUser);
    const [isReturning, setIsReturning] = useState(false);
    // Refs survive React Strict Mode's double-invocation of effects (unlike state/storage),
    // so we only read + write the visit marker once per user and never misclassify a
    // first-time user as returning on the second mount.
    const initializedUserId = useRef(null);

    useEffect(() => {
        if (!activeUser?.id) {
            // Logged out (or auth not yet hydrated): clear the guard and state so a
            // logged-out visitor never sees a stale "Welcome back" from a prior user.
            initializedUserId.current = null;
            setIsReturning(false);
            return;
        }
        if (initializedUserId.current === activeUser.id) return;
        initializedUserId.current = activeUser.id;
        const key = `hasVisited_${activeUser.id}`;
        const hasVisited = localStorage.getItem(key);
        setIsReturning(!!hasVisited);
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
