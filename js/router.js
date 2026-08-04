const routes = [
  { pattern: /^#\/access(?:\?reason=([^&]+))?$/, view: 'access', keys: ['reason'] },
  { pattern: /^#\/forbidden$/, view: 'forbidden' },
  { pattern: /^#\/$/, view: 'dashboard' },
  { pattern: /^#\/master\/dashboard$/, view: 'dashboard', params: { workspaceId: 'all' } },
  { pattern: /^#\/master\/projects$/, view: 'projects', params: { workspaceId: 'all' } },
  { pattern: /^#\/master\/toolkit$/, view: 'toolkit', params: { workspaceId: 'all' } },
  { pattern: /^#\/master\/kanban$/, view: 'kanban', params: { workspaceId: 'all' } },
  { pattern: /^#\/master\/(calendar|team|clients|documents|reports|settings)$/, view: 'placeholder', keys: ['section'], params: { workspaceId: 'all' } },
  { pattern: /^#\/w\/([^/]+)\/dashboard$/, view: 'dashboard', keys: ['workspaceId'] },
  { pattern: /^#\/w\/([^/]+)\/projects$/, view: 'projects', keys: ['workspaceId'] },
  { pattern: /^#\/w\/([^/]+)\/toolkit$/, view: 'toolkit', keys: ['workspaceId'] },
  { pattern: /^#\/w\/([^/]+)\/kanban$/, view: 'kanban', keys: ['workspaceId'] },
  { pattern: /^#\/w\/([^/]+)\/(calendar|team|clients|documents|reports|settings)$/, view: 'placeholder', keys: ['workspaceId', 'section'] },
  { pattern: /^#\/w\/([^/]+)\/p\/([^/]+)\/([^/]+)$/, view: 'project', keys: ['workspaceId', 'projectId', 'tab'] }
];

export function resolveRoute(hash = location.hash || '#/') {
  for (const route of routes) {
    const match = hash.match(route.pattern);
    if (!match) continue;

    const params = { ...(route.params || {}) };
    (route.keys || []).forEach((key, index) => {
      params[key] = decodeURIComponent(match[index + 1] || '');
    });
    return { view: route.view, params, hash };
  }
  return { view: 'notFound', params: {}, hash };
}

export function startRouter(callback) {
  const run = () => callback(resolveRoute());
  window.addEventListener('hashchange', run);
  run();
}
