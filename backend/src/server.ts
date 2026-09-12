import { app } from "./app.js";
import { config } from "./config/env.js";

const PORT = config.port;

app.listen(PORT, () => {
  console.log(`[SecureBank Backend] Server running on http://localhost:${PORT}`);
  console.log(`[SecureBank Backend] Environment: ${config.nodeEnv}`);
});
