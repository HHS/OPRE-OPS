import RoundedBox from "./RoundedBox";

const output = {
    title: "Core/RoundedBox",
    component: RoundedBox,
    argTypes: {},
};
export default output;

const Template = (args) => <RoundedBox {...args}></RoundedBox>;

export const Primary = Template.bind({});

Primary.args = {};
