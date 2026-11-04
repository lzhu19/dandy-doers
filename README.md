# Dandy Doers

_Be a Dandy Doer and stay organized with Dandy Doer To-Do Lists!_

## Overview

Dandy Doers is a web-based to-do list application for college students. It brings everyday tasks together in one place, with tools to create lists, find tasks, and manage completed or unwanted items.

## Purpose

College students juggle assignments, deadlines, and study tasks. Dandy Doers offers a convenient, easy-to-update, and visually appealing way to stay organized without relying on paper planners or downloading an app.

## Features

- Create, edit, and delete tasks.
- Archive tasks and restore them when needed.
- Move tasks to a deleted section, then restore or permanently delete them.
- Create, rename, and delete multiple to-do lists.
- Search for tasks by name.
- Access the website without downloading an app.

## Tech Stack

- Frontend: React and Vite
- Backend: Node.js and Express
- Database: MongoDB
- Testing: Vitest (frontend) and Jest (backend)
- Formatting and linting: Prettier and ESLint

## Dev Setup

1. Install dependencies from the repository root:

   ```sh
   npm install
   ```

2. Configure `MONGODB_URI` in `packages/backend/.env` with the connection string for your MongoDB database.
3. Start the backend from the repository root:

   ```sh
   npm run dev-backend
   ```

4. In a separate terminal, start the frontend:

   ```sh
   npm run dev-frontend
   ```

5. Open the local URL printed by Vite in your browser.

## Dev Commands

Run the test suites:

```sh
npm test
```

Check code style and formatting:

```sh
npm run lint
npm run format
```

Follow the [Google JavaScript Style Guide](https://google.github.io/styleguide/jsguide.html) for code conventions.

## Documentation

Project tasks, progress, ideas, and planning are tracked in our [FigJam board](https://www.figma.com/board/JvA38iv8Gwq7yqDvcRrC1z/CSC3100?node-id=0-1&t=tI2XQA8jwAh9EDha-1).
