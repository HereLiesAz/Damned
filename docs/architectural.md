# Damned Architectural Overview

## System Architecture

Damned consists of a frontend dashboard built with React and Vite, supported by a backend Express server that acts as a Cyber Threat Intelligence (CTI) proxy.

### Frontend Dashboard (`src/`)
- **React UI**: A single-page application focused on high performance and dark-themed visualization.
- **State Management**: Utilizes React hooks (`useState`, `useEffect`) to manage real-time updates for tasks, operations, and staged payloads.
- **Styling**: Tailwind CSS is used for rapid, utility-first styling, adhering strictly to the monochromatic, low-key lighting aesthetic.
- **AI Integration**: The frontend sends requests to the backend proxy, which uses the `@google/genai` SDK to connect to Google's Gemini models for on-the-fly threat enrichment and target profiling.
- **Components**: Modular design including components for the task queue, pipeline visualizer, stat cards, and detailed analysis panels.

### Backend Proxy (`server.ts`)
- **Express Server**: Handles API requests from the frontend and serves the built application in production.
- **Threat Data Collection**: Periodically fetches real-time indicators of compromise (IOCs) from external APIs such as Abuse.ch's URLhaus.
- **Operation Simulation**: Simulates the dispatching of offensive operations, maintaining an in-memory state of active campaigns and staged payloads.
- **File Management**: Provides mock endpoints for uploading, deleting, and fetching payload artifacts.

### Data Flow
1. **Ingestion**: The backend proxy polls external CTI sources and formats the data into `IntelTask` objects.
2. **Retrieval**: The frontend periodically requests the aggregated tasks from the backend.
3. **Enrichment**: The frontend sends selected tasks to the backend proxy, which securely queries the Gemini API for natural language analysis and risk scoring.
4. **Simulation**: User actions in Offensive Mode trigger API calls to the backend, which updates the state of simulated operations and returns the results to the UI.

### Type Definitions (`src/types.ts`)
Defines the core data structures used across the application:
- `IntelTask`: Represents a unit of threat intelligence.
- `AttackCampaign`: Groups related attack operations.
- `AttackOperation`: Represents a specific simulated attack event.