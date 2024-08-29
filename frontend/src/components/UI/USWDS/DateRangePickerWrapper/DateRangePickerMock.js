import { vi } from "vitest";

export const mockOn = vi.fn();
export const mockOff = vi.fn();

export default {
    on: mockOn,
    off: mockOff
};
