// src/commands/pipeline.js
import chalk from "chalk";
import { listPipelines, createPipelineRun, getPipelineRun } from "../api.js";
import { printJson, printError } from "../output.js";
import { AppError, ERROR_CODE } from "../errors.js";

function formatTime(ts) {
  if (!ts) return "-";
  return new Date(ts).toISOString().replace("T", " ").slice(0, 19);
}

function statusColor(status) {
  if (!status) return chalk.gray("-");
  const s = (status || "").toUpperCase();
  if (s === "SUCCESS") return chalk.green(status);
  if (s === "RUNNING") return chalk.cyan(status);
  if (s === "FAIL") return chalk.red(status);
  return chalk.white(status);
}

export function registerPipelineCommands(program, client, orgId, withErrorHandling, jsonMode) {
  const pl = program.command("pipeline").description("Manage CI/CD pipelines");

  pl
    .command("list")
    .description("List pipelines")
    .option("--limit <n>", "Max results", "20")
    .action(withErrorHandling(async (opts) => {
      if (!client || !orgId) throw new AppError(ERROR_CODE.AUTH_MISSING, 'Authentication required. Run: yunxiao auth login');
      const result = await listPipelines(client, orgId, { maxResults: parseInt(opts.limit) });
      const pipelines = Array.isArray(result) ? result : [];
      if (jsonMode) {
        printJson({ pipelines, total: pipelines.length });
        return;
      }
      if (pipelines.length === 0) {
        console.log(chalk.yellow("No pipelines found"));
        return;
      }
      console.log(chalk.bold(`\nFound ${pipelines.length} pipeline(s):\n`));
      for (const p of pipelines) {
        const id = chalk.cyan(String(p.pipelineId || "-").padEnd(12));
        const name = chalk.white(String(p.pipelineName || "-"));
        console.log(`${id} ${name}`);
      }
      console.log();
    }));

  pl
    .command("run <pipelineId>")
    .description("Trigger a pipeline run")
    .option("--params <json>", "Optional params JSON string (e.g. '{\"branch\":\"main\"}')")
    .action(withErrorHandling(async (pipelineId, opts) => {
      if (!client || !orgId) throw new AppError(ERROR_CODE.AUTH_MISSING, 'Authentication required. Run: yunxiao auth login');
      const result = await createPipelineRun(client, orgId, pipelineId, {
        params: opts.params,
      });
      if (jsonMode) {
        printJson({ pipelineRunId: result.pipelineRunId ?? result, pipelineId });
        return;
      }
      console.log(chalk.green("\nPipeline triggered successfully!\n"));
      console.log("  " + chalk.gray("Pipeline ID: ") + chalk.cyan(pipelineId));
      console.log("  " + chalk.gray("Run ID:      ") + chalk.cyan(result.pipelineRunId ?? result));
      console.log();
    }));

  pl
    .command("status <runId>")
    .description("Get the status of a pipeline run")
    .option("-p, --pipeline <id>", "Pipeline ID (default: YUNXIAO_PIPELINE_ID)")
    .action(withErrorHandling(async (runId, opts) => {
      if (!client || !orgId) throw new AppError(ERROR_CODE.AUTH_MISSING, 'Authentication required. Run: yunxiao auth login');
      const pipelineId = opts.pipeline || process.env.YUNXIAO_PIPELINE_ID;
      if (!pipelineId) {
        printError("INVALID_ARGS", "pipeline ID required (--pipeline or YUNXIAO_PIPELINE_ID)", jsonMode);
        process.exit(1);
      }

      const run = await getPipelineRun(client, orgId, pipelineId, runId);

      if (jsonMode) {
        printJson(run);
        return;
      }

      console.log(chalk.bold("\nPipeline Run Status:\n"));
      console.log(`  ${chalk.gray("Run ID:")}       ${run.pipelineRunId || runId}`);
      console.log(`  ${chalk.gray("Pipeline ID:")}  ${run.pipelineId || pipelineId}`);
      console.log(`  ${chalk.gray("Status:")}       ${statusColor(run.status)}`);
      console.log(`  ${chalk.gray("Trigger:")}      ${run.triggerMode || "-"}`);
      console.log(`  ${chalk.gray("Started:")}      ${formatTime(run.startTime)}`);
      console.log(`  ${chalk.gray("Ended:")}        ${formatTime(run.endTime)}`);
      console.log();
    }));
}
