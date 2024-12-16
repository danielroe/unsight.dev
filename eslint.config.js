import path from 'path';
import { glob } from 'glob';
import {join} from 'path';

const rootDir = path.dirname(new URL(import.meta.url).pathname);

// Get all package eslint configs and only apply them to files in that package
const packageConfigs = await Promise.all(
  glob.sync(join(rootDir, 'packages/*/eslint.config.js')).map(async (configPath) => {
    const packageConfig = await import(configPath);
    const packageDir = path.dirname(configPath);

    return {
      // default[0] is the default export from the config file
      ...packageConfig.default[0],
      files: [`${packageDir}/**/*`]
    };
  })
);

export default [
  ...packageConfigs,
  {
    files: ['*.js'],
  }
];