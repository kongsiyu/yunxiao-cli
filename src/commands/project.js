// src/commands/project.js
import chalk from "chalk";
import { searchProjects, getProject } from "../api.js";

function formatDate(ts) {
  if (!ts) return "-";
  return new Date(ts).toISOString().split("T")[0];
}

export function registerProjectCommands(program, client, orgId, withErrorHandling) {
  const proj = program.command("project").description("Manage Yunxiao projects");

  proj
    .command("list")
    .description("List projects")
    .option("-n, --name <name>", "Filter by name")
    .option("--page <n>", "Page number", "1")
    .option("--limit <n>", "Per page", "20")
    .action(withErrorHandling(async (opts) => {
      const projects = await searchProjects(client, orgId, {
        name: opts.name,
        page: parseInt(opts.page),
        perPage: parseInt(opts.limit),
      });
      if (!projects || projects.length === 0) {
        console.log(chalk.yellow("No projects found"));
        return;
      }
      console.log(chalk.bold(`\nFound ${projects.length} project(s):\n`));
      for (const p of projects) {
        console.log(`${chalk.cyan(p.customCode.padEnd(12))} ${chalk.white(p.name.padEnd(30))} ${chalk.gray(p.id)}`);
        console.log(`  ${chalk.gray("Status:")} ${p.status?.name || "-"}  ${chalk.gray("Created:")} ${formatDate(p.gmtCreate)}`);
      }
    }));

  proj
    .command("view <id>")
    .description("View project details")
    .action(withErrorHandling(async (id) => {
      const p = await getProject(client, orgId, id);
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
