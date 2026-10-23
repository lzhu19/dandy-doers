# Technical Specifications

## Overview

doc overview

## Summary of Existing Functionality

context and background while linking new requirements to existing ones

## Requirement Details

breakdown of business requirements and high-level components

## Assumptions and Prerequisites

### Assumptions:

- assumption 1
- assumption 2

### Prerequisites:

- prereq 1
- prereq 2

## Risks and Mitigations

Risk: User may get internal database information that should not be made available to the user via error messages.\
Mitigation: Error messages returned to the user from the database are deliberately written such that users can only get a message that is needed. Logs will contain database errors, but errors returned to the user will not have the exact database error.

## Appendices

extra extra information (insert little jig)

### Disaster Recovery

What if we get swept up in a tornado and all of our data centers are flying in the sky, burning up, and the schoolbus nearby also gets picked up in the wind of the tornado and smashes into our burning servers?
