import { getServerEnv, ServerEnvError } from "../src/server/env/server-env";

try {
  const env = getServerEnv();
  console.log(`Database environment validation passed for ${env.adminDataSource} data source.`);
} catch (error) {
  if (error instanceof ServerEnvError) {
    console.error(error.message);
    if (error.missingVariables.length > 0) {
      console.error(`Missing variables: ${error.missingVariables.join(", ")}`);
    }
    if (error.invalidVariables.length > 0) {
      console.error(`Invalid variables: ${error.invalidVariables.join(", ")}`);
    }
  } else {
    console.error("Database environment validation failed.");
  }
  process.exit(1);
}
