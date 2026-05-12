import { BadRequestException } from '@nestjs/common';

import { PrismaService } from '../prisma.service';
import { TestsQuestionService } from './tests-question.service';

type QuestionOrderUpdateArgs = {
  where: {
    id: number;
  };
  data: {
    order: number;
  };
};

describe('TestsQuestionService', () => {
  let service: TestsQuestionService;
  let updateQuestionMock: jest.Mock<Promise<unknown>, [QuestionOrderUpdateArgs]>;
  let transactionMock: jest.Mock;
  let txMock: {
    testQuestion: {
      update: jest.Mock<Promise<unknown>, [QuestionOrderUpdateArgs]>;
    };
  };

  beforeEach(() => {
    updateQuestionMock = jest
      .fn<Promise<unknown>, [QuestionOrderUpdateArgs]>()
      .mockResolvedValue({});
    txMock = {
      testQuestion: {
        update: updateQuestionMock,
      },
    };
    transactionMock = jest.fn((callback: (tx: typeof txMock) => unknown) => callback(txMock));

    service = new TestsQuestionService({
      $transaction: transactionMock,
    } as unknown as PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('reorderQuestions swaps two questions through temporary negative orders', async () => {
    await service.reorderQuestions(
      {
        id: 10,
        questions: [
          { id: 100, order: 1 },
          { id: 200, order: 2 },
        ],
      },
      {
        questionIds: [200, 100],
      },
    );

    expect(updateQuestionMock).toHaveBeenCalledTimes(4);
    expect(updateQuestionMock.mock.calls.map(([args]) => args)).toEqual([
      {
        where: { id: 200 },
        data: { order: -1 },
      },
      {
        where: { id: 100 },
        data: { order: -2 },
      },
      {
        where: { id: 200 },
        data: { order: 1 },
      },
      {
        where: { id: 100 },
        data: { order: 2 },
      },
    ]);
  });

  it('reorderQuestions rejects duplicate question ids before opening a transaction', async () => {
    await expect(
      service.reorderQuestions(
        {
          id: 10,
          questions: [
            { id: 100, order: 1 },
            { id: 200, order: 2 },
          ],
        },
        {
          questionIds: [100, 100],
        },
      ),
    ).rejects.toThrow(BadRequestException);

    expect(transactionMock).not.toHaveBeenCalled();
  });
});
