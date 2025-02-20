import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Accordion from "../../components/UI/Accordion";

const HowToGuides = () => {
    const components = {
        table: (props) => (
            <table
                className="usa-table"
                {...props}
            />
        )
    };

    return (
        <>
            <h2 className="margin-bottom-4">How-to Guides</h2>
            <section className="usa-prose">
            {data.map((item) => (
                <Accordion
                    key={item.heading}
                    heading={item.heading}
                    level={3}
                    isClosed={true}
                >
                    <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={components}
                    >
                        {item.content}
                    </ReactMarkdown>
                </Accordion>
                ))}
            </section>
        </>
    );
};

// Markdown Guide https://www.markdownguide.org/basic-syntax/
const data = [
    {
        heading: "What is OPS?",
        content: `OPS stands for OPRE’s Portfolio Management System (OPS). It is a centralized place for OPRE to plan and track their budget and projects across Divisions and Portfolios.`
    },
    {
        heading: "What benefits does OPS provide?",
        content: `
**Transparency**

Access is no longer limited to your specific contracts only. Everyone can view everything including budget and spending data for each Portfolio and funding details for every CAN. Changes are tracked via history so you can easily understand who changed what and when.

**Improved information architecture**

Budget and spending data can be viewed in more diverse and customized ways like across a portfolio, project, or CAN, in addition to the individual agreement level.

**Autonomy**

Team Leaders, CORs and other team members can create and edit agreements directly instead of having to email the budget team to make updates.

**Built-in Approvals**

Division Directors will formally approve budget and status changes in the system rather than through email.

**Pre-planning**

Plans can be entered into the system as Drafts instead of having to wait until plans are more formalized. This will provide a more holistic view of the data across all stages of planning.
        `
    },
    {
        heading: "What are the different user roles and what can they do?",
        content: `
**Overview of OPS user roles**

- Viewer/Editor
- Reviewer/Approver
- Budget Team
- Procurement Team

**What user role do I have?**

Check and see what user role you have by clicking on your email address link at the top of your screen.

**Viewer/Editor**

People with the Viewer/Editor role are generally Team Leaders, CORs, or other team members like Research Analysts, Management Analysts, or Program Analysts.

Individuals with a viewer/editor role are able to:

- View all portfolios, projects, agreements and CANs
- Create and edit Projects
- Create Agreements and edit them if listed as a team member
- Request a status change on budget lines for their agreements
- Complete the procurement tracker tasks for their agreements [not yet developed, coming soon]
- Start a contract modification [not yet developed, coming soon]

**Reviewer/Approver**

People with the Reviewer/Approver role are generally Division Directors or Deputy Directors who oversee the budget across their division and portfolios.

Individuals with a reviewer/approver role are able to:

- View all portfolios, projects, agreements and CANs
- Create and edit Projects
- Create Agreements and edit them if a team member
- Review and approve budget changes for budget lines using CANs within their Division
- Review and approve budget line status changes for budget lines using CANs within their Division
- Review and approve for Pre-Award during the procurement process (not yet developed, coming - soon)
- Review and approve contract modifications (not yet developed, coming soon)

**Budget Team**

People on the budget team are responsible for overseeing the budget across OPRE, forecasting trends in spending and budgets, and balancing the budget across external systems.

Individuals with a budget team role are able to:

- View all portfolios, projects, agreements and CANs
- Create and edit Projects
- Create Agreements and edit them if a team member
- Edit CAN details, budget, and funding received
- Review and approve agreements for Pre-Award during the procurement process [not yet developed, coming soon]
  - Review the final consensus memo
  - Submit the requisition and write a check for the total in executing status
- Review and approve agreements for Award during the procurement process [not yet developed, coming soon]
  - Ensure CLINs entered by CORs match the signed award
  - Review vendor information entered by CORs
  - Review award information entered by CORs
  - Enter the Obligated Date for budget lines in executing status

**Procurement Team**

People on the procurement team track the procurement process across OPRE and help coordinate between CORs and the procurement shops

Individuals with a procurement team role are able to:

- View all portfolios, projects, agreements and CANs
- Create and edit Projects
- Create Agreements and edit them if a team member
- View the status of procurement tasks across all agreements [not yet developed, coming soon]
- Reset procurement steps, if needed [not yet developed, coming soon]
        `
    },
    {
        heading: "How is OPS organized?",
        content: `
**The portfolio, project, and agreement relationship**

Each OPRE division has one or more portfolios. This is the first level of organization. Within each portfolio, projects can be created to assist in grouping different agreements together. There are different types of agreements—contracts, grants, or IAAs. Currently, only contracts and IAAs are available, with grants coming soon.

**The agreement lifecycle and budget line statuses**

All new budget lines start in Draft Status.

| BL Status | Meaning |
|-----------|---------|
| Draft              | In pre-planning, placeholders, and what-ifs; not yet solidified |
| Planned            | Intended to happen; money set aside as planned (even if changes occur). The amount is subtracted from the available FY budget |
| Executing          | In the procurement process; being formally committed |
| Obligated          | Committed in the signed award and can be invoiced against to begin work |
| In Review          | Pending edits or status change requests that need approval or decline |
        `
    },
    {
        heading: "How to view notifications",
        content: `
1. Click on the bell icon at the top right corner of the page
1. Any notifications will appear on the right side of the page
        `
    },
    {
        heading: "How to create a project",
        content: `
1. Click Create on the top navigation bar, then click Project
1. Fill out all of the required fields and click on the Create Project button. All data will be validated for completeness and required fields will need to be filled out before the project can be created.
    - When you are done filling out the fields, click on the Create Project button
1. This will send a notification to members of your portfolio to give them awareness
        `
    },
    {
        heading: "How to create an agreement",
        content: `
1. There are 2 ways to create a new agreement
    - Click Agreements in the top navigation bar, then click Add Agreement on the right side of the page
    - __OR__ click Create on the top navigation bar, then click Agreement
1. Complete step 1 by selecting a project the agreement should be associated with and click the Continue button
    - If the agreement needs to be associated with a project that is not listed, click the Add New Project button
    - See How to create a project
1. Complete step 2 by filling out the agreement details and click the Continue button
    - Not all information is required, and can be filled out later if you need to skip something. However, all data will need to be filled out before a budget line can be changed from Draft to Planned Status
    - You can click the Save Draft button to exit the create agreement process, save your data entry, and come back later, if needed
    - Anyone you add as a Team Member will be able to edit the agreement
        - Make sure you add yourself as a Team Member if you need to edit this agreement in the future
        - Divisions Directors will be auto-added as Team Members for any agreement using CANs within their Division
        - Team Leaders will be auto-added as Team Members for any agreement using CANs within their Portfolio
1. Complete step 3 by adding service components and budget lines
    - For Services Components: select the SC# (and whether or not it's optional), add a description, and period of performance and click Add Services Component
    - You can edit or delete the SC by hovering over the SC card and clicking the edit or delete icon on the right hand side
    - For Budget Lines: choose the SC the BL belongs to, add an Obligate By date, CAN and Amount, and then click Add budget Line
        - A BL ID# will be auto-assigned to each budget line after you create the agreement. This # is just a system reference number
        - The FY will be auto-populated based on the FY of the Obligate By Date you enter
        - The Fees will be auto-calculated based on the Procurement Shop you selected in Step 1
        - The total will be auto-calculated based on the Amount + Fees
        - All budget lines start in a Draft Status
    - You can edit, delete or duplicate the BL, by hovering over the row and clicking on the edit, delete or duplicate icon on the right hand side
1. If you need to go back to a previous step, click “Back” on the bottom left hand corner (not the browser back button which would exit the process). Your progress in Step 3 will be saved
1. When you are done entering SCs and BLs, click the Create Agreement button
        `
    },
    {
        heading: "How to edit an agreement’s details tab",
        content: `
1. Navigate to the agreement you want to edit
1. On the Agreement Details tab, click the Edit link on the right side of the page
1. Make your changes
1. When you are done, click the Save Changes button
        `
    },
    {
        heading: "How to add a new services component (SC) to an agreement",
        content: `
1. Navigate to the agreement you want to add a new services component to
1. Click on the SCs & Budget Lines tab
1. Click the Edit icon located on right side of the page
1. Review the Edit Services Components section with instructions
1. Select the SC# (and whether or not it's optional), add a description, add a period of 1. performance, and click Add Services Component button
1. You can edit or delete the SC, by hovering over the SC card and clicking the edit or delete 1. icon on the right hand side
1. When you are done adding services components, scroll to the bottom and click Save Changes to exit edit mode and save the agreement
        `
    },
    {
        heading: "How to edit a services component (SC)",
        content: `
1. Navigate to the agreement you want to edit
1. Click on the SCs & Budget Lines tab
1. Click the Edit icon on the right side of the page
1. Review the Edit Services Components section with instructions
1. You can edit or delete an SC, by hovering over the SC card and clicking the edit or delete 1. icon on the right hand side
1. Make your changes and then click the Update Services Component button
1. When you are done editing, scroll to the bottom and click Save Changes to exit edit mode and save the agreement
        `
    },
    {
        heading: "How to add a new add budget line (BL) to an agreement",
        content: `
1. Navigate to the agreement you want to add a budget line to
1. Click on the SCs & Budget Lines tab
1. Click the Edit link located on the right side of the page
1. Scroll down the page to the Edit Budget Lines section
    - Fill out any needed details at this time
1. All BL data (SC, Obligate By, Amount, etc) becomes required information once the BL is in 1. Planned or Executing status
1. Click the Add Budget Line button
        `
    },
    {
        heading: "How to edit a budget line",
        content: `
1. Navigate to the agreement you want to edit
1. Click on the SCs & Budget Lines tab
1. Click the Edit link on the right side of the page
1. Scroll to the Edit Budget Lines section and within the services component that contains the budget line (BL) you want to edit, hover over the status of the budget line you want to edit and click on the edit buttonlink (pencil icon)
1. Clicking on the edit buttonlink will populate all information that was previously created for the budget line in the edit area
1. Make your changes
1. Click on the Update Budge Line button
1. When you are done with all changes, click the Save Changes button
        `
    },
    {
        heading: "How to change a budget line status",
        content: `
1. Navigate to the agreement where you want to change a budget line status
1. Click on the SCs & Budget Lines tab
1. Scroll to the bottom of the agreement details page and click the Request BL Status Change button
1. Resolve any errors, if needed
    - All data will be validated for completeness and required fields will need to be filled out before submitting a status change request.
    - Errors will be listed in an alert banner and also display in red text on the page
    - If errors need to be addressed, scroll to the bottom of the page and click Edit. This will allow you to fix the errors and return to the Request BL Status Change Page
1. Follow the steps in each section of the Request BL Status Change Page
1. You can optionally close each section when you are finished
1. Review the agreement details to make sure everything looks correct
1. Choose the type of status change you’d like to make
1. Select the budget lines you’d like to apply the status change to
    -  You can select all budget lines within a services component by clicking the first checkbox in the top row (next to BL ID # column)
    -  Turn the After Approval toggle on/off to see how the agreement will change after this status change if approved
1. Review the CANs associated to budget lines you are changing
    - Turn the After Approval toggle on/off to see how the CANs will change after this status change is approved
1. Review changes to confirm what status change you are requesting
1. Add any notes to the reviewer/approver, if needed
1. When you are done making changes, click on the Send to Approval button
    -  This will send a notification to your Division Director who will need to approve the status change before its updated on the agreement
    -  During the review period, budget lines you changed will appear as In Review Status (Budget Line with In Review Status cannot be edited again until the first change has been approved or declined)
1. Check your notifications to see if the request has been approved or declined
    - If changes are declined, review any notes from your Division Director, make updates and re-submit, as needed
        `
    },
    {
        heading: "How to approve or decline budget changes (Approver role only)",
        content: `
1. Navigate to the agreement where you want to review and approve or decline a budget line status
1. Click on the For Review tab
1. A summarized view of the budget lines ready for review each appear in separate cards
    - Hover over the cards to approve or decline the request
    - If more context is needed in how these budget changes relate to other information within the agreement, click on the View All link on the card
1. Review the steps in each section of the Approval for Budget Change page
    - You can optionally close each section when you are finished
1. Review the agreement details to make sure everything looks correct
1. Review the budget lines that the budget change request is for
    - Turn the After Approval toggle on/off to see how the agreement will change after this budget change if approved
1. Review the CANs associated to budget lines you are changing
    - Turn the After Approval toggle on/off to see how the CANs will change after this budget change is approved
1. Add any notes to the reviewer/approver, if needed
1. When you are done reviewing changes, and agree the budget changes can be approved, check the disclaimer that reads ‘I understand that approving this budget change will affect my CANs balance(s)’ and click on the Approve Changes button
    - Click the Approve button in the modal asking if you are sure you want to approve the budget change
    - This will send a notification to whoever requested the status changes
    - The status of the budget lines you approved will now change to the status that was requested
1. When you are done reviewing the changes, and disagree that the budget changes can be approved:
    -  Leave a note on why you are declining the budget changes
    -  Click on the Decline button
        `
    },
    {
        heading: "How to approve or decline budget line status changes (Approver role only)",
        content: `
1. Navigate to the agreement where you want to review and approve or decline a budget line status
1. Click on the For Review tab
1. A summarized view of the budget lines ready for review each appear in separate cards
    - Hover over the cards to approve or decline the request
    - If more context is needed in how these status changes relate to other information within the 1. agreement, click on the View All link on the card
1. Review the steps in each section of the Approval for Status Change page
    - You can optionally close each section when you are finished
1. Review the agreement details to make sure everything looks correct
1. Review the budget lines that the status change request is for
    - Turn the After Approval toggle on/off to see how the agreement will change after this status 1. change if approved
1. Review the CANs associated to budget lines you are changing
1. Turn the After Approval toggle on/off to see how the CANs will change after this status change 1. is approved
1. Add any notes to the reviewer/approver, if needed
1. When you are done reviewing changes, and agree the status changes can be approved, check the 1. disclaimer that reads ‘I understand that approving budget lines for Planned Status will 1. subtract the amounts from the FY budget’ and click on the Approve Changes button
    - Click the Approve button in the modal asking if you are sure you want to approve the status change
    - This will send a notification to whoever requested the status changes
    - The status of the budget lines you approved will now change to the status that was requested
1. When you are done reviewing the changes, and disagree that the status changes can be approved:
    - Leave a note on why you are declining the status changes
    - Click on the Decline button
        `
    },
    {
        heading: "How to add a budget to a CAN (Budget team only)",
        content: `
1. Click on the CANs button in the main navigation
1. Navigate to the CAN you want to add a budget to in the All CANs or My CANs tabs
1. Click on the CAN Funding tab
1. Click the Edit link on the right side of the page
1. Enter the CAN budget in the FY •••• CAN Budget input
1. Click the + Add FY Budget button
1. Click the Save Changes button
        `
    },
    {
        heading: "How to edit a budget to a CAN (Budget team only)",
        content: `
1. Click on the CANs button in the main navigation
1. Navigate to the CAN you want to add a budget to in the All CANs or My CANs tabs
1. Click on the CAN Funding tab
1. Click the Edit link on the right side of the page
1. Edit the CAN budget in the FY •••• CAN Budget input
1. Click the + Add FY Budget button
1. Click the Save Changes button
        `
    },
    {
        heading: "How to add funding received to a CAN (Budget team only)",
        content: `
Funding received means funding received to OPRE towards a CANs FY budget

1. Click on the CANs button in the main navigation
1. Navigate to the CAN you want to add funding to in the All CANs or My CANs tabs
1. Click on the CAN Funding tab
1. Click the Edit link on the right side of the page
1. Enter the funding received in the Funding Received input and any optional notes
1. Click the + Add Funding Received button
1. Review the funding received in the Funding Received YTD table
1. If the funding received looks accurate, click the Save Changes button
        `
    },
    {
        heading: "How to edit funding received for a CAN (Budget team only)",
        content: `
1. Click on the CANs button in the main navigation
1. Navigate to the CAN you want to edit funding to in the All CANs or My CANs tab
1. Click on the CAN Funding tab
1. Click the Edit link on the right side of the page
1. Hover over the funding received row you would like to edit in the Funding Received YTD table at the bottom of the page
1. On the right side of the row click the edit icon (pencil)
1. Make changes in the Funding Received input and notes if applicable
1. Click the Update Funding Received button
1. Click the Save Changes button
        `
    }
];

export default HowToGuides;
