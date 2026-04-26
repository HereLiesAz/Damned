/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type TaskStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface IntelTask {
  id: string;
  source: string;
  target?: string;
  type: 'Malware' | 'URL' | 'Packet' | 'Log';
  timestamp: string;
  status: TaskStatus;
  progress: number;
  threat_type?: string;
  analysis_summary?: string;
  severity_score?: number;
}

export interface NodeStatus {
  id: string;
  name: string;
  type: 'collector' | 'analyzer' | 'database';
  load: number;
  status: 'online' | 'offline' | 'busy';
}

export const DATA_SOURCES = [
  'URLhaus Feed',
  'MalwareBazaar',
  'DarkNet Crawl',
  'HoneyPot Cluster-A',
  'Pastebin Monitor'
];

export interface AttackCampaign {
  id: string;
  name: string;
  status: 'planning' | 'active' | 'completed' | 'failed';
  success_rate: number;
  dwell_time: string;
  targets_compromised: number;
  last_activity: string;
}

export interface AttackOperation {
  id: string;
  campaign_id: string;
  type: 'Phishing' | 'Exploit' | 'Exfiltration' | 'C2_Beacon';
  target: string;
  status: TaskStatus;
  progress: number;
  payload?: string;
  technique?: string;
}

export type DashboardMode = 'DEFENSIVE' | 'OFFENSIVE';

export const ANALYSIS_STEPS = [
  'Ingestion',
  'Static Analysis',
  'Dynamic Sandbox',
  'Enrichment',
  'Storage'
];

export const ATTACK_STEPS = [
  'Reconnaissance',
  'Weaponization',
  'Delivery',
  'Exploitation',
  'Installation',
  'Command & Control',
  'Actions on Objectives'
];
