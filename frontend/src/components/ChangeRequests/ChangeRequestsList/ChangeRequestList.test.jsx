import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { vi } from "vitest";
import { useGetAgreementByIdQuery, useGetChangeRequestsListQuery } from "../../../api/opsAPI";
import { changeRequests } from "../../../tests/data";
import ChangeRequestList from "./ChangeRequestsList";

vi.mock("../../../api/opsAPI", () => ({
    useGetChangeRequestsListQuery: vi.fn(),
    useGetAgreementByIdQuery: vi.fn()
}));
vi.mock("../../../api/opsAPI");

describe("ChangeRequestList", () => {
    it("renders without any change requests", () => {
        useGetChangeRequestsListQuery.mockReturnValue({ data: {} });
        useGetAgreementByIdQuery.mockReturnValue("Agreement Name");
        render(
            <BrowserRouter>
                <ChangeRequestList />
            </BrowserRouter>
        );
        expect(screen.getByText(/no changes/i)).toBeInTheDocument();
    });
    it.todo("renders with change requests", async () => {
        useGetChangeRequestsListQuery.mockReturnValue({ data: changeRequests });
        useGetAgreementByIdQuery.mockReturnValue("Agreement Name");
        render(
            <BrowserRouter>
                <ChangeRequestList />
            </BrowserRouter>
        );
        screen.debug();
        const heading = await screen.findByText(/agreement name/i);
        expect(heading).toBeInTheDocument();
    });
});
