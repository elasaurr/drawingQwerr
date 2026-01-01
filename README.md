# Drawing App

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

# Project Features

This project (SketchArt) provides a web-based drawing application with the following features:

-   User authentication and session management (signup / login / logout).
    -   Frontend auth hooks and provider: [`useAuth`](src/contexts/AuthContext.tsx) in [src/contexts/AuthContext.tsx](src/contexts/AuthContext.tsx).
    -   Protected client routes: [`ProtectedRoute`](src/App.tsx) in [src/App.tsx](src/App.tsx).
-   Canvas editor with:
    -   Multiple layers and layer panel UI: [src/components/LayerPanel.tsx](src/components/LayerPanel.tsx) and exported type [`Layer`](src/components/LayerPanel.tsx).
    -   Brushes, erase, shapes, undo/redo, clear and history.
    -   Save and download (PNG) functionality integrated with backend storage: client/service code in [src/components/DrawingCanvas.tsx](src/components/DrawingCanvas.tsx) and [src/services/drawingsService.ts](src/services/drawingsService.ts).
-   Gallery / dashboard:
    -   User gallery listing and thumbnails: backend API used via [src/api/drawings.ts](src/api/drawings.ts) and service [`drawingsService`](src/services/drawingsService.ts).
-   New-canvas presets, quality slider and export settings: [src/components/NewCanvasDialog.tsx](src/components/NewCanvasDialog.tsx).
-   Premium subscription flow and gated premium features: frontend pages [src/components/PremiumPage.tsx](src/components/PremiumPage.tsx) and server-side profile handling in [backend/routes/users.js](backend/routes/users.js).

# Security Features Implemented

Backend security hardening and validation:

-   Input validation with Zod:
    -   Centralized middleware: [`validate`](backend/middleware/validation.js) and schemas like [`signupSchema`](backend/middleware/validation.js), [`loginSchema`](backend/middleware/validation.js), [`drawingSchema`](backend/middleware/validation.js), [`updateDrawingSchema`](backend/middleware/validation.js). See [backend/middleware/validation.js](backend/middleware/validation.js).
-   Authentication middleware:
    -   Auth enforcement for protected endpoints via [`authMiddleware`](backend/middleware/authMiddleware.js) and helper [`createAuthenticatedClient`](backend/middleware/authMiddleware.js). See [backend/middleware/authMiddleware.js](backend/middleware/authMiddleware.js).
    -   Supabase-backed auth flows are implemented in [backend/routes/users.js](backend/routes/users.js) and the Supabase client is configured in [backend/supabaseClient.js](backend/supabaseClient.js).
-   Rate limiting:
    -   Global and sensitive-route rate limiting configured with express-rate-limit (login/signup limits). See [backend/server.js](backend/server.js) (variables such as `limiter` and `authLimiter`).
-   Secure HTTP headers:
    -   Helmet is used to set safe default HTTP headers. See [backend/server.js](backend/server.js).
-   CORS restrictions:
    -   CORS origin and credentials configured to limit allowable client origins. See [backend/server.js](backend/server.js).
-   Payload size limits:
    -   JSON / upload size limits set globally and per-route to prevent large payload abuse. See [backend/server.js](backend/server.js) and route-specific limits such as the drawings upload route in [backend/routes/drawings.js](backend/routes/drawings.js).
-   File validation and safe storage:
    -   Uploaded thumbnails/images are validated and converted safely using helper functions like [`dataURLToBuffer`](backend/routes/drawings.js) and [`isPng`](backend/routes/drawings.js). See [backend/routes/drawings.js](backend/routes/drawings.js).
    -   Files are uploaded to Supabase Storage with controlled content type and signed URL generation for safe access. See [backend/routes/drawings.js](backend/routes/drawings.js).
-   XSS mitigation:
    -   User-supplied strings (e.g., usernames) are sanitized using `xss` before database insertion. See [backend/routes/users.js](backend/routes/users.js).
-   Error handling:
    -   A centralized error handler returns sanitized error messages in non-production and avoids leaking stack traces in production. See error middleware in [backend/server.js](backend/server.js).
-   Client-side route protection and auth usage:
    -   Client enforces protected UI routes via [`ProtectedRoute`](src/App.tsx) and uses [`useAuth`](src/contexts/AuthContext.tsx) to gate actions.
    -   API calls attach auth headers via helper in [src/api/users.ts](src/api/users.ts) (see [`getAuthHeader`](src/api/users.ts)) and drawing APIs in [src/api/drawings.ts](src/api/drawings.ts).
