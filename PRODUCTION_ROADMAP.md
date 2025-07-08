# Production-Ready Roadmap

This document outlines the actionable steps to prepare the application for a stable, secure, and scalable production launch. The plan leverages the existing infrastructure and CI/CD pipeline, focusing on fortifying the application with quality gates, comprehensive testing, and security hardening.

---

### Phase 1: Fortify the CI/CD Pipeline with Quality Gates

**Goal:** Ensure that no code that is untested or fails quality checks can be deployed to production. This is the highest priority.

1.  **Enable Automated Testing:**
    *   **Action:** In `.github/workflows/deploy.yml`, uncomment the `Run tests` step.
    *   **Reason:** This is the single most important change to prevent regressions and ensure new features work as expected.

2.  **Add Linting and Formatting Checks:**
    *   **Action:** Add the following steps to `.github/workflows/deploy.yml` right after `Install dependencies`.
        ```yaml
        - name: Lint Code
          run: pnpm lint

        - name: Check Formatting
          run: pnpm format --check
        ```
    *   **Reason:** This enforces code consistency and catches potential errors before they are even tested or deployed.

3.  **Enforce Strict Dependency Management:**
    *   **Action:** In the `Install dependencies` step of `.github/workflows/deploy.yml`, change `pnpm install --no-frozen-lockfile` to `pnpm install --frozen-lockfile`.
    *   **Reason:** This guarantees that the exact same dependency versions are used in CI as in your local environment, preventing "it works on my machine" issues.

---

### Phase 2: Build the Test Suite

**Goal:** Create the comprehensive test suite that the newly enabled CI pipeline will run.

1.  **API Integration Tests (High Priority):**
    *   Write tests for every API endpoint to verify business logic, error handling, and authentication/authorization rules.

2.  **Unit Tests for Business Logic:**
    *   Write unit tests for critical composables (e.g., `useDreamManagement`, `useImageGeneration`) and server-side utilities.

3.  **Component Tests:**
    *   Write tests for key interactive UI components to ensure they render and behave correctly.

---

### Phase 3: Harden Security & Monitoring

**Goal:** Gain full visibility into backend issues and lock down potential attack vectors.

1.  **Implement Server-Side Error Monitoring:**
    *   **Action:** Create and configure `sentry.server.config.ts` to capture and report all backend errors to Sentry.
    *   **Reason:** You are currently blind to errors happening in your server APIs. This is critical for production stability.

2.  **Implement API Rate Limiting:**
    *   **Action:** Add rate limiting to sensitive endpoints like `/login`, `/register`, and `/forgot-password`.
    *   **Reason:** This protects your application from brute-force attacks and abuse.

3.  **Enforce Input Validation:**
    *   **Action:** Use `zod` to define and enforce schemas for the request bodies of all `POST` and `PUT` API endpoints.
    *   **Reason:** This prevents malformed data from reaching your business logic or database.

---

### Phase 4: Performance & Documentation

**Goal:** Ensure a fast user experience and document the project for future maintainability.

1.  **Image Delivery Optimization:**
    *   Implement a service or library to automatically resize images for different viewports (e.g., thumbnails, full-size views) and serve them in a modern format like WebP.

2.  **Implement a CDN:**
    *   Configure a CDN (like Cloudflare or BunnyCDN) to cache static assets and reduce global latency for your users.

3.  **Finalize Documentation:**
    *   Create a `CONTRIBUTING.md` file that outlines the development workflow, including the new CI quality gates.
    *   Update the `README.md` to reflect the final production architecture and deployment process.