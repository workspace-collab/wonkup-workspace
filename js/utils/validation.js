import { clamp } from './format.js?v=12.3.0';

export function normalizeText(value, maxLength = 500) {
  return String(value ?? '').trim().slice(0, maxLength);
}

export function normalizeUrl(value) {
  const raw = normalizeText(value, 1000);
  if (!raw) return '';
  try {
    const url = new URL(raw);
    if (!['http:', 'https:'].includes(url.protocol)) return '';
    return url.toString();
  } catch {
    return '';
  }
}

export function normalizeAssetUrl(value) {
  const raw = normalizeText(value, 1000);
  if (!raw) return '';
  if (/^(?:\.\/)?assets\/[a-zA-Z0-9_./-]+$/.test(raw)) return raw.startsWith('./') ? raw : `./${raw}`;
  return normalizeUrl(raw);
}


export function normalizeHexColor(value, fallback = '#50a8f3') {
  const raw = normalizeText(value, 20);
  return /^#[0-9a-fA-F]{6}$/.test(raw) ? raw.toLowerCase() : fallback;
}

export function isValidEmail(value) {
  const email = normalizeText(value, 254);
  return !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidDateRange(startDate, dueDate) {
  if (!startDate || !dueDate) return true;
  return new Date(startDate).getTime() <= new Date(dueDate).getTime();
}

export function slugify(value) {
  return normalizeText(value, 120)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

export function normalizeProjectInput(input = {}) {
  return {
    workspaceId: normalizeText(input.workspaceId, 80),
    clientId: normalizeText(input.clientId, 80),
    name: normalizeText(input.name, 120),
    tagline: normalizeText(input.tagline, 180),
    description: normalizeText(input.description, 2000),
    ownerUserId: normalizeText(input.ownerUserId, 80),
    status: normalizeText(input.status, 40) || 'planned',
    stage: normalizeText(input.stage, 40) || 'definition',
    priority: normalizeText(input.priority, 20) || 'medium',
    health: normalizeText(input.health, 20) || 'green',
    progress: clamp(input.progress, 0, 100),
    startDate: normalizeText(input.startDate, 20),
    dueDate: normalizeText(input.dueDate, 20),
    budget: Math.max(0, Number(input.budget || 0)),
    logo: normalizeAssetUrl(input.logo),
    coverImage: normalizeAssetUrl(input.coverImage),
    brandColor: normalizeHexColor(input.brandColor),
    githubUrl: normalizeUrl(input.githubUrl),
    figmaUrl: normalizeUrl(input.figmaUrl),
    hostingUrl: normalizeUrl(input.hostingUrl),
    domain: normalizeText(input.domain, 180)
  };
}

export function validateProjectInput(input) {
  const errors = {};
  if (!input.workspaceId) errors.workspaceId = 'Selecciona un workspace.';
  if (!input.name || input.name.length < 3) errors.name = 'Escribe un nombre de al menos 3 caracteres.';
  if (!input.ownerUserId) errors.ownerUserId = 'Selecciona un responsable.';
  if (!isValidDateRange(input.startDate, input.dueDate)) errors.dueDate = 'La entrega no puede ser anterior al inicio.';
  return errors;
}
