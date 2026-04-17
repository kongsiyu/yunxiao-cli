// src/commands/repo.js
import chalk from "chalk";
import { listRepos, getRepo } from "../codeup-api.js";
import { printJson, padEndVisual, printError } from "../output.js";
import { AppError, ERROR_CODE } from "../errors.js";

function parsePositiveInt(raw, fieldName, jsonMode) {
  const parsed = parseInt(raw, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    printError(ERROR_CODE.INVALID_ARGS, `${fieldName} must be a positive integer`, jsonMode);
    process.exit(1);
  }
  return parsed;
}

function mapRepo(repo) {
  return {
    id: repo.id,
    name: repo.name,
    description: repo.description || "",
    visibility: repo.visibility_level,
    webUrl: repo.web_url,
  };
}

export function registerRepoCommands(program, codeupClient, withErrorHandling, jsonMode) {
  const repo = program.command("repo").description("Manage Codeup repositories");

  repo
    .command("list")
    .description("List Codeup repositories")
    .option("--page <n>", "Page number", "1")
    .option("--limit <n>", "Per page (max 100)", "20")
    .action(withErrorHandling(async (opts) => {
      if (!codeupClient) {
        throw new AppError(ERROR_CODE.AUTH_MISSING, "Authentication required. Run: yunxiao auth login");
      }

      const page = parsePositiveInt(opts.page, "page", jsonMode);
      const limit = parsePositiveInt(opts.limit, "limit", jsonMode);
      if (limit > 100) {
        printError(ERROR_CODE.INVALID_ARGS, "limit must be <= 100", jsonMode);
        process.exit(1);
      }

      const reposRaw = await listRepos(codeupClient, { page, perPage: limit });
      const repos = Array.isArray(reposRaw) ? reposRaw : (reposRaw?.data ?? []);
      const mapped = repos.map(mapRepo);

      if (jsonMode) {
        printJson({ repos: mapped, total: mapped.length });
        return;
      }

      if (mapped.length === 0) {
        console.log(chalk.yellow("No repositories found"));
        return;
      }

      console.log(chalk.bold(`\nFound ${mapped.length} repo(s):\n`));
      for (const repoItem of mapped) {
        const desc = repoItem.description ? repoItem.description.slice(0, 40) : "-";
        const visibility = repoItem.visibility || "-";
        console.log(
          `${chalk.cyan(String(repoItem.id).padEnd(8))} ${chalk.white(padEndVisual(repoItem.name, 35))} ${chalk.gray(padEndVisual(desc, 40))} ${chalk.magenta(visibility)}`
        );
      }
    }));

  repo
    .command("view [repoId]")
    .description("View details of a Codeup repository")
    .action(withErrorHandling(async (repoId) => {
      if (!codeupClient) {
        throw new AppError(ERROR_CODE.AUTH_MISSING, "Authentication required. Run: yunxiao auth login");
      }
      if (!repoId) {
        printError(ERROR_CODE.INVALID_ARGS, "repoId is required", jsonMode);
        process.exit(1);
      }

      const id = parsePositiveInt(repoId, "repoId", jsonMode);
      const r = await getRepo(codeupClient, id);

      if (jsonMode) {
        printJson({
          id: r.id,
          name: r.name,
          description: r.description || "",
          visibility: r.visibility_level,
          webUrl: r.web_url,
          defaultBranch: r.default_branch || "",
          createdAt: r.created_at || "",
        });
        return;
      }

      console.log(chalk.bold(`\nRepository: ${r.name}\n`));
      console.log(`  ${chalk.gray("ID:")}             ${chalk.cyan(r.id)}`);
      console.log(`  ${chalk.gray("Name:")}           ${chalk.white(r.name)}`);
      console.log(`  ${chalk.gray("Description:")}    ${chalk.white(r.description || "-")}`);
      console.log(`  ${chalk.gray("Visibility:")}     ${chalk.magenta(r.visibility_level || "-")}`);
      console.log(`  ${chalk.gray("Default Branch:")} ${chalk.white(r.default_branch || "-")}`);
      console.log(`  ${chalk.gray("Web URL:")}        ${chalk.blue(r.web_url || "-")}`);
      console.log(`  ${chalk.gray("Created At:")}     ${chalk.white(r.created_at || "-")}`);
    }));
}
