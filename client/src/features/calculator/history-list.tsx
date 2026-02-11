import { useCalculatorControllerFindAll } from '@/shared/api/generated/calculator/calculator';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';

export const HistoryList = () => {
  const { data: history } = useCalculatorControllerFindAll();

  // Expose refetch to parent via some mechanism or just rely on react-query invalidation?
  // Ideally we invalidate queries. But for simplicity, we'll just re-mount or use query key invalidation.
  // Actually, let's just use the hook.

  return (
    <Card>
      <CardHeader>
        <CardTitle>History</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {history?.map((item) => (
            <li key={item.id} className="flex justify-between p-2 border rounded">
              <span>{item.expression}</span>
              <span className="font-bold">= {item.result}</span>
            </li>
          ))}
          {history?.length === 0 && <p className="text-muted-foreground">No history yet.</p>}
        </ul>
      </CardContent>
    </Card>
  );
};
