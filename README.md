# QuotesRank

![](/preview.jpg)

**QuotesRank** is a basic full stack web development project designed to serve as a community-driven site for sharing quotes. I initially made it with *PHP* and *MySQL* while learning the basics of the language, and decided to do it again in *JavaScript* while learning *Node.js*.

The application is built with an API through which every feature of site can be used. The frontend is server-side rendered (SSR), but there is client-side JavaScript code that interacts with the backend API, and handles application logic. The layout is also designed to be responsive to different screen sizes.

## Technologies

- Backend;
  - Node.js
  - Express.js (web application framework)
  - EJS (template engine)
  - MongoDB (database server)
- Frontent;
  - HTML
  - CSS (SASS)
  - JavaScript

## Installation

1. Clone the repo

```bash
git clone https://github.com/4g3nt47/QuotesRank.git
cd QuotesRank
```

2. Install dependencies

```bash
npm install
```

3. Setup a *MongoDB* database, and update the `.env` file with it's connection details. Also make sure to change the `SECRET` in use.

4. Import the default quotes

```bash
mongoimport <db-url> -c quotes --file data/quotes.json --jsonArray
```

5. Start the application

```bash
node index.js
```

Note: To create an admin user in the web app, you will need to manually update the `users` collection (after creating a user account) and set the `admin` field to `true`.
