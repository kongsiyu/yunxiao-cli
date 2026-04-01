// src/commands/pipeline.js
import chalk from "chalk";
import { getPipelineRun } from "../api.js";
import { printJson, printError } from "../output.js";

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
    .command("status <runId>")
    .description("Get the status of a pipeline run")
    .option("-p, --pipeline <id>", "Pipeline ID (default: YUNXIAO_PIPELINE_ID)")
    .action(withErrorHandling(async (runId, opts) => {
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
