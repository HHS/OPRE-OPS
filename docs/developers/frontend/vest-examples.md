# Vest Examples

## Background
Vest is a form validations framework that looks and feels like a unit testing framework.
It allows you to express your validation logic in a simple and readable way that's also easy to maintain in the long run.

Here are a few examples we have so far in our codebase.

## Example 1: Create a Project with local React useState object
*Mode*: CREATE

https://github.com/HHS/OPRE-OPS/assets/4629398/1d11aa61-339f-4208-ab13-6d29ccb12087

In this example we are working with single state object called `project` with local React state. We want to allow users to have to first interact with the form elements before firing off the validation.

1. First step is to create our test suite with the fields we want to enforce are not blank and other tests

```javascript
//suite.js
import { create, test, enforce, only } from "vest";

const suite = create((data = {}, fieldName) => {
  only(fieldName);

  test("short_title", "This is required information", () => {
      enforce(data.short_title).isNotBlank();
  });
  test("title", "This is required information", () => {
      enforce(data.title).isNotBlank();
  });
  test("description", "This is required information", () => {
      enforce(data.description).isNotBlank();
  });
  test("type", "This is required information", () => {
      enforce(data.type).isString().notEquals("0");
  });
});

export default suite;

```

2. Next in our `CreateProject` we import and initialize the test suite setup our state object for the project

```javascript
//CreateProject.jsx

// initialize the test suite
import suite from "./suite";
...
let res = suite.get();
...
 const [project, setProject] = React.useState({
    type: "",
    short_title: "",
    title: "",
    description: "",
});
```

3. Add a `handleChange` function to update state and run validation

```javascript
// CreateProject.jsx
const handleChange = (currentField, value) => {
  const nextState = { ...project, [currentField]: value };
  setProject(nextState);
  suite(nextState, currentField);
};
```

4. Component structure hooks into the `handleChange` function with the onChange event

```javascript
// CreateProject.jsx
 <Input
  name="title"
  label="Project Title"
  onChange={handleChange}
  messages={res.getErrors("title")}
  value={project.title || ""}
  className={cn("title")}
/>

//Input.jsx
...
<input
  id={name}
  name={name}
  onChange={handleChange}
  value={value}
/>
...
function handleChange(e) {
  onChange(name, e.target.value);
}
```

## Example 2: Review an Agreement
In this example we want to read in the agreement properties from global state and ensure they are enforced when the component mounts.
We are not interacting with the elements and not firing re-validations.

*Mode*: READ

https://github.com/HHS/OPRE-OPS/assets/4629398/707c0c70-2afc-4f4c-ad32-8652ab8f40ed

1. Setup our test suite

```javascript
//suite.js
import { create, test, enforce, only, each } from "vest";

const suite = create((fieldName) => {
  only(fieldName);

  test("name", "This is required information", () => {
      enforce(fieldName.name).isNotBlank();
  });
  test("type", "This is required information", () => {
      enforce(fieldName.agreement_type).isNotBlank();
  });
  test("description", "This is required information", () => {
      enforce(fieldName.description).isNotBlank();
  });
  ...
  // other tests as needed
...
```

2. Pass in the agreement object from Redux ToolKit (RTK) into the test suite on component mount using useEffect

```javascript
//ReviewAgreement.jsx
// pass in the agreement object to the suite
React.useEffect(() => {
  if (isSuccess) {
      suite({
          ...agreement,
      });
  }
  return () => {
      suite.reset();
  };
}, [isSuccess, agreement]);
```

3. Display any errors in the Component

```javascript
// CreateProject.jsx
 <Terms
    name="name"
    label="Project"
    messages={res.getErrors("name")}
    className={cn("name")}
    value={agreement?.name}
/>

//Term.jsx
...
const Terms = ({ name, label = name, pending = false, messages = [], value, className }) => {
  return (
    <div className={cx("usa-form-group", pending && "pending", className)}>
        <dt className="margin-0 text-base-dark margin-top-3">{label}</dt>
        <dd className="text-semibold margin-0 margin-top-05">
            {value || "TBD"}
            {messages.length ? (
                <span className="usa-error-message" role="alert">
                    {messages[0]}
                </span>
            ) : null}
        </dd>
    </div>
  );
};
```

## Example 3: Working with state from Context in an Agreement workflow
We want to kickoff the tests if the form is in Review mode even if the user has not interacted with the form elements.

*Mode*: REVIEW/EDIT

https://github.com/HHS/OPRE-OPS/assets/4629398/312ef2f4-ac1a-4a73-a183-ee175170b6df

1. Setup the test suite

```javascript
//suite.js
import { create, test, enforce, only } from "vest";

const suite = create((data = {}, fieldName) => {
  only(fieldName); // only run the tests for the field that changed
  test("agreement_type", "Contract is required for now.", () => {
      enforce(data.agreement_type).equals("CONTRACT");
  });
  test("name", "This is required information", () => {
      enforce(data.name).isNotBlank();
  });
  test("description", "This is required information", () => {
      enforce(data.description).isNotBlank();
  });
  ...
  // other tests as needed
});

```

2. Pass in the agreement object into the test suite to fire off the tests if in Review mode. Review mode is set using query params in the url. We also add a cleanup function once the Component is unmounted to reset the test suite.

```javascript
// StepCreateAgreement.jsx
...
React.useEffect(() => {
  switch (formMode) {
    case "edit":
      setIsEditMode(true);
      break;
    case "review":
      setIsReviewMode(true);
      suite({
          ...agreement,
      });
      break;
    default:
      return;
  }
  return () => {
    setIsReviewMode(false);
    setIsEditMode(false);
    suite.reset();
  };
}, [formMode, agreement]);
```

3. Setup a validate function

```javascript
// StepCreateAgreement.jsx
...
const runValidate = (name, value) => {
  suite(
    {
      ...agreement,
      ...{ [name]: value },
    },
    name
  );
};
```
4. Component structure fires the `runValidate` function on the onChange event. The `<TextArea />` component *only* runs the validation when the form is in review mode. The `<Input />` component runs in any mode.

```javascript
// StepCreateAgreement.jsx
...
<Input
  name="name"
  label="Agreement Title"
  messages={res.getErrors("name")}
  className={cn("name")}
  value={agreementTitle}
  onChange={(name, value) => {
      setAgreementTitle(value);
      runValidate(name, value);
  }}
/>

<TextArea
  name="description"
  label="Description"
  messages={res.getErrors("description")}
  className={cn("description")}
  value={agreementDescription}
  onChange={(name, value) => {
      setAgreementDescription(value);
      if (isReviewMode) {
          runValidate(name, value);
      }
  }}
/>

```

## Resources
- [Vest documentation site](https://vestjs.dev/)
- [Vest form example tutorial](https://dev.to/ealush/dead-simple-form-validation-with-vest-5gf8)
- [Vest form example CodeSandBox](https://codesandbox.io/s/vest-react-tutorial-finished-ztt8t?file%253D%252Fsrc%252Fvalidate.js)
