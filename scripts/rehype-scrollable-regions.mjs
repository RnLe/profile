/**
 * Wide content (display equations, code blocks) scrolls inside its own box so
 * the page never scrolls sideways. A scroll container that holds no focusable
 * element is unreachable by keyboard, so mark those regions focusable and give
 * them a name.
 *
 * Hand-rolled tree walk rather than a `unist-util-visit` dependency: this is
 * the only transform the build needs.
 */
const classesOf = (node) => {
  const value = node.properties?.className;
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') return value.split(/\s+/);
  return [];
};

export default function rehypeScrollableRegions() {
  return (tree) => {
    const walk = (node) => {
      if (node.type === 'element') {
        const isMath = classesOf(node).includes('katex-display');
        const isCode = node.tagName === 'pre';
        if (isMath || isCode) {
          node.properties = {
            ...node.properties,
            tabIndex: 0,
            role: 'group',
            'aria-label': isMath ? 'Equation, scrollable' : 'Code block, scrollable',
          };
        }
      }
      for (const child of node.children ?? []) walk(child);
    };
    walk(tree);
  };
}
