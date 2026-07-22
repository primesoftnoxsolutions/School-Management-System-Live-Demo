import app from "./app.js";
import { connectDB } from "./config/db.js";
import { env } from "./config/env.js";
import { purgeDemoData } from "./seed/purgeDemoData.js";
import { seedFinanceManager } from "./seed/seedFinanceManager.js";
import { seedShowcaseData } from "./seed/seedShowcaseData.js";
import { seedSuperAdmin } from "./seed/seedSuperAdmin.js";

const start = async () => {
  await connectDB();
  await purgeDemoData();
  await seedSuperAdmin();
  await seedFinanceManager();

  // Showcase/demo dataset for presentations (idempotent). Set SEED_SHOWCASE=false to skip.
  if (process.env.SEED_SHOWCASE !== "false") {
    const result = await seedShowcaseData();
    console.log(
      `Showcase data ready: ${result.students} students, ${result.teachers} teachers, ${result.assets} assets`
    );
  }

  const server = app.listen(env.port, () => {
    console.log(`Server running on port ${env.port} (${env.nodeEnv})`);
    if (env.isProduction) {
      console.log("Production mode: open http://localhost:" + env.port);
    }
  });

  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.error(
        `Port ${env.port} is already in use. Stop the other backend (Ctrl+C) or kill the process on that port, then try again.`
      );
      process.exit(1);
    }
    throw err;
  });
};

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
