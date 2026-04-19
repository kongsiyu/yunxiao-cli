// src/commands/project.js
import chalk from "chalk";
import { searchProjects, getProject } from "../api.js";
import { printJson, padEndVisual } from "../output.js";
import { AppError, ERROR_CODE } from "../errors.js";
import { t, tx } from "../i18n/index.js";

function formatDate(ts) {
  if (!ts) return "-";
  return new Date(ts).toISOString().split("T")[0];
}

export function registerProjectCommands(program, client, orgId, withErrorHandling, jsonMode) {
  const proj = program.command("project").description("Manage Yunxiao projects");

  proj
    .command("list")
    .description("List projects")
    .option("-n, --name <name>", "Filter by name")
    .option("--page <n>", "Page number", "1")
    .option("--limit <n>", "Per page", "20")
    .action(withErrorHandling(async (opts) => {
      if (!client || !orgId) {
        throw new AppError(ERROR_CODE.AUTH_MISSING, t("errors.auth.required", "Authentication required. Run: yunxiao auth login"));
      }
      const projects = await searchProjects(client, orgId, {
        name: opts.name,
        page: parseInt(opts.page),
        perPage: parseInt(opts.limit),
      });
      if (jsonMode) {
        const mapped = (projects || []).map(p => ({ projectId: p.id, name: p.name }));
        printJson({ projects: mapped, total: mapped.length });
        return;
      }
      if (!projects || projects.length === 0) {
        console.log(chalk.yellow(t("commands.project.list.empty", "No projects found")));
        return;
      }
      console.log(chalk.bold(`\n${tx("commands.project.list.found", "Found {count} project(s):", { count: projects.length })}\n`));
      for (const p of projects) {
        console.log(`${chalk.cyan(p.customCode.padEnd(12))} ${chalk.white(padEndVisual(p.name, 30))} ${chalk.gray(p.id)}`);
        console.log(
          `  ${chalk.gray(`${t("output.header.status", "Status")}:`)} ${p.status?.name || "-"}  ` +
            `${chalk.gray(`${t("output.header.created", "Created")}:`)} ${formatDate(p.gmtCreate)}`
        );
      }
    }));

  proj
    .command("view <id>")
    .description("View project details")
    .action(withErrorHandling(async (id) => {
      if (!client || !orgId) throw new AppError(ERROR_CODE.AUTH_MISSING, 'Authentication required. Run: yunxiao auth login');
      const p = await getProject(client, orgId, id);
      if (jsonMode) {
        printJson(p);
        return;
      }
      console.log(chalk.bold("\nProject Details:\n"));
      console.log(`  ${chalk.gray("Name:")}     ${p.name}`);
      console.log(`  ${chalk.gray("ID:")}       ${p.id}`);
      console.log(`  ${chalk.gray("Code:")}     ${p.customCode}`);
      console.log(`  ${chalk.gray("Status:")}   ${p.status?.name || "-"}`);
      console.log(`  ${chalk.gray("Scope:")}    ${p.scope}`);
      console.log(`  ${chalk.gray("Created:")}  ${formatDate(p.gmtCreate)}`);
      if (p.description) {
        console.log(`  ${chalk.gray("Desc:")}    ${p.description}`);
      }
    }));
}
