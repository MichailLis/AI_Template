import { AnalysisPromptsController } from './analysis-prompts.controller';
import { AnalysisPromptsService } from './analysis-prompts.service';

describe('AnalysisPromptsController', () => {
  let controller: AnalysisPromptsController;
  let serviceMock: {
    listPrompts: jest.Mock;
    createPrompt: jest.Mock;
    publishVersion: jest.Mock;
    simulatePrompt: jest.Mock;
  };

  beforeEach(() => {
    serviceMock = {
      listPrompts: jest.fn(),
      createPrompt: jest.fn(),
      publishVersion: jest.fn(),
      simulatePrompt: jest.fn(),
    };

    controller = new AnalysisPromptsController(serviceMock as unknown as AnalysisPromptsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('listPrompts delegates to service', async () => {
    const response = { prompts: [] };
    serviceMock.listPrompts.mockResolvedValue(response);

    await expect(controller.listPrompts(7)).resolves.toEqual(response);
    expect(serviceMock.listPrompts).toHaveBeenCalledWith(7);
  });

  it('createPrompt delegates to service', async () => {
    const dto = {
      title: 'Career guidance analysis',
      description: null,
      model: 'google/gemini-2.0-flash-exp:free',
      temperature: 0.2,
      prompt: 'Analyze {{answers}}',
    };
    const response = { prompts: [] };
    serviceMock.createPrompt.mockResolvedValue(response);

    await expect(controller.createPrompt(7, dto)).resolves.toEqual(response);
    expect(serviceMock.createPrompt).toHaveBeenCalledWith(7, dto);
  });

  it('publishVersion delegates to service with numeric route param', async () => {
    const response = { id: 42, status: 'PUBLISHED' };
    serviceMock.publishVersion.mockResolvedValue(response);

    await expect(controller.publishVersion(7, 42)).resolves.toEqual(response);
    expect(serviceMock.publishVersion).toHaveBeenCalledWith(7, 42);
  });

  it('simulatePrompt delegates to service', async () => {
    const dto = {
      prompt: 'Analyze selected answers',
      model: 'google/gemini-2.0-flash-exp:free',
      temperature: 0.2,
      questionIds: [11],
      generateAnswers: true,
    };
    const response = { model: dto.model, output: '{}', syntheticAnswers: null, questionCount: 1 };
    serviceMock.simulatePrompt.mockResolvedValue(response);

    await expect(controller.simulatePrompt(7, dto)).resolves.toEqual(response);
    expect(serviceMock.simulatePrompt).toHaveBeenCalledWith(7, dto);
  });
});
