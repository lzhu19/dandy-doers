# Technical Specifications

## Overview

Dandy Doers is a web-based to-do list application. This document describes its current features, technical requirements, development setup, and known risks. The application uses React and Vite for the frontend, Node.js and Express for the backend, and MongoDB to store tasks and lists.

## Summary of Existing Functionality

Users can create, rename, and delete to-do lists, and create, edit, and reorder their tasks. Tasks can be archived, restored, moved to a deleted section, or permanently deleted. Users can search for tasks by name. The frontend uses HTTP requests to access task and list data stored in MongoDB.

## Requirement Details

### Functional Requirements

1. The application shall allow users to create, view, rename, and delete to-do lists.
2. The application shall allow users to create tasks in a list, edit task names and notes, and permanently delete tasks.
3. The application shall allow users to reorder tasks within a list and retain that order.
4. The application shall allow users to archive tasks and restore archived tasks.
5. The application shall provide a deleted-tasks section where users can restore tasks or permanently delete them.
6. The application shall allow users to search for tasks by name.
7. Deleting a list shall also delete its associated tasks so that no orphaned tasks remain.

### Technical Requirements

1. The frontend shall provide the user interface and communicate with the backend through HTTP requests.
2. The backend shall provide API operations for task and list retrieval, creation, updates, ordering, archiving, restoration, and deletion.
3. The backend shall persist task and list data in MongoDB.
4. The backend shall validate required task and list names and reject task creation when its referenced list is invalid or does not exist.
5. The backend shall return appropriate success and error responses for API operations and avoid exposing raw database errors to users.

## Scope and Prerequisites

This specification covers the task and list features in the current application. It does not define requirements for user accounts, authentication, or sharing.

### Local Development Prerequisites:

- Install Node.js and npm, then run `npm install` from the repository root.
- Provide access to MongoDB and set `MONGODB_URI` in the backend environment.
- Run both the frontend and backend development servers to use the full application locally.

## Risks and Mitigations

**Risk:** User may get internal database information that should not be made available to the user via error messages.\
**Mitigation:** Backend error handlers return user-facing messages and log technical errors.

**Risk:** Deleting a To-Do List deletes only the list and not the tasks, orphaning tasks in the database.\
**Mitigation:** The backend deletes a list's tasks before deleting the list.

**Risk:** A backend or database outage can prevent users from retrieving or saving their tasks.\
**Mitigation:** The backend returns an error response when an operation fails. The team plans to add database backups and a recovery process; neither is configured in the project yet.

**Risk:** A user may accidentally move a task to the deleted section or permanently delete it.\
**Mitigation:** The application separates moving a task to the deleted section from permanently deleting it. Tasks in the deleted section can be restored.

**Risk:** If saving a reordered task list fails, the displayed order may not match the order stored in the database.\
**Mitigation:** The frontend logs the failed request but does not revert the displayed order.

**Risk:** Blank task or list names may result in failed requests.\
**Mitigation:** The backend rejects blank names when creating tasks and lists. The interface also checks list names before creating or renaming lists.

## Appendices

### Coverage

Frontend tests use Vitest, and backend tests use Jest. Generate coverage reports from the repository root:

```sh
npm run test:coverage-frontend
npm run test:coverage-backend
```

As of 11/04/2026, our frontend coverage is 99.11% and our backend coverage is 100%.

### Development Workflow

1. Use a feature branch for feature work. Make small fixes on the main branch when appropriate.
2. Keep the branch up to date with the main branch.
3. Add or update tests for the change.
4. Before submitting changes, run these checks from the repository root:

   ```sh
   npm test
   npm run lint
   npm run format
   ```

   To generate coverage reports, run `npm run test:coverage-frontend` and/or `npm run test:coverage-backend`.

5. Commit with a clear message and push the branch.
6. Submit feature branches as pull requests. Before merging, confirm CI checks pass and get a review from at least one other developer.
7. Address issues caused by the change after it is merged.

### Disaster Recovery

What if we get swept up in a tornado and all of our data centers are flying in the sky, burning up, and the schoolbus nearby also gets picked up in the wind of the tornado and smashes into our burning servers?

The team plans to add MongoDB backups and a recovery process. Neither is configured in the project yet. If the database becomes unavailable, it must be restored before the application can resume normal operation.
