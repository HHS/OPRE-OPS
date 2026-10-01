import { useEffect, useState } from "react";
import { useSelector } from "react-redux";

const useWelcomeMessage = () => {
    const activeUser = useSelector((state) => state.auth?.activeUser);
    const [isReturning, setIsReturning] = useState(false);

    useEffect(() => {
        if (!activeUser?.id) return;
        const key = `hasVisited_${activeUser.id}`;
        const hasVisited = localStorage.getItem(key);
        if (hasVisited) {
            setIsReturning(true);
        } else {
            localStorage.setItem(key, "true");
            setIsReturning(false);
        }
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
