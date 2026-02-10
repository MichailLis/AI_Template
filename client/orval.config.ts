import { defineConfig } from 'orval';

export default defineConfig({
  api: {
    input: '../server/openapi.json',
    output: {
      mode: 'tags-split',
      target: 'src/shared/api/generated',
      schemas: 'src/shared/api/model',
      client: 'react-query',
      httpClient: 'axios', // Явно указываем axios
      override: {
        mutator: {
          path: './src/shared/api/api.ts',
          name: 'customInstance',
        },
      },
    },
  },
});
