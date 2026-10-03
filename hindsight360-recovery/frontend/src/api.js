/**
 * HINDSIGHT360 API Client
 * Connects frontend views to FastAPI endpoints
 */

const API_BASE_URL = import.meta.env?.VITE_API_URL || 'http://localhost:8000';

export async function fetchStats() {
  const res = await fetch(`${API_BASE_URL}/api/matches/stats`);
  if (!res.ok) throw new Error('Failed to fetch stats');
  return res.json();
}

export async function fetchCustomers(query = '') {
  const url = query 
    ? `${API_BASE_URL}/api/customers/?q=${encodeURIComponent(query)}`
    : `${API_BASE_URL}/api/customers/`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch customers');
  return res.json();
}

export async function createCustomer(customerData) {
  const res = await fetch(`${API_BASE_URL}/api/customers/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(customerData),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || 'Failed to create customer');
  }
  return res.json();
}

export async function fetchProperties(query = '', sourceType = '') {
  let url = `${API_BASE_URL}/api/properties/?`;
  if (query) url += `q=${encodeURIComponent(query)}&`;
  if (sourceType) url += `source_type=${encodeURIComponent(sourceType)}&`;
  
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch properties');
  return res.json();
}

export async function simulatePropertyIngest() {
  const res = await fetch(`${API_BASE_URL}/api/properties/simulate-ingest`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to simulate ingest');
  return res.json();
}

export async function fetchMatches(status = '') {
  const url = status 
    ? `${API_BASE_URL}/api/matches/?status=${encodeURIComponent(status)}`
    : `${API_BASE_URL}/api/matches/`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch matches');
  return res.json();
}

export async function triggerMatchingRun(weights = {}) {
  const res = await fetch(`${API_BASE_URL}/api/matches/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(weights),
  });
  if (!res.ok) throw new Error('Failed to run matching pipeline');
  return res.json();
}

export async function triageMatch(matchId, triageData) {
  const res = await fetch(`${API_BASE_URL}/api/matches/${matchId}/triage`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(triageData),
  });
  if (!res.ok) throw new Error('Failed to triage match');
  return res.json();
}

export function getExportUrl() {
  return `${API_BASE_URL}/api/matches/export`;
}
