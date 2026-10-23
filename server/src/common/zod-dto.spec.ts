import { nullableTypeArraysToOpenApi30 } from './zod-dto';

describe('nullableTypeArraysToOpenApi30', () => {
  it('rewrites nested [X, null] type arrays to nullable', () => {
    expect(
      nullableTypeArraysToOpenApi30({
        name: { type: ['string', 'null'] },
        list: [{ type: ['null', 'number'] }],
      }),
    ).toEqual({
      name: { type: 'string', nullable: true },
      list: [{ type: 'number', nullable: true }],
    });
  });

  it('leaves plain types untouched', () => {
    const schema = { type: 'string', enum: ['a'] };
    expect(nullableTypeArraysToOpenApi30(schema)).toEqual(schema);
  });
});
