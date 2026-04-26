# Damned Operational Guide

## Overview
This guide provides instructions on how to operate the Damned infrastructure, covering both Defensive and Offensive modes.

## Defensive Mode (Damned)
In Defensive Mode, the system acts as an automated intelligence pipeline.

### Active Thread Queue
The queue displays live ingestion of threat data from external sources (e.g., URLhaus).
- **Processing**: Threats are automatically fetched and enqueued.
- **Analysis**: The system uses Google Gemini AI to analyze the threat, determine its potential business impact, and assign a numeric risk score (0-100).
- **Extracted IOCs**: High-risk domains are extracted and listed for further investigation.

### Operations
1. Use the **Refresh** button in the header to manually pull new intelligence feeds.
2. Select a thread from the queue to view detailed AI-enriched analysis in the right panel.

## Offensive Mode (Specter)
In Offensive Mode, the system serves as a red-team simulation engine.

### Target Intelligence
1. Enter a target (e.g., a phone number or email) in the **Operation Configuration** panel.
2. Click **AI Intel** to generate a "Target Profile" and suggest "Personalized Attack Vectors" using AI.

### Campaign Configuration
1. **Op Type**: Select between Phishing, Exploit, Exfiltration, or Scan.
2. **Technique**: Choose a specific technique based on the operation type (e.g., Spear Phishing, RCE).
3. **Payload Management**: Stage, upload, and configure artifacts (C2, Loader, Support) for deployment.
4. **Execution**: Dispatch the attack via WhatsApp, SMS, Facebook Messenger, or Network modules.

### Active Campaigns
Monitor the success rate, compromised nodes, and dwell time of live operations in the Active Campaigns panel.