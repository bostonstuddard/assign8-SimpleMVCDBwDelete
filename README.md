# Assignment 8 — Simple MVC with MySQL Database and Delete

**UAFS CSCE 20303 — Assignment 8**

This project builds on Assignment 7's working MySQL-backed user management application. It implements the Assignment 8 changes:

- A separate **Add User** page at `/users/new` (instead of an inline form in the list).
- A **Delete** button for every user on the list, with a JavaScript confirmation prompt.
- A **POST** delete route and a parameterized MySQL `DELETE` query.
- The original **SELECT** and **INSERT** operations, using **MySQL2 callbacks rather than Promises**, as required by Assignment 7.

## Quick run / grading instructions

This is a Node.js/Express application, not a static website. It requires **Node.js 18+** and a running MySQL or MariaDB server. Source uploaded to GitHub is not automatically running on localhost.

1. Open this repository in a terminal on the classroom VM (or any Node.js/MySQL machine).
2. Install the declared dependencies with `npm ci` (or `npm install`).
3. If the Assignment 7 database is not already set up, initialize it **once** using `sudo mysql < assignDB.sql`.
4. Run `npm start` (equivalent to `node server.js`).
5. Visit **http://localhost:3000**.

**Warning:** `assignDB.sql` drops and recreates the `assignDB` database, removing any records previously added. Do not rerun it if you need to preserve existing users.

### MySQL connection defaults

| Setting | Default |
| --- | --- |
| `DB_HOST` | `localhost` |
| `DB_USER` | `assignDBuser` |
| `DB_PASSWORD` | `assignDBpass` |
| `DB_NAME` | `assignDB` |
| `PORT` | `3000` |

Override any setting using environment variables if your VM uses different database credentials.

## Routes

| Method | URL | Purpose |
| --- | --- | --- |
| `GET` | `/` | SELECT and display all users; Add User link and Delete buttons |
| `GET` | `/users/new` | Separate Add User form |
| `POST` | `/users` | Validate fields, INSERT new user and redirect to list |
| `POST` | `/users/:id/delete` | DELETE selected user using a SQL placeholder; redirect to list |

The delete confirmation uses built-in JavaScript `confirm()` on a POST form. Clicking **Cancel** does not send the request. The server validates numeric user IDs and uses parameterized SQL. The delete route cannot be triggered by a GET request.

## Testing

Run `npm test` for model/route/template tests, or view the GitHub **Actions** tab for automated test results after upload. These tests use mocked MySQL and Express to verify logic without touching the real database; a configured MySQL service is still necessary for the actual app.

## Uploading to GitHub using only the web interface

Unzip the supplied archive. Open your **Assignment 8 repository** at `https://github.com/bostonstuddard/assign8-SimpleMVCDBwDelete`, click **Add file → Upload files**, and upload the **contents** of the extracted folder, preserving `models`, `views`, `tests`, and `.github/workflows`. Replace the existing README when prompted. Commit changes. Do not upload just the ZIP as a file or nest all contents inside another project folder.

**Classroom note:** `assignDB.sql` includes a password column with plaintext example data to match the instructor's schema; real applications should hash passwords and never display them.

[Original Assignment 8 reference screenshot](https://github.com/UAFS-CSCE20303/assign8-SimpleMVCDBwDelete/blob/main/listwdelete.png)
