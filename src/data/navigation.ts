/**
 * Navigation data: the two primary routes, resolved to absolute root
 * paths. The direct CV *download* action (distinct from the CV page) exists
 * only when a public CV artifact resolves.
 */
export interface NavItem {
  label: string;
  href: string;
}

export const academicNav: NavItem[] = [
  { label: 'Projects', href: '/projects/' },
  { label: 'Curriculum Vitae', href: '/cv/' },
];
