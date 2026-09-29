import { AppDataSource } from "@src/db/data-source";

const COMMANDS = ["run", "revert", "show"] as const;
type Command = (typeof COMMANDS)[number];

const parseArgs = () => {
  const [command = "run", stepsArg = "1"] = process.argv.slice(2);
  if (!COMMANDS.includes(command as Command)) {
    throw new Error(`Unknown command "${command}". Use one of: ${COMMANDS.join(", ")}`);
  }
  const steps = Number(stepsArg);
  if (!Number.isInteger(steps) || steps < 1) {
    throw new Error(`Invalid steps "${stepsArg}". Must be a positive integer`);
  }
  return { command: command as Command, steps };
};

const run = async () => {
  const applied = await AppDataSource.runMigrations({ transaction: "all" });
  applied.forEach((migration) => console.log(`Applied ${migration.name}`));
  console.log(`Applied ${applied.length} migration(s)`);
};

const revert = async (steps: number) => {
  for (let i = 0; i < steps; i++) {
    const [last] = await AppDataSource.query(`SELECT "name" FROM "migrations" ORDER BY "id" DESC LIMIT 1`).catch(() => []);
    if (!last) {
      console.log("Nothing to revert");
      break;
    }
    await AppDataSource.undoLastMigration({ transaction: "each" });
    console.log(`Reverted ${last.name}`);
  }
};

const timestampOf = (name: string) => Number(name.match(/(\d{13})$/)?.[1] ?? 0);

const show = async () => {
  const executed = new Set<string>(
    (await AppDataSource.query(`SELECT "name" FROM "migrations"`).catch(() => [])).map(
      (row: { name: string }) => row.name,
    ),
  );
  AppDataSource.migrations
    .map((migration) => migration.name ?? migration.constructor.name)
    .sort((a, b) => timestampOf(a) - timestampOf(b))
    .forEach((name) => console.log(`${executed.has(name) ? "[X]" : "[ ]"} ${name}`));
};

const main = async () => {
  const { command, steps } = parseArgs();
  await AppDataSource.initialize();
  try {
    if (command === "run") await run();
    if (command === "revert") await revert(steps);
    if (command === "show") await show();
  } finally {
    await AppDataSource.destroy();
  }
};

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
