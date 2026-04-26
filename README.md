# Damned - Automated Intel Infrastructure

Damned is a high-performance, automated infrastructure for cyber threat intelligence collection, analysis, and visualization. It provides both defensive and offensive modes for analyzing malicious payloads and simulating cyber campaigns.

## Features
- **Defensive Mode**: Automated intelligence pipeline, live ingestion, task queue, and threat analysis powered by AI.
- **Offensive Mode**: Adversary emulation cycle, campaign execution, payload staging, and target intelligence gathering.
- **Visuals**: A clean, high-contrast, minimalist UI built with React and Tailwind CSS.
- **Backend Proxy**: Express-based CTI proxy server that collects real-time threat data from sources like URLhaus.
- **AI Integration**: Leverages Google's Gemini AI to enrich threat intelligence and analyze target profiles.

## Installation

### Prerequisites
- Node.js
- An active Google Gemini API Key

### Setup
1. Clone the repository and navigate to the root directory.
2. Install the dependencies:
   ```bash
   npm install
   ```
3. Set up the environment variables:
   - Copy `.env.example` to `.env`.
   - Add your `GEMINI_API_KEY` to the `.env` file.
   - Configure Twilio or Meta WhatsApp Business API settings if you intend to use the offensive messaging features.
4. Run the application:
   ```bash
   npm run dev
   ```

## Documentation
- [Operational Guide](docs/operational.md)
- [Architectural Overview](docs/architectural.md)

## Visual Style Guidelines
When developing or modifying visuals, ensure adherence to the aesthetic guidelines specified in `AGENTS.md`:
- Monochromatic, minimalist, high-contrast, dark theme.

## Deployment
This app supports deployment via GitHub Pages. Please refer to `.github/workflows/deploy.yml` for the CI/CD configuration.
