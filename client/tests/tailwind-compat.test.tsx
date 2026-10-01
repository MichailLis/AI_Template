// @vitest-environment node
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import postcss, { type Root } from 'postcss';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeAll, describe, expect, it } from 'vitest';

import { adminClassNames } from '@/shared/ui/admin-design-tokens';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { DialogFooter } from '@/shared/ui/dialog';
import { FormItem } from '@/shared/ui/form';
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';
import { PublicQuestionCard } from '@/widgets/public-test-workspace/ui/public-question-card';

describe('production Tailwind CSS compatibility', () => {
  let css: Root;

  beforeAll(async () => {
    const { default: config } = await import('../postcss.config.js');
    const plugins = await Promise.all(
      Object.entries(config.plugins).map(async ([name, options]) => {
        const { default: plugin } = await import(/* @vite-ignore */ name);
        return plugin(options);
      }),
    );
    const from = path.resolve('src/app/index.css');
    css = (await postcss(plugins).process(await readFile(from, 'utf8'), { from })).root;
  }, 30_000);

  const declarations = (className: string) => {
    const selector = `.${className.replaceAll(/[^\w-]/g, '\\$&')}`;
    const values: Record<string, string[]> = {};
    css.walkRules((rule) => {
      if (
        rule.selector !== selector &&
        !rule.selector.startsWith(`${selector}:`) &&
        !rule.selector.startsWith(`${selector}[`)
      )
        return;
      rule.walkDecls((declaration) => {
        (values[declaration.prop] ??= []).push(declaration.value);
      });
    });
    return values;
  };

  const classes = (markup: string) => markup.match(/class="([^"]+)"/)![1].split(' ');
  const shadow = (markup: string) => {
    const className = classes(markup).find((value) => /^shadow(?:-|$)/.test(value))!;
    return declarations(className)['--tw-shadow']?.join(' ');
  };

  it('keeps the small elevation on inputs and secondary buttons', () => {
    for (const markup of [
      renderToStaticMarkup(createElement(Input)),
      renderToStaticMarkup(createElement(Button, { variant: 'secondary' })),
    ]) {
      expect(shadow(markup)).toContain('0 1px 2px 0');
      expect(shadow(markup)).not.toContain('0 1px 3px 0');
    }
  });

  it('keeps the larger elevation on the default button and card', () => {
    for (const markup of [
      renderToStaticMarkup(createElement(Button)),
      renderToStaticMarkup(createElement(Card)),
    ]) {
      expect(shadow(markup)).toContain('0 1px 3px 0');
      expect(shadow(markup)).toContain('0 1px 2px -1px');
    }
  });

  it('keeps a transparent focus outline available to forced colors', () => {
    const outline = classes(renderToStaticMarkup(createElement(Input))).find((value) =>
      value.startsWith('focus-visible:outline-'),
    )!;
    expect(JSON.stringify(declarations(outline))).toContain('transparent');
  });

  it('keeps the desktop textarea line height when a public caller sets relaxed mobile leading', () => {
    const markup = renderToStaticMarkup(createElement(Textarea, { className: 'leading-relaxed' }));
    const leading = classes(markup).find((value) => value.startsWith('md:leading-')) ?? '';
    expect(declarations(leading)['--tw-leading'] ?? []).toContain('calc(var(--spacing) * 5)');
  });

  it('keeps the desktop public question heading line height', () => {
    const markup = renderToStaticMarkup(
      createElement(PublicQuestionCard, {
        question: {
          id: 1,
          type: 'OPEN_TEXT',
          title: 'Question',
          description: null,
          required: true,
          order: 1,
          settings: null,
          sliderBands: [],
          options: [],
        },
        currentAnswer: '',
        isLastQuestion: true,
        isSubmitting: false,
        canGoBack: false,
        onAnswerChange: () => {},
        onBack: () => {},
        onNext: () => {},
        onFinish: async () => {},
      }),
    );
    const heading = markup.match(/<h1 class="([^"]+)"/)![1].split(' ');
    const leading = heading.find((value) => value.startsWith('md:leading-')) ?? '';
    expect(declarations(leading)['--tw-leading'] ?? []).toContain('calc(var(--spacing) * 10)');
  });

  it('keeps the admin panel translucency tied to scoped HSL tokens', () => {
    const panel = adminClassNames.nav.mobileButton
      .split(' ')
      .find((value) => value.startsWith('bg-'))!;
    expect(declarations(panel)['background-color']?.join(' ')).toMatch(
      /hsl\(var\(--admin-panel\).*?(0\.8|80%)/,
    );
  });

  it('keeps existing admin gradients in the original sRGB interpolation space', () => {
    const gradient = adminClassNames.sidebar.brandMark
      .split(' ')
      .find((value) => value.startsWith('bg-') && value.includes('to-br'))!;
    expect(declarations(gradient)['--tw-gradient-position']).toContain('to bottom right in srgb');
  });

  it('keeps custom radius and shared border colors', () => {
    expect(declarations('rounded-md')['border-radius']).toContain('calc(var(--radius) - 2px)');
    expect(declarations('rounded-xs')['border-radius']).toContain('calc(var(--radius) - 4px)');
    const borderColors: string[] = [];
    css.walkRules((rule) => {
      if (rule.selector === '*') {
        rule.walkDecls('border-color', (declaration) => {
          borderColors.push(declaration.value);
        });
      }
    });
    expect(borderColors).toContain('hsl(var(--border))');
  });

  it('generates the existing sheet entry and exit animations', () => {
    const names: string[] = [];
    css.walkAtRules('keyframes', (rule) => {
      names.push(rule.params);
    });
    expect(names).toEqual(expect.arrayContaining(['enter', 'exit']));
    expect(declarations('data-[state=open]:animate-in')['animation-name']).toContain('enter');
    expect(declarations('data-[state=closed]:animate-out')['animation-name']).toContain('exit');
    expect(
      declarations('data-[state=open]:slide-in-from-right')['--tw-enter-translate-x'],
    ).toContain('100%');
  });

  it('spaces form controls and footer actions after their preceding visible sibling, including the last child', () => {
    for (const [markup, property, token] of [
      [renderToStaticMarkup(createElement(FormItem)), 'margin-top', 'space-y-2'],
      [renderToStaticMarkup(createElement(DialogFooter)), 'margin-left', 'sm:space-x-2'],
    ]) {
      const space = classes(markup).find((value) => value === token)!;
      const selector = `.${space.replaceAll(/[^\w-]/g, '\\$&')} > :not([hidden]) ~ :not([hidden])`;
      const values: string[] = [];
      css.walkRules((rule) => {
        if (rule.selector === selector) {
          rule.walkDecls(property, (declaration) => {
            values.push(declaration.value);
          });
        }
      });
      expect(values.join(' ')).toMatch(/(0\.5rem|var\(--spacing\) \* 2)/);
    }
  });

  it('keeps the pointer cursor for enabled action buttons', () => {
    const cursors: string[] = [];
    css.walkRules((rule) => {
      if (
        rule.selector.includes('button:not(:disabled)') ||
        rule.selector === 'button,\n[role="button"]'
      ) {
        rule.walkDecls('cursor', (declaration) => {
          cursors.push(declaration.value);
        });
      }
    });
    expect(cursors).toContain('pointer');
  });

  it('resets the new trailing margins after the built-in space utilities', () => {
    for (const [axis, property] of [
      ['y', 'margin-block-end'],
      ['x', 'margin-inline-end'],
    ]) {
      const values: string[] = [];
      css.walkRules((rule) => {
        if (rule.selector.startsWith(':where(') && rule.selector.includes(`space-${axis}-`)) {
          rule.walkDecls(property, (declaration) => {
            values.push(declaration.value);
          });
        }
      });
      expect(values.at(-1)).toBe('0');
    }
  });
});
