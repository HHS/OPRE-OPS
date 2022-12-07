import { GovBanner } from "./GovBanner";
const output = {
    title: "Core/GovBanner",
    component: GovBanner,
    args: {},
};
export default output;

const Template = (args) => <GovBanner {...args} />;

export const Story = Template.bind({});
Story.args = {};
