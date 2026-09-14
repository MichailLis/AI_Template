import { describe, expect, it } from 'vitest';

import { navGroups, navItems } from './admin-navigation';

const groupLabelOf = (itemId: string) => {
  const item = navItems.find((navItem) => navItem.id === itemId);
  return navGroups.find((group) => group.id === item?.group)?.label;
};

/**
 * Находка аудита UX-11: «Пользователи» и «Промпты» лежали в группе «Контент», хотя управление
 * доступом и сценарии анализа — системные настройки, а не содержимое тестов.
 */
describe('admin navigation groups', () => {
  it('keeps access management and prompts with the system settings', () => {
    expect(groupLabelOf('users')).toBe('Система');
    expect(groupLabelOf('prompts')).toBe('Система');
    expect(groupLabelOf('settings')).toBe('Система');
  });

  it('leaves tests as the content group', () => {
    expect(groupLabelOf('tests')).toBe('Контент');
    expect(navItems.filter((item) => item.group === 'content').map((item) => item.id)).toEqual([
      'tests',
    ]);
  });

  it('lists the content group first so the most used section stays on top', () => {
    const firstGroupWithItems = navGroups.find((group) =>
      navItems.some((item) => item.group === group.id),
    );

    expect(firstGroupWithItems?.label).toBe('Контент');
  });
});
