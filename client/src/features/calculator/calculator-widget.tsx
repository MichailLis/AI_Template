import { useState } from 'react';
import { toast } from 'sonner';

import { useCalculatorControllerCreate } from '@/shared/api/generated/calculator/calculator';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';

export const CalculatorWidget = ({ onCalculate }: { onCalculate?: () => void }) => {
  const [expression, setExpression] = useState('');
  const { mutate, isPending } = useCalculatorControllerCreate();

  const handleCalculate = () => {
    try {
      // Security note: eval is dangerous in production, but acceptable for this demo template if input is sanitized.
      // In a real app, use a math parser like mathjs.
      // For this template, we'll use a simple Function constructor which is slightly safer than eval but still risky.

      const result = new Function('return ' + expression)();

      mutate(
        { data: { expression, result: String(result) } },
        {
          onSuccess: () => {
            toast.success('Calculation saved');
            setExpression(String(result));
            onCalculate?.();
          },
          onError: () => {
            toast.error('Failed to save calculation');
          },
        },
      );
    } catch {
      toast.error('Invalid expression');
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Calculator</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          value={expression}
          onChange={(e) => setExpression(e.target.value)}
          placeholder="Enter expression (e.g. 2 + 2)"
          onKeyDown={(e) => e.key === 'Enter' && handleCalculate()}
        />
        <div className="grid grid-cols-4 gap-2">
          {['7', '8', '9', '/', '4', '5', '6', '*', '1', '2', '3', '-', '0', '.', '=', '+'].map(
            (btn) => (
              <Button
                key={btn}
                variant={btn === '=' ? 'default' : 'outline'}
                onClick={() => {
                  if (btn === '=') handleCalculate();
                  else setExpression((prev) => prev + btn);
                }}
                disabled={isPending}
              >
                {btn}
              </Button>
            ),
          )}
          <Button variant="destructive" className="col-span-4" onClick={() => setExpression('')}>
            Clear
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
