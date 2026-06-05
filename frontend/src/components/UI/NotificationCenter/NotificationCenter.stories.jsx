import NotificationCenter from "./NotificationCenter";

export default {
    title: "UI/NotificationCenter",
    component: NotificationCenter,
    parameters: {
        docs: {
            description: {
                component:
                    "Bell icon that opens a slide-out notification panel. Uses RTK Query to poll for " +
                    "unread notifications. Full interactive stories (with notifications displayed) require " +
                    "MSW integration which is planned for a future phase. Currently renders the bell icon " +
                    "in its idle state."
            }
        }
    }
};

export const Default = {
    args: {
        user: null
    }
};
