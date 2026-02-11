import { useQueryClient } from '@tanstack/react-query';

import { CalculatorWidget } from '@/features/calculator/calculator-widget';
import { HistoryList } from '@/features/calculator/history-list';
import { getCalculatorControllerFindAllQueryKey } from '@/shared/api/generated/calculator/calculator';

const CalculatorPage = () => {
  const queryClient = useQueryClient();

  const handleCalculate = () => {
    queryClient.invalidateQueries({ queryKey: getCalculatorControllerFindAllQueryKey() });
  };

  return (
    <div className="container mx-auto p-4 space-y-8">
      <h1 className="text-2xl font-bold text-center">Cloud Calculator</h1>
      <div className="grid md:grid-cols-2 gap-8">
        <CalculatorWidget onCalculate={handleCalculate} />
        <HistoryList />
      </div>
    </div>
  );
};

export default CalculatorPage;
