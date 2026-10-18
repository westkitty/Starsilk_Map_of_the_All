/** Pure, atomic delete planning for provisional Atlas drafts (schema v1). */
const TYPES = new Set(['node', 'route', 'region']);
const arrayOf = (value, name) => {
  if (!Array.isArray(value)) throw new Error('Invalid '+name+' collection');
  return value;
};
/** Inspect consequences before asking the user for deletion confirmation. No mutation. */
export function planDeletion(state, id, {type = null} = {}) {
  if (!state || typeof state !== 'object' || typeof id !== 'string' || !id) throw new Error('Select an existing draft object');
  if (type !== null && !TYPES.has(type)) throw new Error('Unknown object type');
  const nodes = arrayOf(state.nodes, 'node');
  const routes = arrayOf(state.routes, 'route');
  const regions = state.regions === undefined ? [] : arrayOf(state.regions, 'region');
  const collections = {node: nodes, route: routes, region: regions};
  const matches = (type ? [type] : [...TYPES]).flatMap(kind =>
    collections[kind].filter(item => item?.id === id).map(item => ({kind, item})));
  if (matches.length !== 1) throw new Error(matches.length ? 'Ambiguous draft object ID' : 'Object not found');
  const {kind, item} = matches[0];
  if (item.status !== 'draft') throw new Error('Read-only source identities cannot be deleted');
  const nodeIds = new Set(), routeIds = new Set(), regionIds = new Set();
  if (kind === 'node') {
    nodeIds.add(id);
    for (let previous = -1; previous !== nodeIds.size;) {
      previous = nodeIds.size;
      for (const node of nodes) if (node?.parentId && nodeIds.has(node.parentId)) nodeIds.add(node.id);
    }
    for (const node of nodes) if (nodeIds.has(node.id) && node.status !== 'draft')
      throw new Error('Deletion would remove a read-only canonical source identity');
    for (const route of routes) if (nodeIds.has(route?.from) || nodeIds.has(route?.to)) {
      if (route.status !== 'draft') throw new Error('Deletion would remove a read-only source route');
      routeIds.add(route.id);
    }
    for (const region of regions) if (nodeIds.has(region?.parentId)) {
      if (region.status !== 'draft') throw new Error('Deletion would remove a read-only source region');
      regionIds.add(region.id);
    }
  } else if (kind === 'route') routeIds.add(id);
  else regionIds.add(id);
  return {
    type: kind, id,
    nodeIds: [...nodeIds], routeIds: [...routeIds], regionIds: [...regionIds],
    nodeCount: nodeIds.size, routeCount: routeIds.size, regionCount: regionIds.size,
  };
}
/** Delete only the active era's editable draft data. Caller owns Undo, validation and persistence. */
export function deleteObject(state, id, options = {}) {
  const plan = planDeletion(state, id, options);
  if (options.dryRun) return plan;
  const nodeIds = new Set(plan.nodeIds), routeIds = new Set(plan.routeIds), regionIds = new Set(plan.regionIds);
  if (nodeIds.size) state.nodes = state.nodes.filter(n => !nodeIds.has(n.id));
  if (routeIds.size) state.routes = state.routes.filter(r => !routeIds.has(r.id));
  if (regionIds.size) state.regions = state.regions.filter(r => !regionIds.has(r.id));
  if (nodeIds.has(state.selected)) state.selected = null;
  return plan;
}
