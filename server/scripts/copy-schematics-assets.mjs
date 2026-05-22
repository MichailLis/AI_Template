import { cp, mkdir, copyFile } from 'node:fs/promises';

const resourceSourceUrl = new URL('../schematics/resource/', import.meta.url);
const resourceTargetUrl = new URL('../dist/schematics/resource/', import.meta.url);

await mkdir(resourceTargetUrl, { recursive: true });
await cp(new URL('files/', resourceSourceUrl), new URL('files/', resourceTargetUrl), {
  force: true,
  recursive: true,
});
await copyFile(
  new URL('schema.json', resourceSourceUrl),
  new URL('schema.json', resourceTargetUrl),
);
