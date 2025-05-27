import { useMemo, useEffect } from "react";
import { useGetNotificationsByUserIdQuery, useDismissNotificationMutation } from "../api/opsAPI";

export const useNotifications = (userId) => {
    const {
        data: notifications,
        isLoading,
        error,
        refetch
    } = useGetNotificationsByUserIdQuery(
        { id: userId },
        {
            pollingInterval: 60000,
            skip: !userId,
            refetchOnMountOrArgChange: true
        }
    );

    // Force a refetch when userId becomes available
    useEffect(() => {
        if (userId) {
            refetch();
        }
    }, [userId, refetch]);

    const [dismissNotification] = useDismissNotificationMutation();

    const unreadNotifications = useMemo(() => {
        return notifications
            ?.filter((notification) => !notification.is_read)
            .sort((a, b) => new Date(b.created_on) - new Date(a.created_on));
    }, [notifications]);

    const dismissAll = () => {
        if (unreadNotifications?.length) {
            unreadNotifications.forEach((notification) => dismissNotification(notification.id));
        }
    };

    return {
        notifications,
        unreadNotifications,
        isLoading,
        error,
        refetch,
        dismissNotification,
        dismissAll
    };
};
