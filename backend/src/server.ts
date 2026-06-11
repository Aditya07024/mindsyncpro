import { env } from "@/config/env";
import { createApp } from "@/app";

createApp()
  .then((app) => {
    app.listen(Number(env.PORT), () => {
      console.log(`mymindtherapyfriend API running on ${env.PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to start server", error);
    process.exit(1);
  });
