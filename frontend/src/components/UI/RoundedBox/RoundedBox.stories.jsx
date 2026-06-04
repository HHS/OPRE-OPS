import RoundedBox from "./RoundedBox";

export default {
    title: "UI/RoundedBox",
    component: RoundedBox,
    parameters: {
        docs: {
            description: {
                component: "Styled container with light background, border, and rounded corners. Accepts any children."
            }
        }
    }
};

/** Default box with simple text content. */
export const Default = {
    render: () => (
        <RoundedBox>
            <p>Content inside a rounded box.</p>
        </RoundedBox>
    )
};

/** Box with a heading and body content. */
export const WithHeader = {
    render: () => (
        <RoundedBox>
            <h3>Section Title</h3>
            <p>Body content goes here with supporting details.</p>
        </RoundedBox>
    )
};
