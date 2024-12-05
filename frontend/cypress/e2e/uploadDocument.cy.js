import {terminalLog, testLogin} from "./utils.js";

beforeEach(() => {
    testLogin("admin");
    cy.visit("/upload-document");
});

afterEach(() => {
    cy.injectAxe();
    cy.checkA11y(null, null, terminalLog);
});

it("should loads", () => {
    cy.get("h1").should("have.text", "Temporary Upload Document Page");
});

it("should create a document database record and upload to in memory storage", () => {
    // Entering an Agreement ID in the Upload Document section
    cy.get('#agreement-id-upload').type('1');
    // Selecting a file
    cy.get('#file-upload').selectFile('cypress/fixtures/sample_document.xlsx');
    // Selecting a Document Type
    cy.get('#document-type').select('ADDITIONAL_DOCUMENT');
    // Clicking the Upload button and verifying the upload process
    cy.get('button').contains('Upload').click();

    // Verifying the document database record exists
    expect(localStorage.getItem("access_token")).to.exist;
    const bearer_token = `Bearer ${window.localStorage.getItem("access_token")}`;
    cy.request({
        method: "GET",
        url: "http://localhost:8080/api/v1/documents/1",
        headers: {
            Authorization: bearer_token,
            "Content-Type": "application/json",
            Accept: "application/json"
        }
    }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.url).to.exist;
        expect(response.body.url).to.include("FakeDocumentRepository");
        expect(response.body.documents).to.exist;
        expect(response.body.documents[0].document_name).to.eq("sample_document.xlsx");
        expect(response.body.documents[0].document_type).to.eq('DocumentType.ADDITIONAL_DOCUMENT');
        expect(response.body.documents[0].agreement_id).to.eq(1);
        expect(response.body.documents[0].status).to.eq("uploaded");
    })
});

it.skip("Should download document in memory storage and verify logs", () => {
    // set up spy on console.log
    let logSpy;
    cy.window().then((win) => {
        logSpy = cy.spy(win.console, "log")
    });

    cy.intercept('GET', 'http://localhost:8080/api/v1/documents/1').as('getDocumentsRequest');

    cy.get('#agreement-id-get').type('1');
    cy.get('button').contains('Get Documents').click();

    //  Verifying documents in downloads have "uploaded" status
    cy.wait('@getDocumentsRequest').then((interception) => {
        expect(interception.response.statusCode).to.eq(200);
        expect(interception.response.body.url).to.include('FakeDocumentRepository');
        const documents = interception.response.body.documents;

        for (let i = 0; i < documents.length; i++) {
            expect(documents[i].status).to.eq("uploaded");
        }
    });

    //  Verifying logs for successful document download
    const expectedMessage = "All documents for agreement 1 downloaded successfully.";
    cy.wait(2000).then (() => {
        const calls = logSpy.getCalls();
        expect(calls[calls.length - 1].args.toString()).to.contains("Downloading");
    });
});
