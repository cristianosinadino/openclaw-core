# Architecture & Development Guide

This document outlines the architectural principles and development patterns for this project, with a focus on creating reusable, configuration-driven wizards.

## Core Principles

1.  **Configuration over Code**: Journeys are defined in metadata, not hardcoded in components.
2.  **Container is Generic**: The [daoWizardContainer](cci:7://file:///Users/cristianosinadino/Workspace/Salesforce/Pro/zennify/msb/force-app/main/default/Users/cristianosinadino/Workspace/Salesforce/Pro/zennify/msb/force-app/main/default/lwc/daoWizardContainer:0:0-0:0) is a generic "player" for any wizard defined in metadata.
3.  **Services are Decoupled**: Logic for persistence, validation, and configuration is handled in services, not in the UI components.

## How to Create a New DAO Wizard

To create a new wizard (e.g., for a different loan type or process), follow these steps:

1.  **Define a Unique Wizard API Name**: Choose a new, unique API name for your wizard (e.g., `DAO_Consumer_Unsecured`).

2.  **Create [Wizard_Step__mdt](cci:7://file:///Users/cristianosinadino/Workspace/Salesforce/Pro/zennify/msb/force-app/main/default/objects/Users/cristianosinadino/Workspace/Salesforce/Pro/zennify/msb/force-app/main/default/objects/Wizard_Step__mdt:0:0-0:0) Records**:
    *   Create a new [Wizard_Step__mdt](cci:7://file:///Users/cristianosinadino/Workspace/Salesforce/Pro/zennify/msb/force-app/main/default/objects/Users/cristianosinadino/Workspace/Salesforce/Pro/zennify/msb/force-app/main/default/objects/Wizard_Step__mdt:0:0-0:0) custom metadata record for each step in your new wizard.
    *   Set the `WizardApiName__c` field on **all** of these records to your new API name (`DAO_Consumer_Unsecured`).
    *   Use the `Order__c` field to define the sequence of the steps.
    *   Specify the LWC for each step in the `ComponentBundle__c` field.

3.  **Implement Step LWCs**: Create the new LWCs required for your steps (e.g., `unsecuredLoanDetails`). These components should be self-contained and emit `payloadchange` events as the user enters data.

4.  **Host the Container**: Place the [daoWizardContainer](cci:7://file:///Users/cristianosinadino/Workspace/Salesforce/Pro/zennify/msb/force-app/main/default/Users/cristianosinadino/Workspace/Salesforce/Pro/zennify/msb/force-app/main/default/lwc/daoWizardContainer:0:0-0:0) LWC on a page and set its public `wizardApiName` property to your new API name.

    ```html
    <template>
        <c-dao-wizard-container
            wizard-api-name="DAO_Consumer_Unsecured"
            record-id={recordId}
        ></c-dao-wizard-container>
    </template>
    ```

## Service Dependencies

*   **`WizardConfigService.cls`**: Responsible for querying [Wizard_Step__mdt](cci:7://file:///Users/cristianosinadino/Workspace/Salesforce/Pro/zennify/msb/force-app/main/default/objects/Users/cristianosinadino/Workspace/Salesforce/Pro/zennify/msb/force-app/main/default/objects/Wizard_Step__mdt:0:0-0:0) records. This service is generic and does not need to be changed for new wizards.
*   **`WizardPersistenceService.cls`**: Handles saving and loading step data. The implementation must be generic enough to support different wizards and potentially different target objects. Avoid hardcoding object names like [ApplicationForm](cci:7://file:///Users/cristianosinadino/Workspace/Salesforce/Pro/zennify/msb/force-app/main/default/Users/cristianosinadino/Workspace/Salesforce/Pro/zennify/msb/force-app/main/default/objects/ApplicationForm:0:0-0:0) here.