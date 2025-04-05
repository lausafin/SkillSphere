# Skill Sphere - Backend (NestJS)

## Setup

1.  **Install Dependencies:**
    ```bash
    npm install
    ```

2.  **Setup Environment Variables:**
    *   Copy `.env.example` to `.env`.
    *   Update `DATABASE_URL` with your database connection string (e.g., PostgreSQL).
    *   Set a strong `JWT_SECRET`.

3.  **Database Migration:**
    *   Ensure your database server is running.
    *   Run Prisma migrations to create the database schema:
        ```bash
        npx prisma migrate dev --name init
        ```
    *   Generate Prisma Client:
        ```bash
        npx prisma generate
        ```

4.  **Run the Development Server:**
    ```bash
    npm run start:dev
    ```
    The server should start, typically on `http://localhost:3000`.

## Available Scripts

*   `npm run start:dev`: Start in watch mode.
*   `npm run build`: Build for production.
*   `npm run start:prod`: Run production build.
*   `npm run lint`: Lint code.
*   `npm run format`: Format code with Prettier.
*   `npm run db:migrate:dev`: Run database migrations.
*   `npm run db:generate`: Regenerate Prisma Client.
*   `npm run db:studio`: Open Prisma Studio GUI.