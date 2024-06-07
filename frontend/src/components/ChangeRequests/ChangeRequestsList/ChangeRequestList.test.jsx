import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import ChangeRequestList from "./ChangeRequestsList";
import { useGetChangeRequestsListQuery, useGetAgreementByIdQuery } from "../../../api/opsAPI";
import { changeRequests } from "../../../tests/data";
// import TestApplicationContext from "../../../applicationContext/TestApplicationContext";

// const mockFn = TestApplicationContext.helpers().mockFn;
vi.mock("../../../api/opsAPI");

describe("ChangeRequestList", () => {
    it("renders without any change requests", () => {
        useGetChangeRequestsListQuery.mockReturnValue({ data: {} });
        useGetAgreementByIdQuery.mockReturnValue({ data: {} });
        render(<ChangeRequestList />);
        expect(screen.getByText(/no changes/i)).toBeInTheDocument();
    });
    it("renders with change requests", () => {
        useGetChangeRequestsListQuery.mockReturnValue({ data: changeRequests });
        useGetAgreementByIdQuery.mockReturnValue({ data: { display_name: "Agreement Name" } });
        render(<ChangeRequestList />);
        const heading = screen.getByRole("heading", { name: "DEBUG CODE" });
        expect(heading).toBeInTheDocument();
    });
});
