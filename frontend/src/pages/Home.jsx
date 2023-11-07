import App from "../App";
import RoundedBox from "../components/UI/RoundedBox";
import { Alert, Label, Form, FormGroup, CharacterCount, Tooltip } from "@trussworks/react-uswds";

const Home = () => {
    return (
        <App>
            <div className="display-flex flex-justify-center">
                <RoundedBox className="padding-x-2 margin-top-2 display-inline-block text-center">
                    <h1>This is the OPRE OPS system prototype</h1>
                    <p>⚠️Tread with caution</p>
                </RoundedBox>
            </div>
            <div>
                <Alert
                    type="info"
                    heading="Informative status"
                    headingLevel="h4"
                >
                    {"Message text for the alert"}
                </Alert>
                <Form>
                    <FormGroup>
                        <Label htmlFor="with-hint-input">Text input</Label>
                        <span
                            id="with-hint-input-hint"
                            className="usa-hint"
                        >
                            This is an input with a character counter.
                        </span>
                        <CharacterCount
                            id="with-hint-input"
                            name="with-hint-input"
                            aria-describedby="with-hint-input-info with-hint-input-hint"
                            maxLength={25}
                        />
                    </FormGroup>
                </Form>
                <div className="margin-4">
                    <Tooltip label="Default Label">Default</Tooltip>
                    {/*<Tooltip*/}
                    {/*    className="myCustomButtonClass"*/}
                    {/*    position="top"*/}
                    {/*    wrapperClasses="width-full tablet:width-auto"*/}
                    {/*    label="Top"*/}
                    {/*>*/}
                    {/*    Show on top*/}
                    {/*</Tooltip>*/}
                </div>
            </div>
        </App>
    );
};

export default Home;
