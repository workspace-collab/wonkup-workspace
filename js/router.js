const routes = [
  { pattern: /^#\/$/, view: 'dashboard' },
  { pattern: /^#\/master\/dashboard$/, view: 'dashboard' },
  { pattern: /^#\/master\/projects$/, view: 'projects' },
  { pattern: /^#\/w\/([^/]+)\/dashboard$/, view: 'dashboard', keys: ['workspaceId'] },
  { pattern: /^#\/w\/([^/]+)\/projects$/, view: 'projects', keys: ['workspaceId'] },
  { pattern: /^#\/w\/([^/]+)\/toolkit$/, view: 'toolkit', keys: ['workspaceId'] },
  { pattern: /^#\/w\/([^/]+)\/kanban$/, view: 'kanban', keys: ['workspaceId'] },
  { pattern: /^#\/w\/([^/]+)\/p\/([^/]+)\/([^/]+)$/, view: 'project', keys: ['workspaceId','projectId','tab'] },
  { pattern: /^#\/placeholder\/([^/]+)$/, view: 'placeholder', keys: ['section'] }
];

export function resolveRoute(hash = location.hash || '#/') {
  for (const route of routes) {
    const match = hash.match(route.pattern);
    if (!match) continue;
    const params = {};
    (route.keys || []).forEach((key, index) => { params[key] = match[index + 1]; });
    return { view: route.view, params, hash };
  }
  return { view: 'notFound', params: {}, hash };
}

export function startRouter(callback) {
  const run = () => callback(resolveRoute());
  window.addEventListener('hashchange', run);
  if (!location.hash) location.hash = '#/master/dashboard';
  run();
}
