import { ProfessionAtlasClientService } from './profession-atlas-client.service';

describe('ProfessionAtlasClientService', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('reads the items of a JSON response', async () => {
    jest
      .spyOn(global, 'fetch')
      .mockResolvedValue(
        new Response(JSON.stringify({ items: [{ title: 'Инженер', slug: 'engineer' }] })),
      );

    await expect(
      new ProfessionAtlasClientService().findProfessions('https://atlas.example/api-backend'),
    ).resolves.toEqual([expect.objectContaining({ title: 'Инженер', slug: 'engineer' })]);
  });

  it('names a wrong API URL when the Atlas site answers with its HTML page', async () => {
    jest
      .spyOn(global, 'fetch')
      .mockResolvedValue(
        new Response('<!doctype html><html></html>', { headers: { 'content-type': 'text/html' } }),
      );

    await expect(
      new ProfessionAtlasClientService().findProfessions('https://atlas.example/wrong'),
    ).rejects.toMatchObject({
      message: 'Атлас вернул страницу вместо данных: проверьте адрес API в настройках',
    });
  });
});
