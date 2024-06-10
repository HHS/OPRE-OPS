import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { vi } from "vitest";
import { useGetAgreementByIdQuery, useGetChangeRequestsListQuery } from "../../../api/opsAPI";
import { changeRequests } from "../../../tests/data";
import ChangeRequestList from "./ChangeRequestsList";
// import TestApplicationContext from "../../../applicationContext/TestApplicationContext";

// const mockFn = TestApplicationContext.helpers().mockFn;
vi.mock("../../../api/opsAPI");

describe("ChangeRequestList", () => {
    it("renders without any change requests", () => {
        useGetChangeRequestsListQuery.mockReturnValue({ data: {} });
        useGetAgreementByIdQuery.mockReturnValue({ data: {} });
        render(
            <BrowserRouter>
                <ChangeRequestList />
            </BrowserRouter>
        );
        expect(screen.getByText(/no changes/i)).toBeInTheDocument();
    });
    it("renders with change requests", () => {
        useGetChangeRequestsListQuery.mockReturnValue({ data: changeRequests });
        useGetAgreementByIdQuery.mockReturnValue({ data: { display_name: "Agreement Name" } });
        render(
            <BrowserRouter>
                <ChangeRequestList />
            </BrowserRouter>
        );
        const heading = screen.getByRole("heading", { name: "DEBUG CODE" });
        expect(heading).toBeInTheDocument();
    });
});
