export const calculateRatio = (data) => {
    if (!("expected" in data) || !("received" in data)) {
        console.log("data is malformed.");
        return 0;
    }

    if (data.received === 0) {
        return 0;
    } else if (data.expected === 0) {
        return 10000;
    } else {
        return data.received / data.expected;
    }
};
