import globals from "globals";
import pluginJs from "@eslint/js";


export default [
  {
    languageOptions: {
      globals: globals.browser,
    },
  },
  pluginJs.configs.recommended,
  
  {
    rules: {
      // Example of adding custom rules
      "no-console": "warn",  // Warns when console statements are used
      "semi": ["error", "always"],  // Enforces the use of semicolons
    },
  },
];
