Feature: Edit Agreement Metadata
  As an OPRE staff member, I want to edit agreement metadata.

  See: (Edit Draft Agreement Metadata)[https://github.com/HHS/OPRE-OPS/issues/856]

  Scenario: Required Fields
    Given I am a logged in as an OPS user
    And I have a Contract Agreement
    And I edit the agreement to remove a required field
    When I submit the agreement
    Then I should get an error message that it's invalid

  Scenario: Successful Edit
    Given I am a logged in as an OPS user
    And I have a Contract Agreement
    And I edit the agreement to change a value
    When I submit the agreement
    Then I should get an message that it was successful

  Scenario: Successful Edit of Just Notes
    Given I am a logged in as an OPS user
    And I have a Contract Agreement
    When I submit a new value for notes
    Then I should get an message that it was successful

  Scenario: Successful Edit Non-Draft BLI
    Given I am a logged in as an OPS user
    And I have a Contract Agreement with a BLI in planned
    And I edit the agreement to change a value
    When I submit the agreement
    Then I should get an message that it was successful
    And the Agreement's budget line items are all now Draft

  Scenario: Division Director can edit Agreement metadata
    Given I am a logged in as an OPS user
    And I have a Contract Agreement associated with a CAN where I am the Division Director
    And I edit the agreement to change a value
    When I submit the agreement
    Then I should get an message that it was successful

  Scenario: Unassociated user cannot edit Agreement metadata
    Given I am a logged in as a basic user
    And I have a Contract Agreement I am not associated with
    And I edit the agreement to change a value
    When I submit the agreement
    Then I should get an error message that I'm not authorized

  Scenario: Portfolio Team Leader can edit Agreement metadata
    Given I am a logged in as an OPS user
    And I have a Contract Agreement associated with a CAN where I am the Portfolio Team Leader
    And I edit the agreement to change a value
    When I submit the agreement
    Then I should get an message that it was successful

  Scenario: System owner can edit Agreement metadata
    Given I am a logged in as a system owner
    And I have a Contract Agreement associated with a CAN where I am the system owner
    And I edit the agreement to change a value
    When I submit the agreement
    Then I should get an message that it was successful

  Scenario: Failed Edit of name on Awarded Agreement
    Given I am a logged in as an OPS user
    And I have an Awarded Contract Agreement
    And I edit the agreement name
    When I submit the agreement
    Then I should get an error message that it's invalid

  Scenario: Failed Edit of contract_type on Awarded Agreement
    Given I am a logged in as an OPS user
    And I have an Awarded Contract Agreement
    And I edit the agreement contract_type
    When I submit the agreement
    Then I should get an error message that it's invalid

  Scenario: Failed Edit of service_requirement_type on Awarded Agreement
    Given I am a logged in as an OPS user
    And I have an Awarded Contract Agreement
    And I edit the agreement service_requirement_type
    When I submit the agreement
    Then I should get an error message that it's invalid

  Scenario: Failed Edit of product_service_code_id on Awarded Agreement
    Given I am a logged in as an OPS user
    And I have an Awarded Contract Agreement
    And I edit the agreement product_service_code_id
    When I submit the agreement
    Then I should get an error message that it's invalid

  Scenario: Failed Edit of awarding_entity_id on Awarded Agreement
    Given I am a logged in as an OPS user
    And I have an Awarded Contract Agreement
    And I edit the agreement awarding_entity_id
    When I submit the agreement
    Then I should get an error message that it's invalid

  Scenario: Failed Edit of agreement_reason on Awarded Agreement
    Given I am a logged in as an OPS user
    And I have an Awarded Contract Agreement
    And I edit the agreement agreement_reason
    When I submit the agreement
    Then I should get an error message that it's invalid

  Scenario: Successful Edit of mutable field on Awarded Agreement
    Given I am a logged in as an OPS user
    And I have an Awarded Contract Agreement
    And I edit the agreement description
    When I submit the agreement
    Then I should get an message that it was successful

  Scenario: Failed Edit of name on Awarded AA Agreement
    Given I am a logged in as an OPS user
    And I have an Awarded AA Agreement
    And I edit the agreement name
    When I submit the agreement
    Then I should get an error message that it's invalid

  Scenario: Failed Edit of requesting_agency_id on Awarded AA Agreement
    Given I am a logged in as an OPS user
    And I have an Awarded AA Agreement
    And I edit the agreement requesting_agency_id
    When I submit the agreement
    Then I should get an error message that it's invalid

  Scenario: Failed Edit of servicing_agency_id on Awarded AA Agreement
    Given I am a logged in as an OPS user
    And I have an Awarded AA Agreement
    And I edit the agreement servicing_agency_id
    When I submit the agreement
    Then I should get an error message that it's invalid

  Scenario: Failed Edit of contract_type on Awarded AA Agreement
    Given I am a logged in as an OPS user
    And I have an Awarded AA Agreement
    And I edit the agreement contract_type
    When I submit the agreement
    Then I should get an error message that it's invalid

  Scenario: Failed Edit of service_requirement_type on Awarded AA Agreement
    Given I am a logged in as an OPS user
    And I have an Awarded AA Agreement
    And I edit the agreement service_requirement_type
    When I submit the agreement
    Then I should get an error message that it's invalid

  Scenario: Failed Edit of product_service_code_id on Awarded AA Agreement
    Given I am a logged in as an OPS user
    And I have an Awarded AA Agreement
    And I edit the agreement product_service_code_id
    When I submit the agreement
    Then I should get an error message that it's invalid

  Scenario: Failed Edit of awarding_entity_id on Awarded AA Agreement
    Given I am a logged in as an OPS user
    And I have an Awarded AA Agreement
    And I edit the agreement awarding_entity_id
    When I submit the agreement
    Then I should get an error message that it's invalid

  Scenario: Failed Edit of agreement_reason on Awarded AA Agreement
    Given I am a logged in as an OPS user
    And I have an Awarded AA Agreement
    And I edit the agreement agreement_reason
    When I submit the agreement
    Then I should get an error message that it's invalid

  Scenario: Successful Edit of mutable field on Awarded AA Agreement
    Given I am a logged in as an OPS user
    And I have an Awarded AA Agreement
    And I edit the agreement description
    When I submit the agreement
    Then I should get an message that it was successful

  Scenario: Power User can edit name on Awarded Contract Agreement
    Given I am a logged in as a power user
    And I have an Awarded Contract Agreement
    And I edit the agreement name
    When I submit the agreement
    Then I should get an message that it was successful

  Scenario: Power User can edit contract_type on Awarded Contract Agreement
    Given I am a logged in as a power user
    And I have an Awarded Contract Agreement
    And I edit the agreement contract_type
    When I submit the agreement
    Then I should get an message that it was successful

  Scenario: Power User can edit service_requirement_type on Awarded Contract Agreement
    Given I am a logged in as a power user
    And I have an Awarded Contract Agreement
    And I edit the agreement service_requirement_type
    When I submit the agreement
    Then I should get an message that it was successful

  Scenario: Power User can edit product_service_code_id on Awarded Contract Agreement
    Given I am a logged in as a power user
    And I have an Awarded Contract Agreement
    And I edit the agreement product_service_code_id
    When I submit the agreement
    Then I should get an message that it was successful

  Scenario: Power User can edit awarding_entity_id on Awarded Contract Agreement
    Given I am a logged in as a power user
    And I have an Awarded Contract Agreement
    And I edit the agreement awarding_entity_id
    When I submit the agreement
    Then I should get an message that it was successful

  Scenario: Power User can edit agreement_reason on Awarded Contract Agreement
    Given I am a logged in as a power user
    And I have an Awarded Contract Agreement
    And I edit the agreement agreement_reason
    When I submit the agreement
    Then I should get an message that it was successful

  Scenario: Power User can edit name on Awarded AA Agreement
    Given I am a logged in as a power user
    And I have an Awarded AA Agreement
    And I edit the agreement name
    When I submit the agreement
    Then I should get an message that it was successful

  Scenario: Power User can edit requesting_agency_id on Awarded AA Agreement
    Given I am a logged in as a power user
    And I have an Awarded AA Agreement
    And I edit the agreement requesting_agency_id
    When I submit the agreement
    Then I should get an message that it was successful

  Scenario: Power User can edit servicing_agency_id on Awarded AA Agreement
    Given I am a logged in as a power user
    And I have an Awarded AA Agreement
    And I edit the agreement servicing_agency_id
    When I submit the agreement
    Then I should get an message that it was successful

  Scenario: Power User can edit contract_type on Awarded AA Agreement
    Given I am a logged in as a power user
    And I have an Awarded AA Agreement
    And I edit the agreement contract_type
    When I submit the agreement
    Then I should get an message that it was successful

  Scenario: Power User can edit service_requirement_type on Awarded AA Agreement
    Given I am a logged in as a power user
    And I have an Awarded AA Agreement
    And I edit the agreement service_requirement_type
    When I submit the agreement
    Then I should get an message that it was successful

  Scenario: Power User can edit product_service_code_id on Awarded AA Agreement
    Given I am a logged in as a power user
    And I have an Awarded AA Agreement
    And I edit the agreement product_service_code_id
    When I submit the agreement
    Then I should get an message that it was successful

  Scenario: Power User can edit awarding_entity_id on Awarded AA Agreement
    Given I am a logged in as a power user
    And I have an Awarded AA Agreement
    And I edit the agreement awarding_entity_id
    When I submit the agreement
    Then I should get an message that it was successful

  Scenario: Power User can edit agreement_reason on Awarded AA Agreement
    Given I am a logged in as a power user
    And I have an Awarded AA Agreement
    And I edit the agreement agreement_reason
    When I submit the agreement
    Then I should get an message that it was successful
