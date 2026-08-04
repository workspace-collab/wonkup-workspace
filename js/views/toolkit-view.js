import { DemoService } from '../services/demo-service.js';
import { canEditCanvas } from '../utils/permissions.js';
import { icon } from '../utils/icons.js';
import { escapeHtml } from '../utils/format.js';

export function renderToolkit(container, workspaceId, projectId = null, embedded = false, session = null) {
  const tools = DemoService.getCanvasTemplates();
  container.innerHTML = `<section class="${embedded ? '' : 'page'}" style="${embedded ? 'margin-top:18px' : ''}">${embedded ? '' : `<div class="page-header"><div><h1>Innovation Toolkit</h1><p>Metodologías integradas para comprender, validar, priorizar y presentar proyectos.</p></div>${canEditCanvas(session) ? `<div class="page-header-actions"><button class="button button-primary">${icon('plus')} Nuevo canvas</button></div>` : ''}</div>`}<div class="toolkit-grid">${tools.map(tool => `<article class="tool-card"><div class="tool-icon" style="background:${tool.color}">${icon(tool.icon)}</div><h3>${escapeHtml(tool.name)}</h3><p>${escapeHtml(tool.description)}</p><div class="tool-meta"><span>${tool.updated}</span><span>${tool.progress}%</span></div><button class="button button-secondary" style="margin-top:12px" data-tool="${tool.id}">Abrir herramienta ${icon('arrowRight')}</button></article>`).join('')}</div></section>`;
  container.querySelectorAll('[data-tool]').forEach(button => button.addEventListener('click', () => alert('Canvas Engine se implementará en la Entrega 5.')));
}
