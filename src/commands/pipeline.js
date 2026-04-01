// src/commands/pipeline.js
import chalk from "chalk";
import { listPipelines } from "../api.js";
import { printJson, printError } from "../output.js";

export function registerPipelineCommands(program, client, orgId, withErrorHandling, jsonMode) {
  const pl = program.command("pipeline").description("Manage pipelines");

  pl
    .command("list")
    .description("List pipelines")
    .option("--limit <n>", "Max results", "20")
    .action(withErrorHandling(async (opts) => {
      if (!orgId) {
        printError("INVALID_ARGS", "org ID required (YUNXIAO_ORG_ID)", jsonMode);
        process.exit(1);
      }
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
}
