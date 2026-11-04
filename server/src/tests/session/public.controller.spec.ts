import { TestsPublicController } from './public.controller';

// Metadata keys written by @ApiResponse (@nestjs/swagger does not export its constants) and by
// @ZodSerializerDto, from which the interceptor reads the DTO.
const SWAGGER_API_RESPONSE = 'swagger/apiResponse';
const ZOD_SERIALIZER_DTO_OPTIONS = 'ZOD_SERIALIZER_DTO_OPTIONS';

const handlerNames = Object.getOwnPropertyNames(TestsPublicController.prototype).filter(
  (name) => name !== 'constructor',
);

/**
 * `@ApiResponse` and `@ZodSerializerDto` are two decorators that must name the same DTO: the first
 * feeds the OpenAPI document and the generated client, the second decides what a student actually
 * receives. This keeps them from drifting apart, and a new handler from skipping the second.
 */
describe('TestsPublicController response contract', () => {
  it('has handlers to check', () => {
    expect(handlerNames.length).toBeGreaterThanOrEqual(6);
  });

  it.each(handlerNames)('%s sends its response through the DTO it documents', (name) => {
    // The decorators write their metadata on the method function itself.
    const handler = Object.getOwnPropertyDescriptor(TestsPublicController.prototype, name)
      ?.value as object;
    const documented = Reflect.getMetadata(SWAGGER_API_RESPONSE, handler) as Record<
      string,
      { type?: unknown }
    >;
    const successTypes = Object.entries(documented)
      .filter(([status]) => Number(status) < 400)
      .map(([, response]) => response.type);

    expect(successTypes).toHaveLength(1);
    expect(Reflect.getMetadata(ZOD_SERIALIZER_DTO_OPTIONS, handler)).toBe(successTypes[0]);
  });
});
