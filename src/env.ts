import { defineEnvVars } from "@sveltejs/kit/env";

export const variables = defineEnvVars({
  API_TOKEN_CODEBERG: { static: true },
  API_TOKEN_GITHUB: { static: true },
});
