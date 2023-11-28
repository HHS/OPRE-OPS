import { vi } from "vitest";

const mockTooltip = {
    on: vi.fn(),
    off: vi.fn()
};

export default {
    tooltip: mockTooltip
};
