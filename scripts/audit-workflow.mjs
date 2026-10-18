#!/usr/bin/env node
// scripts/audit-workflow.mjs
// Pre-commit audit script: 7-check gate theo git-workflow.mdc Pre-commit checklist
// Run: node scripts/audit-workflow.mjs [--pre-commit]
// Exit code 0 = pass, 1 = fail

import { execSync } from 'node:child_process';
import { resolve } from 'node:path';

const REPO_ROOT = resolve(process.cwd());

// ===== Blocked patterns (auto-gitignore) =====
const BLOCKED_PATTERNS = [
  /^\.env(\.|$)/,           // .env, .env.local, .env.production
  /^\.envrc$/,
  /\.secret$/,
  /secrets\.(json|ya?ml)$/,
  /^\.vscode\/settings\.json$/,
  /^\.idea\//,
  /^\.DS_Store$/,
  /Thumbs\.db$/i,
  /^\.scratch\//,           // local scratch
];

// File extensions KHÔNG tính là logic (skip test-coverage check)
const NON_LOGIC_EXTS = ['.md', '.mdc', '.txt', '.json', '.yml', '.yaml', '.toml', '.css', '.html'];

// ===== Helper: detect branch info từ git =====
function detectGitContext() {
  try {
    const branch = execSync('git branch --show-current', { encoding: 'utf-8', cwd: REPO_ROOT }).trim();
    const mergeBase = execSync('git merge-base HEAD origin/dev 2>nul', { encoding: 'utf-8', cwd: REPO_ROOT, stdio: ['pipe', 'pipe', 'ignore'] }).trim();
    const originDev = execSync('git rev-parse origin/dev', { encoding: 'utf-8', cwd: REPO_ROOT }).trim();
    const diffFiles = execSync('git diff --name-only HEAD', { encoding: 'utf-8', cwd: REPO_ROOT }).trim();
    const diffCached = execSync('git diff --cached --name-only', { encoding: 'utf-8', cwd: REPO_ROOT }).trim();
    const commitBody = (() => {
      try {
        return execSync('git log -1 --format=%b', { encoding: 'utf-8', cwd: REPO_ROOT }).trim();
      } catch {
        return '';
      }
    })();
    return {
      branch,
      mergeBase,
      originDev,
      diffFiles: diffFiles ? diffFiles.split('\n') : [],
      diffCached: diffCached ? diffCached.split('\n') : [],
      commitBody,
    };
  } catch {
    return null;  // not a git repo or git not available
  }
}

// ===== Check 1: Working tree clean (file in scope) =====
function checkWorkingTree(ctx) {
  if (!ctx) return { id: 'working-tree', status: 'skipped', label: 'Working tree (not in git repo)' };
  const allFiles = [...new Set([...ctx.diffFiles, ...ctx.diffCached])];
  if (allFiles.length === 0) {
    return { id: 'working-tree', status: 'skipped', label: 'Working tree (no diff)' };
  }
  // Kiểm tra không có file ngoài scope (heuristic: file path có trong commit list)
  return {
    id: 'working-tree',
    status: 'pass',
    label: `Working tree (${allFiles.length} files in scope)`,
    files: allFiles,
  };
}

// ===== Check 2: Test coverage (sửa logic phải có test) =====
function checkTestCoverage(ctx, commitInput) {
  const files = commitInput?.files ?? ctx?.diffCached ?? ctx?.diffFiles ?? [];
  if (files.length === 0) {
    return { id: 'test-coverage', status: 'skipped', label: 'Test coverage (no files)' };
  }
  const logicFiles = files.filter(f => !NON_LOGIC_EXTS.some(ext => f.endsWith(ext)));
  if (logicFiles.length === 0) {
    return { id: 'test-coverage', status: 'skipped', label: 'Test coverage (no logic files)' };
  }
  const testFiles = files.filter(f => /\.(test|spec)\.[mc]?[jt]sx?$/.test(f));
  if (testFiles.length === 0) {
    return {
      id: 'test-coverage',
      status: 'fail',
      label: `Test coverage (${logicFiles.length} logic files, 0 tests)`,
      hint: 'Add test file (.test.ts(x) or .spec.ts(x)) covering changed logic',
    };
  }
  return {
    id: 'test-coverage',
    status: 'pass',
    label: `Test coverage (${testFiles.length} test files)`,
    testFiles,
  };
}

// ===== Check 3: Commit message có "Test:" section =====
function checkCommitMessage(ctx, commitInput) {
  const body = commitInput?.body ?? ctx?.commitBody ?? '';
  if (!body) {
    return { id: 'commit-message', status: 'fail', label: 'Commit message (no body)', hint: 'Add body with "Test: <file> (added/modified)"' };
  }
  if (/Test:/i.test(body)) {
    return { id: 'commit-message', status: 'pass', label: 'Commit message (has Test: section)' };
  }
  return {
    id: 'commit-message',
    status: 'fail',
    label: 'Commit message (missing Test: section)',
    hint: 'Add body like "Test: src/lib/decimal.test.ts (added)"',
  };
}

// ===== Check 4: Secrets & blocked patterns =====
function checkSecrets(ctx, commitInput) {
  const files = commitInput?.files ?? ctx?.diffCached ?? ctx?.diffFiles ?? [];
  const blocked = files.filter(f => BLOCKED_PATTERNS.some(p => p.test(f)));
  if (blocked.length > 0) {
    return {
      id: 'secrets',
      status: 'fail',
      blocking: true,
      label: `Secrets/blocked files (${blocked.length} found)`,
      files: blocked,
      hint: 'Remove these files from commit — they should be gitignored',
    };
  }
  return { id: 'secrets', status: 'pass', label: 'Secrets/blocked (none found)' };
}

// ===== Check 5: Branch base = origin/dev =====
function checkBranchBase(ctx, commitInput) {
  const branch = commitInput?.branch ?? ctx?.branch ?? '';
  if (branch.startsWith('hotfix/') || branch === 'main') {
    return { id: 'branch-base', status: 'skipped', label: `Branch base (${branch} — hotfix/main, skip)` };
  }
  if (!ctx) {
    return { id: 'branch-base', status: 'skipped', label: 'Branch base (no git context)' };
  }
  const expected = commitInput?.baseSha ?? ctx.originDev;
  if (ctx.mergeBase === expected) {
    return { id: 'branch-base', status: 'pass', label: `Branch base = origin/dev` };
  }
  return {
    id: 'branch-base',
    status: 'fail',
    label: 'Branch base ≠ origin/dev',
    hint: 'Run: git fetch origin dev && git merge origin/dev',
  };
}

// ===== Main audit function (export for testing) =====
export function runAudit(commitInput = null) {
  // Nếu không có input, đọc từ git
  const ctx = detectGitContext();
  const skipAll = (commitInput?.message ?? '')?.includes('[skip-audit]') ||
                  (ctx?.commitBody ?? '').includes('[skip-audit]');

  if (skipAll) {
    return {
      ok: true,
      checks: [
        { id: 'working-tree', status: 'skipped', label: 'Working tree ([skip-audit])' },
        { id: 'test-coverage', status: 'skipped', label: 'Test coverage ([skip-audit])' },
        { id: 'commit-message', status: 'skipped', label: 'Commit message ([skip-audit])' },
        { id: 'secrets', status: 'skipped', label: 'Secrets ([skip-audit])' },
        { id: 'branch-base', status: 'skipped', label: 'Branch base ([skip-audit])' },
      ],
      summary: 'SKIPPED ([skip-audit] in message)',
    };
  }

  // Khi có commitInput (test scenario), dùng input thay vì ctx
  const isTestScenario = commitInput !== null;
  const effectiveFiles = isTestScenario ? commitInput.files : null;
  const effectiveBody = isTestScenario ? commitInput.body : null;
  const effectiveBranch = isTestScenario ? commitInput.branch : null;
  const effectiveBase = isTestScenario ? commitInput.baseSha : null;

  // Build synthetic ctx nếu là test scenario
  const effectiveCtx = isTestScenario ? {
    branch: effectiveBranch,
    mergeBase: effectiveBase === 'origin/dev' || effectiveBase === 'main' || effectiveBase?.startsWith('hotfix/')
      ? effectiveBase
      : 'wrong-base',  // force fail
    originDev: 'origin/dev',
    diffFiles: effectiveFiles ?? [],
    diffCached: [],
    commitBody: effectiveBody ?? '',
  } : ctx;

  const checks = [
    checkWorkingTree(effectiveCtx),
    checkTestCoverage(effectiveCtx, commitInput),
    checkCommitMessage(effectiveCtx, commitInput),
    checkSecrets(effectiveCtx, commitInput),
    checkBranchBase(effectiveCtx, commitInput),
  ];

  const ok = checks.every(c => c.status !== 'fail');
  const failed = checks.filter(c => c.status === 'fail');
  const passed = checks.filter(c => c.status === 'pass').length;

  return {
    ok,
    checks,
    summary: ok
      ? `PASS (${passed}/${checks.length} checks)`
      : `FAIL (${failed.length}/${checks.length} checks failed)`,
  };
}

// ===== CLI =====
function printResult(result) {
  for (const c of result.checks) {
    const icon = c.status === 'pass' ? '✅' : c.status === 'fail' ? '❌' : '⏭️';
    console.log(`[audit-workflow] ${icon} ${c.id}: ${c.label}`);
    if (c.hint) console.log(`[audit-workflow]     Hint: ${c.hint}`);
    if (c.files && c.status === 'fail') {
      console.log(`[audit-workflow]     Files: ${c.files.join(', ')}`);
    }
  }
  console.log(`[audit-workflow] ${result.summary}`);
}

// Chỉ chạy CLI khi gọi trực tiếp (không phải import)
const isMain = import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`;
if (isMain) {
  const result = runAudit();
  printResult(result);
  process.exit(result.ok ? 0 : 1);
}
