import chalk from "chalk";
import { getCurrentUser } from "../api.js";
import { AppError, ERROR_CODE } from "../errors.js";
import { t } from "../i18n/index.js";

export function registerWhoamiCommand(program, client, withErrorHandling) {
  program
    .command("whoami")
    .description("Show current authenticated user")
    .action(withErrorHandling(async () => {
      if (!client) {
        throw new AppError(ERROR_CODE.AUTH_MISSING, t("errors.auth.required", "Authentication required. Run: yunxiao auth login"));
      }

      const user = await getCurrentUser(client);
      console.log(chalk.bold(`\n${t("commands.whoami.title", "Current user:")}\n`));
      console.log(`  ${chalk.gray(`${t("output.header.id", "ID")}:`)} ${user.id}`);
      console.log(`  ${chalk.gray(`${t("output.header.name", "Name")}:`)} ${user.name || "-"}`);
      console.log(`  ${chalk.gray(`${t("output.header.email", "Email")}:`)} ${user.email || "-"}`);
      console.log(`  ${chalk.gray(`${t("commands.whoami.orgLabel", "Org")}:`)} ${user.lastOrganization || "-"}`);
      console.log(`  ${chalk.gray(`${t("output.header.created", "Created")}:`)} ${user.createdAt ? user.createdAt.split("T")[0] : "-"}`);
      console.log();
    }));
}
