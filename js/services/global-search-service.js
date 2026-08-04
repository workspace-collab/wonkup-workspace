import { ProjectService } from './project-service.js';
import { KanbanService } from './kanban-service.js';
import { DemoService } from './demo-service.js';
import { canvasTemplates } from '../../data/canvas-templates.js';

function includesQuery(values, query) {
  return values.filter(Boolean).join(' ').toLocaleLowerCase('es').includes(query);
}

export const GlobalSearchService = {
  async search({ query, workspaceId, session }) {
    const normalized = String(query || '').trim().toLocaleLowerCase('es');
    if (normalized.length < 2) return [];
    const projects = await ProjectService.listProjects({ workspaceId, session, includeArchived: false });
    const projectResults = projects
      .filter(project => includesQuery([project.name, project.code, project.tagline, project.description, project.client], normalized))
      .slice(0, 6)
      .map(project => ({
        id: `project-${project.id}`, type: 'Proyecto', title: project.name,
        subtitle: `${project.code} · ${project.client || 'Sin cliente'}`,
        href: `#/w/${project.workspaceId}/p/${project.id}/summary`, icon: 'folder'
      }));

    const clients = await ProjectService.listClients({ workspaceId, session, includeArchived: false }).catch(() => []);
    const clientResults = clients
      .filter(client => includesQuery([client.name, client.contactName, client.email], normalized))
      .slice(0, 5)
      .map(client => ({
        id: `client-${client.id}`, type: 'Cliente', title: client.name,
        subtitle: client.contactName || client.email || 'Cliente',
        href: workspaceId === 'all' ? '#/master/clients' : `#/w/${client.workspaceId}/clients`, icon: 'user'
      }));

    const boardResults = [];
    for (const project of projects.slice(0, 15)) {
      try {
        const board = await KanbanService.getBoard({ projectId: project.id, workspaceId: project.workspaceId, session });
        board.cards
          .filter(card => includesQuery([card.title, card.description, ...(card.labels || []).map(label => label.name)], normalized))
          .slice(0, 4)
          .forEach(card => boardResults.push({
            id: `task-${card.id}`, type: 'Tarea', title: card.title,
            subtitle: project.name,
            href: `#/w/${project.workspaceId}/p/${project.id}/kanban`, icon: 'checkSquare'
          }));
      } catch {
        // Ignore boards unavailable to the current role.
      }
      if (boardResults.length >= 8) break;
    }

    const canvasResults = canvasTemplates
      .filter(template => includesQuery([template.name, template.description], normalized))
      .slice(0, 4)
      .map(template => ({
        id: `canvas-${template.id}`, type: 'Herramienta', title: template.name,
        subtitle: 'Innovation Toolkit',
        href: workspaceId === 'all' ? '#/master/toolkit' : `#/w/${workspaceId}/toolkit`, icon: 'lightbulb'
      }));

    return [...projectResults, ...boardResults.slice(0, 8), ...clientResults, ...canvasResults].slice(0, 18);
  }
};
