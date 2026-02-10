import { CreateCategoryForm } from '@/features/create-category/ui/create-category-form';
import { useCategoryControllerFindAll } from '@/shared/api/generated/category/category';
import { Card, CardContent } from '@/shared/ui/card';

export default function CategoriesPage() {
  // Теперь data имеет тип CategoryResponseDto[] автоматически!
  const { data: categories, isLoading } = useCategoryControllerFindAll();

  return (
    <div className="container mx-auto p-6 max-w-md space-y-8">
      <h1 className="text-2xl font-bold">Categories</h1>
      <CreateCategoryForm />
      <div className="space-y-2">
        {isLoading && <p>Loading...</p>}
        {categories?.map((cat) => (
          <Card key={cat.id}>
            <CardContent className="p-4 flex items-center justify-between">
              <span>{cat.name}</span>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
