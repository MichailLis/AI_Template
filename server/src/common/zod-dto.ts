import { createZodDto as baseCreateZodDto } from 'nestjs-zod';

// zod >= 4.6 emits nullable as `type: [X, 'null']`; nestjs-zod 5.5.0 turns that into an array
// schema in the OpenAPI 3.0 document. Rewrite to `type: X, nullable: true` before it does.
// shortcut: only two-element [X, 'null'] unions and no `.Output` DTOs, drop this wrapper once
// nestjs-zod supports zod 4.6 (revert imports to 'nestjs-zod').
export const nullableTypeArraysToOpenApi30 = <T>(node: T): T => {
  if (Array.isArray(node)) return node.map(nullableTypeArraysToOpenApi30) as T;
  if (node === null || typeof node !== 'object') return node;
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(node)) {
    result[key] = nullableTypeArraysToOpenApi30(value);
  }
  const type = result.type;
  if (Array.isArray(type) && type.length === 2 && type.includes('null')) {
    result.type = type.find((entry) => entry !== 'null');
    result.nullable = true;
  }
  return result as T;
};

export const createZodDto = ((...args: Parameters<typeof baseCreateZodDto>) => {
  const dto = baseCreateZodDto(...args);
  const metadata = dto as unknown as { _OPENAPI_METADATA_FACTORY: () => unknown };
  const factory = metadata._OPENAPI_METADATA_FACTORY;
  metadata._OPENAPI_METADATA_FACTORY = () => {
    const raw: unknown = Reflect.apply(factory, dto, []);
    return nullableTypeArraysToOpenApi30(raw);
  };
  return dto;
}) as typeof baseCreateZodDto;
