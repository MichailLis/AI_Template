'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.resource = resource;
const schematics_1 = require('@angular-devkit/schematics');
const core_1 = require('@angular-devkit/core');
function updateAppModule(options) {
  return (tree) => {
    const appModulePath = 'src/app.module.ts';
    const content = tree.read(appModulePath);
    if (!content) return tree;
    const source = content.toString();
    const name = core_1.strings.classify(options.name);
    const dasherizedName = core_1.strings.dasherize(options.name);
    const moduleName = `${name}Module`;
    const importStatement = `import { ${moduleName} } from './${dasherizedName}/${dasherizedName}.module';`;
    if (source.includes(importStatement)) return tree;
    const lines = source.split('\n');
    let lastImportIndex = -1;
    lines.forEach((line, index) => {
      if (line.trim().startsWith('import ')) lastImportIndex = index;
    });
    lines.splice(lastImportIndex + 1, 0, importStatement);
    let newContent = lines.join('\n');
    const importsRegex = /imports:\s*\[([\s\S]*?)\]/;
    newContent = newContent.replace(importsRegex, (match, p1) => {
      const modules = p1
        .split(',')
        .map((m) => m.trim())
        .filter((m) => m.length > 0);
      if (!modules.includes(moduleName)) {
        modules.push(moduleName);
      }
      const formattedModules = modules.join(',\n    ');
      return `imports: [\n    ${formattedModules},\n  ]`;
    });
    tree.overwrite(appModulePath, newContent);
    return tree;
  };
}
function resource(options) {
  return (0, schematics_1.chain)([
    (0, schematics_1.mergeWith)(
      (0, schematics_1.apply)((0, schematics_1.url)('./files'), [
        (0, schematics_1.applyTemplates)({
          ...options,
          ...core_1.strings,
        }),
        (0, schematics_1.move)(`src/${core_1.strings.dasherize(options.name)}`),
      ]),
    ),
    updateAppModule(options),
  ]);
}
//# sourceMappingURL=index.js.map
