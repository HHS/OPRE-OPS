import App from "../App";
import RoundedBox from "../components/UI/RoundedBox";
import {
    Alert,
    Button,
    CharacterCount,
    CharacterCountContainer,
    Form,
    FormGroup,
    Label,
    TextArea,
    TextInput,
    Tooltip
} from "@metrostar/comet-uswds";

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
                    heading="Alert Heading"
                    id="alert-1"
                    show
                    type="info"
                >
                    This is the alert body
                </Alert>

                <Form id="form-2">
                    <CharacterCountContainer id="character-count-2">
                        <FormGroup>
                            <Label htmlFor="with-hint-textarea">Textarea</Label>
                            <span
                                className="usa-hint"
                                id="with-hint-textarea-hint"
                            >
                                This is a textarea with a character counter.
                            </span>
                            <TextArea
                                aria-describedby="with-hint-textarea-info with-hint-textarea-hint"
                                className="usa-character-count__field"
                                id="with-hint-textarea"
                                maxLength={50}
                                name="with-hint-textarea"
                                rows={5}
                            />
                        </FormGroup>
                        <CharacterCount id="with-hint-textarea-info">You can enter up to 50 characters</CharacterCount>
                    </CharacterCountContainer>
                </Form>

                <Tooltip
                    label="Tooltip text"
                    position="top"
                >
                    <Button id="button">Button with a tooltip top</Button>
                </Tooltip>

                <Tooltip
                    label="Tooltip text"
                    position="top"
                >
                    <span id="id123">span with a tooltip top</span>
                </Tooltip>
            </div>
        </App>
    );
};

export default Home;
