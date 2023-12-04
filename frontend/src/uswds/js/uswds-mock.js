import TestApplicationContext from "../../applicationContext/TestApplicationContext";

const mockFn = TestApplicationContext.helpers().mockFn;

const mockTooltip = {
    on: mockFn,
    off: mockFn
};

export default {
    tooltip: mockTooltip
};
