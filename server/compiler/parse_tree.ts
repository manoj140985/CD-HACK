import { EPSILON, ParseTreeNode } from './grammar_model.ts';

/**
 * Assigns x, y coordinates to parse tree nodes using a tidy tree layout algorithm.
 */
export function layoutParseTree(
  root: ParseTreeNode,
  horizontalSpacing = 70,
  verticalSpacing = 80
): ParseTreeNode {
  let nextX = 40;

  function assignPositions(node: ParseTreeNode, depth: number): void {
    node.depth = depth;

    if (!node.children || node.children.length === 0) {
      node.x = nextX;
      nextX += horizontalSpacing;
      node.y = depth * verticalSpacing + 50;
      return;
    }

    // Traverse children first (post-order layout for parents)
    for (const child of node.children) {
      assignPositions(child, depth + 1);
    }

    // Parent is centered over its children
    const firstChild = node.children[0];
    const lastChild = node.children[node.children.length - 1];
    node.x = ((firstChild.x ?? 0) + (lastChild.x ?? 0)) / 2;
    node.y = depth * verticalSpacing + 50;
  }

  assignPositions(root, 0);
  return root;
}

/**
 * Flattens the parse tree into a list of nodes and links for inspectors or graph components.
 */
export function flattenParseTree(root: ParseTreeNode): {
  nodes: ParseTreeNode[];
  links: Array<{ sourceId: string; targetId: string }>;
  maxDepth: number;
  totalNodes: number;
} {
  const nodes: ParseTreeNode[] = [];
  const links: Array<{ sourceId: string; targetId: string }> = [];
  let maxDepth = 0;

  function traverse(node: ParseTreeNode) {
    nodes.push(node);
    if (node.depth > maxDepth) maxDepth = node.depth;

    for (const child of node.children) {
      links.push({ sourceId: node.id, targetId: child.id });
      traverse(child);
    }
  }

  traverse(root);
  return {
    nodes,
    links,
    maxDepth,
    totalNodes: nodes.length,
  };
}
