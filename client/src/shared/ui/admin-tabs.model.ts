/**
 * Связка вкладок с их панелью. Живет отдельно от компонента, чтобы файл с `AdminTabs` экспортировал
 * только компонент — иначе ломается fast refresh.
 */
export const getAdminTabPanelProps = (panelId: string, activeTab: string) => ({
  id: panelId,
  role: 'tabpanel' as const,
  'aria-labelledby': `${panelId}-tab-${activeTab}`,
});
