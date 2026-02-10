import {
  apply,
  applyTemplates,
  mergeWith,
  move,
  Rule,
  url,
} from '@angular-devkit/schematics';
import { strings } from '@angular-devkit/core';

export function resource(options: any): Rule {
  return () => {
    const templateSource = apply(url('./files'), [
      applyTemplates({
        ...options,
        ...strings,
      }),
      move(`src/${strings.dasherize(options.name)}`),
    ]);

    return mergeWith(templateSource);
  };
}
