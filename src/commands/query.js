// src/commands/query.js
import chalk from "chalk";
import { listProjectMembers } from "../api.js";
import { printJson, printError } from "../output.js";

export function registerQueryCommands(program, client, orgId, defaultProjectId, withErrorHandling, jsonMode) {
  const user = program.command("user").description("Manage and search project members");

  user
    .command("list")
    .description("List project members")
    .option("-p, --project <id>", "Project ID (default: YUNXIAO_PROJECT_ID)")
    .option("--limit <n>", "Per page", "20")
    .action(withErrorHandling(async (opts) => {
      const projectId = opts.project || defaultProjectId;
      if (!projectId) {
        printError("INVALID_ARGS", "project ID required (--project or YUNXIAO_PROJECT_ID)", jsonMode);
        process.exit(1);
      }
      const members = await listProjectMembers(client, orgId, projectId, { perPage: parseInt(opts.limit) });
      const normalized = (members || []).map(m => ({ userId: m.userId || m.id, name: m.userName || m.name, roleName: m.roleName }));
      if (jsonMode) {
        printJson({ members: normalized, total: normalized.length });
        return;
      }
      if (normalized.length === 0) {
        console.log(chalk.yellow("No members found"));
        return;
      }
      console.log(chalk.bold(`\nFound ${normalized.length} member(s):\n`));
      for (const m of normalized) {
        console.log(`  ${chalk.cyan((m.userId || "-").padEnd(24))} ${chalk.white(m.name || "-")} ${chalk.gray(m.roleName || "")}`);
      }
    }));

  user
    .command("search <keyword>")
    .description("Search project members by keyword")
    .option("-p, --project <id>", "Project ID (default: YUNXIAO_PROJECT_ID)")
    .action(withErrorHandling(async (keyword, opts) => {
      const projectId = opts.project || defaultProjectId;
      if (!projectId) {
        printError("INVALID_ARGS", "project ID required (--project or YUNXIAO_PROJECT_ID)", jsonMode);
        process.exit(1);
      }
      const members = await listProjectMembers(client, orgId, projectId, { name: keyword });
      const normalized = (members || []).map(m => ({ userId: m.userId || m.id, name: m.userName || m.name, roleName: m.roleName }));
      if (jsonMode) {
        printJson({ members: normalized, total: normalized.length });
        return;
      }
      if (normalized.length === 0) {
        console.log(chalk.yellow(`No members found matching: ${keyword}`));
        return;
      }
      console.log(chalk.bold(`\nFound ${normalized.length} member(s) matching "${keyword}":\n`));
      for (const m of normalized) {
        console.log(`  ${chalk.cyan((m.userId || "-").padEnd(24))} ${chalk.white(m.name || "-")} ${chalk.gray(m.roleName || "")}`);
      }
    }));
}
