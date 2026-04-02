// src/commands/status.js
import chalk from "chalk";
import { getWorkitemTypes, getWorkitemWorkflow } from "../api.js";
import { printJson, printError } from "../output.js";
import { AppError, ERROR_CODE } from "../errors.js";

export function registerStatusCommands(program, client, orgId, defaultProjectId, withErrorHandling, jsonMode) {
  const statusCmd = program.command("status").description("Query workflow statuses");

  statusCmd
    .command("list")
    .description("List workflow statuses for a workitem type")
    .option("-p, --project <id>", "Project ID (default: YUNXIAO_PROJECT_ID)")
    .option("--type-id <id>", "Workitem type ID (direct mode)")
    .option("-c, --category <type>", "Category shortcut: Req, Task, Bug (auto-queries typeId)")
    .action(withErrorHandling(async (opts) => {
      if (!client || !orgId) throw new AppError(ERROR_CODE.AUTH_MISSING, 'Authentication required. Run: yunxiao auth login');
      const spaceId = opts.project || defaultProjectId;
      if (!spaceId) {
        printError("INVALID_ARGS", "project ID required (--project or YUNXIAO_PROJECT_ID)", jsonMode);
        process.exit(1);
      }
      if (!opts.typeId && !opts.category) {
        printError("INVALID_ARGS", "either --type-id or --category is required", jsonMode);
        process.exit(1);
      }

      let typeId = opts.typeId;
      if (!typeId) {
        const types = await getWorkitemTypes(client, orgId, spaceId, opts.category);
        const defaultType = (types || []).find(t => t.defaultType) || (types || [])[0];
        if (!defaultType) {
          printError("NOT_FOUND", `No workitem types found for category: ${opts.category}`, jsonMode);
          process.exit(1);
        }
        typeId = defaultType.id;
      }

      const workflow = await getWorkitemWorkflow(client, orgId, spaceId, typeId);
      const statuses = (workflow && workflow.statuses) ? workflow.statuses : [];

      if (jsonMode) {
        printJson({ statuses, total: statuses.length });
        return;
      }

      if (statuses.length === 0) {
        console.log(chalk.yellow("No statuses found"));
        return;
      }

      console.log(chalk.bold(`\nFound ${statuses.length} status(es):\n`));
      for (const s of statuses) {
        const isDefault = s.id === (workflow && workflow.defaultStatusId) ? chalk.green(" [default]") : "";
        const displayName = s.displayName || s.name;
        console.log("  " + chalk.cyan(String(s.id).padEnd(32)) + "  " + chalk.white(displayName) + isDefault);
      }
    }));
}
