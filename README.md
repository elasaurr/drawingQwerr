# DrawingQwerr

This is a code bundle for Drawing App.

## Running the code

### Option A. using npm run dev

Run `npm i` to install the dependencies.

Run `npm run dev` to start the development server.

#### on another terminal,

Run `cd backend`
Run `npm i`
Run `npm run dev`

### Option B. using run.bat

Run `./run.bat` to start both backend and frontend server

## Project Summary

DrawingQwerr is a web-based drawing application that provides a collaborative single-user drawing experience with persistent storage and account management. Key user-facing capabilities:

-   Interactive canvas with brushes, shapes, eraser and size/quality controls.
-   Multi-layer support and layer panel UI for organizing strokes.
-   Undo / redo, clear, history and canvas presets for new drawings.
-   Export and download drawings as PNG; thumbnail generation for gallery.
-   User gallery / dashboard with thumbnails and per-user listing.
-   Premium features gated behind subscription flow.
-   Client-side flow and components:
    -   Auth context and hooks: src/contexts/AuthContext.tsx
    -   Protected routes: src/App.tsx (ProtectedRoute)
    -   Canvas and layer UI: src/components/DrawingCanvas.tsx, src/components/LayerPanel.tsx
    -   API clients: src/api/_.ts and src/services/_.ts

## Security Features

Security hardening implemented across backend and client:

-   Authentication & Authorization

    -   Backend authentication endpoints and Supabase integration: backend/routes/users.js and backend/supabaseClient.js.
    -   Token verification and per-request auth enforcement via backend/middleware/authMiddleware.js.
    -   Client enforces protected UI routes via ProtectedRoute and attaches bearer tokens with helpers in src/api/users.ts.

-   Input validation

    -   Zod schemas and centralized validation middleware protect endpoints (backend/middleware/validation.js).

-   Rate limiting

    -   Global and sensitive-route limits using express-rate-limit (configured in backend/server.js).

-   Secure headers & CORS

    -   Helmet to set secure HTTP headers and explicit CORS origin/credentials configuration in backend/server.js.

-   Payload and file safety

    -   Request size limits for JSON and uploads to mitigate large payload abuse.
    -   File validation (content-type checks, dataURL -> buffer conversion, PNG checks) before storage in backend/routes/drawings.js.
    -   Safe storage via Supabase Storage with controlled content types and signed URLs.

-   XSS & sanitization

    -   User-supplied strings (e.g., display names) sanitized before persistence (backend/routes/users.js).

-   Error handling

    -   Centralized error handler that avoids leaking stack traces in production (backend/server.js).

-   Client protections
    -   Protected UI routes, auth-aware API helpers, and client-side checks to reduce accidental exposure of actions to unauthenticated users.

## Where to look (important files)

-   Backend entry and middleware: backend/server.js, backend/middleware/authMiddleware.js, backend/middleware/validation.js
-   Auth & user routes: backend/routes/users.js
-   Drawings / upload routes: backend/routes/drawings.js
-   Supabase client: backend/supabaseClient.js
-   Client auth + routing: src/contexts/AuthContext.tsx, src/App.tsx
-   Canvas and components: src/components/DrawingCanvas.tsx, src/components/LayerPanel.tsx
-   API helpers: src/api/users.ts, src/api/drawings.ts, src/services/drawingsService.ts

## Notes

-   Keep environment secrets (Supabase keys, JWT secrets) out of the repo and set them via environment variables.
-   If you want specific wording or additional run instructions added to this README, tell me what to include.
