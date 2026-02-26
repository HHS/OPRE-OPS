Feature: API Version Endpoint
    As a user of the OPS API, I want to be able to check the API version
    so that I can ensure compatibility with my client application.

Scenario: Get API version as an authenticated user
    Given I am logged in as an authenticated user
    When I request the API version
    Then I should receive a successful response
    And the response should contain a version number

Scenario: Get API version as an unauthenticated user
    Given I am not logged in
    When I request the API version
    Then I should receive an unauthorized response

Scenario: Verify version format is valid
    Given I am logged in as an authenticated user
    When I request the API version
    Then I should receive a successful response
    And the version should be in a valid format
