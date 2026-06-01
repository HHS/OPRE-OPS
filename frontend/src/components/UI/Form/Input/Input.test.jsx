import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Input from "./Input";

describe("Input", () => {
    it("calls onChange with name and value when the input changes", () => {
        const onChange = vi.fn();
        render(
            <Input
                name="title"
                label="Title"
                value=""
                onChange={onChange}
            />
        );

        fireEvent.change(screen.getByLabelText(/Title/i), { target: { value: "hello" } });
        expect(onChange).toHaveBeenCalledWith("title", "hello");
    });

    it("calls onBlur with name and value when the input loses focus", () => {
        const onBlur = vi.fn();
        render(
            <Input
                name="title"
                label="Title"
                value="abc"
                onChange={vi.fn()}
                onBlur={onBlur}
            />
        );

        fireEvent.blur(screen.getByLabelText(/Title/i));
        expect(onBlur).toHaveBeenCalledWith("title", "abc");
    });

    it("does not throw when onBlur is not provided", () => {
        render(
            <Input
                name="title"
                label="Title"
                value=""
                onChange={vi.fn()}
            />
        );

        expect(() => fireEvent.blur(screen.getByLabelText(/Title/i))).not.toThrow();
    });

    it("renders the first message as the error text", () => {
        render(
            <Input
                name="title"
                label="Title"
                value=""
                onChange={vi.fn()}
                messages={["This title already exists. Try a different one", "second"]}
            />
        );

        expect(screen.getByRole("alert")).toHaveTextContent("This title already exists. Try a different one");
    });
});
