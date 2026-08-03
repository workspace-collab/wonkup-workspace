import { DemoService } from '../services/demo-service.js';
import { icon } from '../utils/icons.js';
import { escapeHtml } from '../utils/format.js';
export function renderToolkit(container,workspaceId,projectId=null,embedded=false){
  const tools=DemoService.getCanvasTemplates();
  container.innerHTML=`<section class="${embedded?'':'page'}" style="${embedded?'margin-top:18px':''}">${embedded?'':`<div class="page-header"><div><h1>Innovation Toolkit</h1><p>Metodologias integradas para comprender, validar, priorizar y presentar proyectos.</p></div><div class="page-header-actions"><button class="button button-primary">${icon('plus')} Nuevo canvas</button></div></div>`}<div class="toolkit-grid">${tools.map(t=>`<article class="tool-card"><div class="tool-icon" style="background:${t.color}">${icon(t.icon)}</div><h3>${escapeHtml(t.name)}</h3><p>${escapeHtml(t.description)}</p><div class="tool-meta"><span>${t.updated}</span><span>${t.progress}%</span></div><button class="button button-secondary" style="margin-top:12px" data-tool="${t.id}">Abrir herramienta ${icon('arrowRight')}</button></article>`).join('')}</div></section>`;
  container.querySelectorAll('[data-tool]').forEach(btn=>btn.addEventListener('click',()=>alert('Canvas Engine se implementara en la Entrega 5.')));
}
