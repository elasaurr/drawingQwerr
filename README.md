# DrawingQwerr

Short web-based drawing application with user accounts, persistent storage, gallery, and premium gating.

## Project Summary

-   Interactive canvas: brushes, shapes, eraser, size/quality, multi-layer support, undo/redo, presets.
-   Export: PNG download and thumbnail generation.
-   User gallery/dashboard: per-user listings and thumbnails.
-   Account flows: signup, login, logout, profile.
-   Premium subscription: gated premium features and UI.
-   Client structure: React + hooks, auth context, protected routes, API clients.
-   Backend: REST API, upload handling, Supabase storage/integration.

## Key Features

-   Canvas editor (DrawingCanvas) and LayerPanel UI.
-   Per-user galleries and thumbnail generation.
-   Upload/save drawings to Supabase Storage.
-   Protected UI routes and authenticated API actions.
-   Rate-limited auth endpoints and payload size limits.

## Security Features

-   Authentication & Authorization
    -   Supabase-backed auth and backend token verification (authMiddleware).
    -   Per-route ownership checks (compare req.user.id to resource owner).
-   Input validation
    -   Zod schemas and centralized validation middleware.
-   Rate limiting
    -   express-rate-limit for global and auth-sensitive endpoints.
-   Secure headers & CORS
    -   Helmet and restricted CORS origin/credentials.
-   Payload & file safety
    -   JSON/upload size limits, dataURL -> buffer conversion, content-type checks, PNG validation.
    -   Safe storage using Supabase Storage with controlled content types and signed URLs.
-   XSS mitigation
    -   Sanitization of user-supplied strings before persistence.
-   Centralized error handling
    -   Sanitized errors in production; full details only in non-production.
-   Client protections
    -   ProtectedRoute, useAuth, and API helpers that attach Bearer tokens.

## Technologies Used

-   Frontend
    -   React
    -   Axios / fetch for API calls
-   Backend
    -   Node.js, Express
    -   Zod for validation
    -   express-rate-limit
    -   Helmet
    -   Cors
    -   Supabase (Auth + Storage + Database)
-   Storage & Hosting
    -   Supabase Storage
-   Environment
    -   dotenv for secrets and API keys

## Important Files / Where to look

-   Backend: backend/server.js, backend/middleware/authMiddleware.js, backend/middleware/validation.js, backend/routes/users.js, backend/routes/drawings.js, backend/supabaseClient.js
-   Frontend: src/contexts/AuthContext.tsx, src/App.tsx (ProtectedRoute), src/components/DrawingCanvas.tsx, src/components/LayerPanel.tsx, src/api/users.ts, src/api/drawings.ts, src/services/drawingsService.ts

## Notes

-   Keep Supabase keys, JWT secrets and other env vars out of repo and configure them in the environment.
-   If you want this README expanded with run instructions, environment variables list, or badges, tell me which sections to add.
