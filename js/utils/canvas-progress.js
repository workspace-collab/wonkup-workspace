export function calculateCanvasProgress(instance) {
  const sections = instance?.template?.sections || [];
  if (!sections.length) return 0;
  const rule = instance.template.completionRule || {};
  const sectionWeight = Number(rule.sectionWeight ?? 0.7);
  const depthWeight = Number(rule.depthWeight ?? 0.3);
  const target = Math.max(1, Number(rule.targetNotesPerSection || 2));
  const counts = Object.fromEntries(sections.map(section => [section.id, 0]));
  (instance.notes || []).forEach(note => {
    if (note.sectionId in counts && String(note.text || '').trim()) counts[note.sectionId] += 1;
  });
  const filled = sections.filter(section => counts[section.id] > 0).length / sections.length;
  const depth = sections.reduce((sum, section) => sum + Math.min(1, counts[section.id] / target), 0) / sections.length;
  const weightTotal = Math.max(0.01, sectionWeight + depthWeight);
  return Math.round(((filled * sectionWeight) + (depth * depthWeight)) / weightTotal * 100);
}
