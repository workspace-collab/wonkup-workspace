import { DemoService } from '../services/demo-service.js';
import { canEditCanvas } from '../utils/permissions.js';
import { icon } from '../utils/icons.js';
import { escapeHtml } from '../utils/format.js';

export function renderToolkit(container, workspaceId, projectId = null, embedded = false, session = null) {
  const tools = DemoService.getCanvasTemplates();
  container.innerHTML = `<section class="${embedded ? '' : 'page'}" style="${embedded ? 'margin-top:18px' : ''}">${embedded ? '' : `<div class="page-header"><div><h1>Innovation Toolkit</h1><p>Metodologías integradas para comprender, validar, priorizar y presentar proyectos.</p></div>${canEditCanvas(session) ? `<div class="page-header-actions"><button class="button button-primary" disabled title="Disponible en la próxima fase">${icon('plus')} Nuevo canvas · Próximamente</button></div>` : ''}</div>`}<div class="toolkit-grid">${tools.map(tool => `<article class="tool-card"><div class="tool-icon" style="background:${tool.color}">${icon(tool.icon)}</div><h2>${escapeHtml(tool.name)}</h2><p>${escapeHtml(tool.description)}</p><div class="tool-meta"><span>${tool.updated}</span><span>${tool.progress}%</span></div><button class="button button-secondary" style="margin-top:12px" type="button" disabled title="Disponible en la próxima fase">Próximamente</button></article>`).join('')}</div></section>`;
}
