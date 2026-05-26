const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const repoRoot = path.join(__dirname, '..');
const probePath = path.join(__dirname, 'world_grid_services_restart_probe_child.js');

function runProbe(mode, servicesPath, storePath, acceptedRequestId = '', reportedRequestId = '') {
  const args = [probePath, mode, servicesPath, storePath];
  if (acceptedRequestId) args.push(acceptedRequestId);
  if (reportedRequestId) args.push(reportedRequestId);
  const result = spawnSync(process.execPath, args, {
    cwd: repoRoot,
    encoding: 'utf8',
    env: {
      ...process.env,
      FORCE_COLOR: '0'
    }
  });
  const lines = result.stdout.trim().split('\n').filter(Boolean);
  const parsed = JSON.parse(lines[lines.length - 1] || '{}');
  if (result.status !== 0) {
    const error = new Error(`world-grid services restart probe failed: ${mode}`);
    error.details = {
      status: result.status,
      stdout: result.stdout,
      stderr: result.stderr,
      parsed
    };
    throw error;
  }
  return parsed;
}

test('world-grid durable service requests and reputation survive restarts without private input leakage or duplicate reputation updates', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'portal-world-grid-services-'));
  const servicesPath = path.join(dir, 'world-grid-services.sqlite');
  const storePath = path.join(dir, 'portal-store.sqlite');
  try {
    const seeded = runProbe('seed', servicesPath, storePath);
    const reopened = runProbe('read', servicesPath, storePath, seeded.acceptedRequestId, seeded.reportedRequestId);
    const acceptedAgain = runProbe('accept-again', servicesPath, storePath, seeded.acceptedRequestId, seeded.reportedRequestId);
    const reportedAgain = runProbe('report-again', servicesPath, storePath, seeded.acceptedRequestId, seeded.reportedRequestId);

    assert.equal(seeded.ok, true);
    assert.equal(seeded.acceptedRequestStatus, 200);
    assert.equal(seeded.reportedRequestStatus, 200);
    assert.equal(seeded.followupStatus, 200);
    assert.match(seeded.acceptedRequestId, /^svc_req_/);
    assert.match(seeded.reportedRequestId, /^svc_req_/);
    assert.equal(seeded.requestCount, 2);
    assert.deepEqual(seeded.requestStatuses, ['accepted', 'reported']);
    assert.equal(seeded.counts.requests, 2);
    assert.equal(seeded.counts.reputation, 2);
    assert.equal(seeded.routeAdvisorReputation.completedJobs, 1);
    assert.equal(seeded.routeAdvisorReputation.disputeCount, 0);
    assert.equal(seeded.publicWorksReputation.completedJobs, 0);
    assert.equal(seeded.publicWorksReputation.disputeCount, 1);
    assert.equal(seeded.containsPrivateText, false);
    assert.deepEqual(seeded.metadata, [{
      migrationVersion: 'world_grid_services_v1',
      schemaVersion: 'agent-town.v5.world-grid.services.v1',
      count: 4
    }]);

    assert.equal(reopened.ok, true);
    assert.equal(reopened.requestCount, 2);
    assert.deepEqual(reopened.requestStatuses, ['accepted', 'reported']);
    assert.equal(reopened.counts.requests, 2);
    assert.equal(reopened.counts.reputation, 2);
    assert.equal(reopened.routeAdvisorReputation.completedJobs, 1);
    assert.equal(reopened.publicWorksReputation.disputeCount, 1);
    assert.equal(reopened.containsPrivateText, false);

    assert.equal(acceptedAgain.ok, true);
    assert.equal(acceptedAgain.followupStatus, 200);
    assert.equal(acceptedAgain.routeAdvisorReputation.completedJobs, 1);
    assert.equal(acceptedAgain.routeAdvisorReputation.disputeCount, 0);
    assert.equal(acceptedAgain.counts.requests, 2);
    assert.equal(acceptedAgain.counts.reputation, 2);

    assert.equal(reportedAgain.ok, true);
    assert.equal(reportedAgain.followupStatus, 200);
    assert.equal(reportedAgain.publicWorksReputation.disputeCount, 1);
    assert.equal(reportedAgain.publicWorksReputation.completedJobs, 0);
    assert.equal(reportedAgain.counts.requests, 2);
    assert.equal(reportedAgain.counts.reputation, 2);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
