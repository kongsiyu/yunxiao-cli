// src/commands/pipeline.js
import chalk from "chalk";
import { createPipelineRun } from "../api.js";
import { printJson, printError } from "../output.js";

export function registerPipelineCommands(program, client, orgId, withErrorHandling, jsonMode) {
  const pl = program.command("pipeline").description("Manage pipelines");

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
