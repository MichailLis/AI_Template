import { TestsTopicListQuerySchema } from './tests.dto';

describe('TestsTopicListQuerySchema', () => {
  it('parses archived=false query string as false', () => {
    const result = TestsTopicListQuerySchema.parse({ archived: 'false' });

    expect(result.archived).toBe(false);
  });

  it('parses archived=true query string as true', () => {
    const result = TestsTopicListQuerySchema.parse({ archived: 'true' });

    expect(result.archived).toBe(true);
  });
});
