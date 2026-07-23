import { rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const outDir = join(root, '.tmp', 'frontend-unit-tests');

rmSync(outDir, { recursive: true, force: true });

const tsc = spawnSync(
  process.platform === 'win32' ? 'node_modules\\.bin\\tsc.cmd' : 'node_modules/.bin/tsc',
  ['-p', 'tsconfig.frontend-tests.json'],
  { cwd: root, stdio: 'inherit' },
);

if (tsc.status !== 0) {
  process.exit(tsc.status ?? 1);
}

writeFileSync(join(outDir, 'package.json'), '{"type":"commonjs"}\n');

const tests = [
  join(outDir, 'src', 'config', 'hskQuestionTypes.test.js'),
  join(outDir, 'src', 'config', 'hskQuestionTags.test.js'),
  join(outDir, 'src', 'config', 'hskQuestionWorkflow.test.js'),
  join(outDir, 'src', 'config', 'hskTypeCardMeta.test.js'),
  join(outDir, 'src', 'panels', 'hskQuestionBankFilters.test.js'),
  join(outDir, 'src', 'utils', 'hskPaperDeleteDecision.test.js'),
  join(outDir, 'src', 'utils', 'hskPaperListState.test.js'),
  join(outDir, 'src', 'utils', 'hskCompileDelivery.test.js'),
  join(outDir, 'src', 'utils', 'hskPaperUtils.test.js'),
  join(outDir, 'src', 'utils', 'hskPhaseOneScope.test.js'),
  join(outDir, 'src', 'utils', 'hskQuestionDetailRoute.test.js'),
  join(outDir, 'src', 'utils', 'hskQuestionPersistence.test.js'),
  join(outDir, 'src', 'utils', 'hskQuestionTypeChangeGuard.test.js'),
  join(outDir, 'src', 'utils', 'hskQuestionTypeSave.test.js'),
  join(outDir, 'src', 'utils', 'hskStoreSnapshot.test.js'),
  join(outDir, 'src', 'utils', 'mediaPresentation.test.js'),
];

const nodeTest = spawnSync(process.execPath, ['--test', ...tests], {
  cwd: root,
  stdio: 'inherit',
});

process.exit(nodeTest.status ?? 1);
