/**
 * Publication/privacy validation: tracked public registry discipline, owner
 * receipts (which the coding agent may never issue), and registry↔content
 * consistency in both directions. Production must pass with the private
 * receipt directory absent.
 */
import { loadOwnerReceipts, loadProjects, loadPublicRegistry } from '../src/lib/registry-io';
import { Report, repoRoot } from './lib/report';

const report = new Report('check:privacy');

try {
  const registry = loadPublicRegistry(repoRoot);
  const receipts = loadOwnerReceipts(repoRoot);
  const projects = loadProjects(repoRoot);

  const registryIds = new Set<string>();
  for (const entry of registry) {
    const tag = `registry ${entry.id}`;
    if (registryIds.has(entry.id)) report.fail(`${tag}: duplicate id`);
    registryIds.add(entry.id);

    if (entry.sourceVisibility === 'private' && entry.sourceUrlAllowed) {
      report.fail(`${tag}: sourceVisibility 'private' forbids sourceUrlAllowed=true`);
    }
    if (entry.registryClass === 'approved-private-origin') {
      if (entry.approvalRefs.length === 0) {
        report.fail(`${tag}: approved-private-origin requires approvalRefs`);
      }
      const backing = receipts.filter(
        (r) => r.projectAuditId === entry.id && r.decision === 'approved',
      );
      if (backing.length === 0) {
        report.fail(`${tag}: approved-private-origin without an approved owner receipt`);
      }
    }
    const content = projects.find((p) => p.data.id === entry.id);
    if (!content) {
      report.fail(`${tag}: registry entry has no content entry; remove or add content`);
    }
  }

  for (const { data } of projects) {
    if (data.publication === 'public' && !registryIds.has(data.id)) {
      report.fail(`project ${data.id}: public content without a tracked registry record`);
    }
  }

  for (const receipt of receipts) {
    const tag = `receipt ${receipt.projectAuditId}/${receipt.ownerApprovalRef}`;
    if (receipt.decision === 'approved') {
      if (!receipt.approvedAt) report.fail(`${tag}: approved without approvedAt date`);
      if (receipt.approvedItems.length === 0) {
        report.fail(`${tag}: approved without item-level approvals`);
      }
      for (const item of receipt.approvedItems) {
        if (item.allowedSurfaces.some((s) => s === '*' || s === 'all')) {
          report.fail(`${tag}: wildcard surfaces are invalid (item ${item.id})`);
        }
      }
    }
  }
} catch (error) {
  report.fail((error as Error).message);
}

report.finish();
