
import app from "./app";
import { env } from "./config/env";
import {
  connectDatabase,
  disconnectDatabase,
} from "./config/database";

async function bootstrap(): Promise<void> {
  try {
    await connectDatabase();

    const server = app.listen(env.PORT, () => {
      console.log("-----------------------------------");
      console.log("Aqar Lite API is running");
      console.log(`Environment: ${env.NODE_ENV}`);
      console.log(`Server: http://localhost:${env.PORT}`);
      console.log(
        `Health Check: http://localhost:${env.PORT}${env.API_PREFIX}/health`
      );
      console.log("-----------------------------------");
    });

    let isShuttingDown = false;

    const shutdown = (signal: string): void => {
      if (isShuttingDown) return;

      isShuttingDown = true;

      console.log(`${signal} received. Shutting down gracefully...`);

      server.close(() => {
        void disconnectDatabase()
          .then(() => {
            console.log("Server shutdown completed");
            process.exit(0);
          })
          .catch((error: unknown) => {
            console.error("Database disconnection failed:", error);
            process.exit(1);
          });
      });
    };

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));

    server.on("error", (error: NodeJS.ErrnoException) => {
      console.error("HTTP Server Error:", error);

      if (error.code === "EADDRINUSE") {
        console.error(`Port ${env.PORT} is already in use.`);
      }

      void disconnectDatabase().finally(() => {
        process.exit(1);
      });
    });
  } catch (error: unknown) {
    console.error("Application startup failed:", error);

    await disconnectDatabase().catch((disconnectError: unknown) => {
      console.error("Database disconnection failed:", disconnectError);
    });

    process.exitCode = 1;
  }
}

void bootstrap();
