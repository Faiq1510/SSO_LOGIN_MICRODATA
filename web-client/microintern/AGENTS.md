# Coding Agent Instructions

## 1. Core Mandates

- **Always consult the documentation index**: Use `docs/README.md` as the main index for all business logic, user roles, data models, and features. From there, navigate to specific files (e.g., `features-peserta.md`, `data-model.md`) as needed.
- **Always follow `database/schema.sql`**: This is the single source of truth for the database schema. Do not hallucinate or guess tables/columns.
- **Sync database schemas**: If you modify `database/schema.sql`, you must also modify the corresponding schema migrations under `backend/src/database/migration` to ensure they are synchronized, and vice versa.
- **No Comments Allowed**: You are STRICTLY FORBIDDEN from writing any comments in the codebase (both frontend and backend). The ONLY exception is Swagger docs API comments in the backend.
- **No Unused Variables/Functions**: You must ensure there are NO unused functions, variables, or parameters in the codebase. Both frontend and backend must strictly adhere to this rule. Prefix unused parameters with `_` if they are structurally mandatory.
- **Always pull/fetch latest code**: Before starting coding and after completing coding, you must run `git fetch --all` and `git pull` on all branches to ensure the codebase is completely up-to-date.
- **Check for conflicts with `main`**: If working on a branch other than `main`, check if the current branch conflicts with `main` (e.g., by performing a simulated/dry-run merge) both before starting coding and after completing coding, as the current branch will eventually be merged into `main`.
- **Clean Up One-Time Scripts**: Always delete any temporary, one-time scripts or files you create for debugging or refactoring purposes immediately after use.
- **Do NOT use `npm run dev`**: Never run `npm run dev` to verify frontend changes. Always use `npm run build` in the frontend directory to ensure the build passes and strict checks are verified.
- **Update Documentation**: If you make any changes to the codebase (features, endpoints, schemas, business logic), you MUST update the corresponding files in the `docs/*` directory to accurately reflect those changes.
- **No ALTER TABLE**: When modifying the database schema, do NOT use `ALTER TABLE` queries or create new migration scripts with `ALTER TABLE`. Instead, directly modify the existing `CREATE TABLE` queries in `database/schema.sql` and the original schema migration files.

## 2. Post-Coding Workflow

After making any code changes and before finalizing a task, you MUST run the following validation steps. If any step fails, you must fix the errors before proceeding.

1. **Formatting**: Run `npm run format` from the root directory.
2. **Linting**: Run `cd frontend && npm run lint` to check frontend code.
3. **Type Checking**:
   - Run `cd frontend && npx tsc --noEmit`
   - Run `cd backend && npx tsc --noEmit`
