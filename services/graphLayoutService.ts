import type { Tag } from '~/types/tag';

export function distributeChildNodes(parentTag: Tag, radius: number): void {
  const children = parentTag.children || [];
  if (children.length === 0) return;
  
  const angleIncrement = (2 * Math.PI) / children.length;
  children.forEach((child, i) => {
    const angle = i * angleIncrement;
    const px = parentTag.x ?? 300;
    const py = parentTag.y ?? 200;
    child.x = px + radius * Math.cos(angle);
    child.y = py + radius * Math.sin(angle);
  });
}

export function expandChildAwayFromParent(child: Tag, parent: Tag): void {
  if (!parent) return;
  
  const dx = (child.x ?? 0) - (parent.x ?? 0);
  const dy = (child.y ?? 0) - (parent.y ?? 0);
  const distance = Math.sqrt(dx * dx + dy * dy);
  const newDistance = distance * 3; // Increase by factor of 3
  const ux = dx / distance;
  const uy = dy / distance;
  
  child.x = (parent.x ?? 0) + newDistance * ux;
  child.y = (parent.y ?? 0) + newDistance * uy;
}

interface GraphData {
  nodes: Tag[];
  links: Array<{ source: string; target: string; value: number }>;
}

export function computeGraphData(tags: Tag[], focusedZone: string): GraphData {
  // Get visible nodes
  const zoneTags = tags.filter(t => t.zone === focusedZone);
  const topLevel = zoneTags.filter(t => !t.parentId);
  
  if (!topLevel.some(t => t.selected)) {
    return {
      nodes: topLevel,
      links: []
    };
  }

  // Build visible nodes tree
  let activeTop = topLevel.filter(t => t.selected);
  let visible: Tag[] = [...activeTop];
  let currentLevel = activeTop;

  while (true) {
    const nextLevel = currentLevel.flatMap(node => 
      (node.children && !node.isLoading ? node.children : [])
    );
    if (nextLevel.length === 0) break;
    visible.push(...nextLevel);
    const selectedNext = nextLevel.filter(n => n.selected);
    if (selectedNext.length === 0) break;
    currentLevel = selectedNext;
  }

  // Build links between visible nodes
  const links = visible.reduce((acc: Array<{ source: string; target: string; value: number }>, node) => {
    if (node.children) {
      node.children.forEach(child => {
        if (visible.some(n => n.id === child.id)) {
          acc.push({ source: node.id, target: child.id, value: 1 });
        }
      });
    }
    return acc;
  }, []);

  return {
    nodes: visible,
    links
  };
} 