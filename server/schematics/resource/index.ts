import {
  apply,
  applyTemplates,
  mergeWith,
  move,
  Rule,
  url,
  Tree,
  chain,
} from '@angular-devkit/schematics';
import { strings } from '@angular-devkit/core';

function updateAppModule(options: any): Rule {
  return (tree: Tree) => {
    const appModulePath = 'src/app.module.ts';
    const content = tree.read(appModulePath);
    if (!content) return tree;

    const source = content.toString();
    const name = strings.classify(options.name);
    const dasherizedName = strings.dasherize(options.name);
    
    const moduleName = `${name}Module`;
    const importStatement = `import { ${moduleName} } from './${dasherizedName}/${dasherizedName}.module';`;
    
    if (source.includes(importStatement)) return tree;

    // 1. Вставляем импорт в начало файла (после последнего существующего импорта)
    const lines = source.split('\n');
    let lastImportIndex = -1;
    lines.forEach((line, index) => {
      if (line.trim().startsWith('import ')) lastImportIndex = index;
    });
    lines.splice(lastImportIndex + 1, 0, importStatement);
    let newContent = lines.join('\n');

    // 2. Добавляем модуль в массив imports
    // Регулярное выражение ищет содержимое внутри imports: [ ... ]
    const importsRegex = /imports:\s*\[([\s\S]*?)\]/;
    newContent = newContent.replace(importsRegex, (match, p1) => {
      // Очищаем существующие модули от лишних пробелов и запятых
      const modules = p1.split(',')
        .map(m => m.trim())
        .filter(m => m.length > 0);
      
      if (!modules.includes(moduleName)) {
        modules.push(moduleName);
      }

      // Форматируем красиво: каждый модуль с новой строки с отступом
      const formattedModules = modules.join(',\n    ');
      return `imports: [\n    ${formattedModules},\n  ]`;
    });

    tree.overwrite(appModulePath, newContent);
    return tree;
  };
}

export function resource(options: any): Rule {
  return chain([
    mergeWith(
      apply(url('./files'), [
        applyTemplates({
          ...options,
          ...strings,
        }),
        move(`src/${strings.dasherize(options.name)}`),
      ])
    ),
    updateAppModule(options),
  ]);
}
