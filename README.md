# AI Customer Support SaaS

This is a monorepo containing the source code for the AI Customer Support SaaS.

## Architecture Structure

The project follows a monorepo structure with the following services:

### `/apps`
*   **`web`**: The external-facing web application and dashboard.
    *   **Tech**: Next.js 14, React, TailwindCSS.
    *   **Role**: Handles UI, Authentication, and Business Logic API.
*   **`worker`**: The background AI processing service.
    *   **Tech**: Python, FastAPI, Celery/BullMQ.
    *   **Role**: Handles heavy lifting: File ingestion, chunking, embedding generation, and RAG retrieval.

### `/packages`
*   **`shared`**: Shared configurations and types (TypeScript interfaces, shared constants).

## Getting Started

### Prerequisites
*   Node.js 18+
*   Python 3.10+
*   Docker & Docker Compose

### Setup
*(Instructions to be added after full initialization)*
