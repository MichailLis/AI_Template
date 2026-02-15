import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';

interface TestsSidebarSearchSectionProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
}

export function TestsSidebarSearchSection({
  searchValue,
  onSearchChange,
}: TestsSidebarSearchSectionProps) {
  return (
    <div className="space-y-2 border-t border-slate-200 pt-4">
      <Label htmlFor="tests-search">Поиск теста</Label>
      <Input
        id="tests-search"
        value={searchValue}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Название или slug"
      />
    </div>
  );
}
