import { AnalysisPromptsController } from './analysis-prompts.controller';
import { AnalysisPromptsService } from './analysis-prompts.service';

describe('AnalysisPromptsController', () => {
  let controller: AnalysisPromptsController;
  let serviceMock: {
    listPrompts: jest.Mock;
    createPrompt: jest.Mock;
    updatePrompt: jest.Mock;
    deletePrompt: jest.Mock;
    publishVersion: jest.Mock;
    simulatePrompt: jest.Mock;
    listTestQuestions: jest.Mock;
  };

  beforeEach(() => {
    serviceMock = {
      listPrompts: jest.fn(),
      createPrompt: jest.fn(),
      updatePrompt: jest.fn(),
      deletePrompt: jest.fn(),
      publishVersion: jest.fn(),
      simulatePrompt: jest.fn(),
      listTestQuestions: jest.fn(),
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

  it('updatePrompt delegates to service with numeric route param', async () => {
    const dto = {
      title: 'Updated prompt',
      model: 'openai/gpt-4.1',
      temperature: 0.4,
      prompt: 'Analyze updated answers',
    };
    const response = { prompt: { id: 7 } };
    serviceMock.updatePrompt.mockResolvedValue(response);

    await expect(controller.updatePrompt(7, 9, dto)).resolves.toEqual(response);
    expect(serviceMock.updatePrompt).toHaveBeenCalledWith(7, 9, dto);
  });

  it('deletePrompt delegates to service with numeric route param', async () => {
    const response = { prompt: { id: 9 } };
    serviceMock.deletePrompt.mockResolvedValue(response);

    await expect(controller.deletePrompt(7, 9)).resolves.toEqual(response);
    expect(serviceMock.deletePrompt).toHaveBeenCalledWith(7, 9);
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

  it('listTestQuestions delegates to service', async () => {
    const response = { tests: [] };
    serviceMock.listTestQuestions.mockResolvedValue(response);

    await expect(controller.listTestQuestions(7)).resolves.toEqual(response);
    expect(serviceMock.listTestQuestions).toHaveBeenCalledWith(7);
  });
});
