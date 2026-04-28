#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// ─── ANSI colors (no external deps) ───────────────────────────────────────────
const c = {
  reset:  '\x1b[0m',
  bold:   '\x1b[1m',
  dim:    '\x1b[2m',
  green:  '\x1b[32m',
  yellow: '\x1b[33m',
  cyan:   '\x1b[36m',
  red:    '\x1b[31m',
  white:  '\x1b[37m',
  gray:   '\x1b[90m',
};

const ok  = (msg) => console.log(`${c.green}  ✓${c.reset} ${msg}`);
const err = (msg) => console.error(`${c.red}  ✗${c.reset} ${msg}`);
const inf = (msg) => console.log(`${c.cyan}  →${c.reset} ${msg}`);
const dim = (msg) => console.log(`${c.gray}    ${msg}${c.reset}`);

// ─── Banner ───────────────────────────────────────────────────────────────────
function printBanner() {
  console.log();
  console.log(`${c.bold}${c.cyan}  ╔═══════════════════════════════════╗${c.reset}`);
  console.log(`${c.bold}${c.cyan}  ║   claude-setup — Claude Code Kit  ║${c.reset}`);
  console.log(`${c.bold}${c.cyan}  ╚═══════════════════════════════════╝${c.reset}`);
  console.log();
}

// ─── Help ─────────────────────────────────────────────────────────────────────
function printHelp() {
  printBanner();
  console.log(`${c.bold}USAGE${c.reset}`);
  console.log(`  npx claude-setup [target-dir] [options]\n`);
  console.log(`${c.bold}ARGUMENTS${c.reset}`);
  console.log(`  target-dir   Target directory (default: current directory)\n`);
  console.log(`${c.bold}OPTIONS${c.reset}`);
  console.log(`  --force      Overwrite existing files without prompting`);
  console.log(`  --global     Install globally into ~/.claude/ (applies to all projects)`);
  console.log(`  --help       Show this help message\n`);
  console.log(`${c.bold}EXAMPLES${c.reset}`);
  console.log(`  npx claude-setup                    # Install into the current directory`);
  console.log(`  npx claude-setup ./my-project       # Install into a specific directory`);
  console.log(`  npx claude-setup --force            # Overwrite without prompting`);
  console.log(`  npx claude-setup --global           # Install globally\n`);
}

// ─── Prompt helper ────────────────────────────────────────────────────────────
function prompt(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase());
    });
  });
}

// ─── Recursive copy with overwrite ────────────────────────────────────────────
function copyRecursive(src, dst) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dst, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      copyRecursive(path.join(src, entry), path.join(dst, entry));
    }
  } else {
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.copyFileSync(src, dst);
  }
}

// ─── Count files in a directory recursively ───────────────────────────────────
function countFiles(dir) {
  if (!fs.existsSync(dir)) return 0;
  let count = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) count += countFiles(path.join(dir, entry.name));
    else count++;
  }
  return count;
}

// ─── List commands ────────────────────────────────────────────────────────────
function listCommands(commandsDir) {
  if (!fs.existsSync(commandsDir)) return [];
  return fs.readdirSync(commandsDir)
    .filter(f => f.endsWith('.md'))
    .map(f => `/${path.basename(f, '.md')}`);
}

// ─── Install to project directory ─────────────────────────────────────────────
async function installToProject(targetDir, sourceDir, force) {
  const items = [
    { src: path.join(sourceDir, 'CLAUDE.md'), dst: path.join(targetDir, 'CLAUDE.md'), label: 'CLAUDE.md' },
    { src: path.join(sourceDir, '.claude'),   dst: path.join(targetDir, '.claude'),   label: '.claude/' },
  ];

  // Check conflicts
  const conflicts = items.filter(({ dst }) => fs.existsSync(dst));

  if (conflicts.length > 0 && !force) {
    console.log(`${c.yellow}  ⚠ The following already exist in ${c.bold}${targetDir}${c.reset}${c.yellow}:${c.reset}`);
    for (const { label } of conflicts) dim(label);
    console.log();
    const answer = await prompt(`  Overwrite all? ${c.dim}(y/N)${c.reset} `);
    if (answer !== 'y' && answer !== 'yes') {
      console.log();
      console.log(`  Installation cancelled.`);
      console.log();
      process.exit(0);
    }
    console.log();
  }

  // Copy
  for (const { src, dst, label } of items) {
    if (!fs.existsSync(src)) continue;
    copyRecursive(src, dst);
    ok(`${label}`);
  }

  return items;
}

// ─── Install to global ~/.claude/ ─────────────────────────────────────────────
async function installToGlobal(sourceDir, force) {
  const homeDir = require('os').homedir();
  const globalClaudeDir = path.join(homeDir, '.claude');

  const items = [
    {
      src: path.join(sourceDir, '.claude', 'commands'),
      dst: path.join(globalClaudeDir, 'commands'),
      label: '~/.claude/commands/',
    },
    {
      src: path.join(sourceDir, '.claude', 'rules'),
      dst: path.join(globalClaudeDir, 'rules'),
      label: '~/.claude/rules/',
    },
    {
      src: path.join(sourceDir, '.claude', 'skills'),
      dst: path.join(globalClaudeDir, 'skills'),
      label: '~/.claude/skills/',
    },
  ];

  const globalClaude = path.join(globalClaudeDir, 'CLAUDE.md');
  const claudeMdExists = fs.existsSync(globalClaude);
  const dirConflicts = items.filter(({ dst }) => fs.existsSync(dst));
  const hasConflicts = claudeMdExists || dirConflicts.length > 0;

  if (hasConflicts && !force) {
    console.log(`${c.yellow}  ⚠ The following already exist in ${c.bold}~/.claude/${c.reset}${c.yellow}:${c.reset}`);
    if (claudeMdExists) dim('~/.claude/CLAUDE.md');
    for (const { label } of dirConflicts) dim(label);
    console.log();
    const answer = await prompt(`  Overwrite all? ${c.dim}(y/N)${c.reset} `);
    if (answer !== 'y' && answer !== 'yes') {
      console.log();
      console.log(`  Installation cancelled.`);
      console.log();
      process.exit(0);
    }
    console.log();
  }

  // Copy directories
  for (const { src, dst, label } of items) {
    if (!fs.existsSync(src)) continue;
    copyRecursive(src, dst);
    ok(label);
  }

  // Generate ~/.claude/CLAUDE.md with adjusted @rules/ paths
  const globalClaudeMdContent = `# Global Engineering Standards
# Generated by claude-setup — edit as needed

## Always-On Rules

@rules/rule-priority.md
@rules/rugged-software-constitution.md
@rules/security-mandate.md
@rules/code-completion-mandate.md
@rules/logging-and-observability-mandate.md
@rules/concurrency-and-threading-mandate.md
@rules/core-design-principles.md
@rules/architectural-pattern.md
@rules/code-organization-principles.md
@rules/code-idioms-and-conventions.md
@rules/documentation-principles.md
@rules/project-structure.md

---

## Contextual Rules (Read When Relevant)

- Error handling        → \`~/.claude/rules/error-handling-principles.md\`
- Testing               → \`~/.claude/rules/testing-strategy.md\`
- Security (detail)     → \`~/.claude/rules/security-principles.md\`
- Database              → \`~/.claude/rules/database-design-principles.md\`
- API design            → \`~/.claude/rules/api-design-principles.md\`
- Git workflow          → \`~/.claude/rules/git-workflow-principles.md\`
- Performance           → \`~/.claude/rules/performance-optimization-principles.md\`
- Resources/memory      → \`~/.claude/rules/resources-and-memory-management-principles.md\`
- Configuration         → \`~/.claude/rules/configuration-management-principles.md\`
- Go                    → \`~/.claude/rules/go-idioms-and-patterns.md\`
- TypeScript            → \`~/.claude/rules/typescript-idioms-and-patterns.md\`
- Vue                   → \`~/.claude/rules/vue-idioms-and-patterns.md\`
- Python                → \`~/.claude/rules/python-idioms-and-patterns.md\`
- Rust                  → \`~/.claude/rules/rust-idioms-and-patterns.md\`
- Flutter               → \`~/.claude/rules/flutter-idioms-and-patterns.md\`
`;

  fs.writeFileSync(globalClaude, globalClaudeMdContent, 'utf8');
  ok('~/.claude/CLAUDE.md');

  // Rewrite command files: replace .claude/rules/ → ~/.claude/rules/
  const commandsDir = path.join(globalClaudeDir, 'commands');
  if (fs.existsSync(commandsDir)) {
    for (const f of fs.readdirSync(commandsDir)) {
      if (!f.endsWith('.md')) continue;
      const fPath = path.join(commandsDir, f);
      const original = fs.readFileSync(fPath, 'utf8');
      const updated = original
        .replace(/\.claude\/rules\//g, '~/.claude/rules/')
        .replace(/\.claude\/skills\//g, '~/.claude/skills/');
      if (updated !== original) fs.writeFileSync(fPath, updated, 'utf8');
    }
    ok('Command paths updated for global use');
  }

  return globalClaudeDir;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    printHelp();
    process.exit(0);
  }

  const force      = args.includes('--force');
  const isGlobal   = args.includes('--global');
  const targetArg  = args.find(a => !a.startsWith('--'));
  const sourceDir  = path.join(__dirname, '..');

  printBanner();

  // ── Global install ───────────────────────────────────────────────────────────
  if (isGlobal) {
    const homeDir = require('os').homedir();
    inf(`Mode: ${c.bold}global${c.reset} → ${c.bold}~/.claude/${c.reset}`);
    console.log();

    await installToGlobal(sourceDir, force);

    const globalClaudeDir = path.join(homeDir, '.claude');
    const cmdCount = countFiles(path.join(globalClaudeDir, 'commands'));
    const ruleCount = countFiles(path.join(globalClaudeDir, 'rules'));

    console.log();
    console.log(`${c.bold}${c.green}  Global installation complete!${c.reset}`);
    console.log();
    dim(`${ruleCount} rules  •  ${cmdCount} command files`);
    console.log();
    inf(`Rules are now active in all projects`);
    inf(`Slash commands available:`);
    console.log();
    for (const cmd of listCommands(path.join(globalClaudeDir, 'commands'))) {
      dim(cmd);
    }
    console.log();
    inf(`Open Claude Code in any project — rules are active automatically`);
    console.log();
    return;
  }

  // ── Per-project install ──────────────────────────────────────────────────────
  const targetDir = targetArg ? path.resolve(targetArg) : process.cwd();

  if (!fs.existsSync(targetDir)) {
    err(`Directory not found: ${targetDir}`);
    console.log();
    console.log(`  Create it first: ${c.dim}mkdir -p ${targetArg}${c.reset}`);
    console.log();
    process.exit(1);
  }

  inf(`Target: ${c.bold}${targetDir}${c.reset}`);
  console.log();

  await installToProject(targetDir, sourceDir, force);

  const cmdCount  = countFiles(path.join(targetDir, '.claude', 'commands'));
  const ruleCount = countFiles(path.join(targetDir, '.claude', 'rules'));

  console.log();
  console.log(`${c.bold}${c.green}  Installation complete!${c.reset}`);
  console.log();
  dim(`${ruleCount} rules  •  ${cmdCount} command files`);
  console.log();
  inf(`Slash commands available:`);
  console.log();
  for (const cmd of listCommands(path.join(targetDir, '.claude', 'commands'))) {
    dim(cmd);
  }
  console.log();
  inf(`Open Claude Code in ${c.bold}${targetDir}${c.reset}`);
  console.log(`  ${c.dim}cd ${targetDir} && claude${c.reset}`);
  console.log();
}

main().catch((e) => {
  console.error(`\n${c.red}  Error: ${e.message}${c.reset}\n`);
  process.exit(1);
});
