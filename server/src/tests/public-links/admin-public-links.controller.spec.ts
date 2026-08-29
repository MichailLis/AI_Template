import {
  type AdminCreatePublicLinkDto,
  type AdminUpdatePublicLinkDto,
} from '../dto/tests-links.dto';
import { TestsAdminPublicLinksController } from '../public-links/admin-public-links.controller';
import { TestsPublicLinkService } from '../public-links/public-link.service';

describe('TestsAdminPublicLinksController', () => {
  let controller: TestsAdminPublicLinksController;
  let serviceMock: {
    createPublicLink: jest.Mock;
    listPublicLinks: jest.Mock;
    listArchivedPublicLinks: jest.Mock;
    updatePublicLink: jest.Mock;
    regeneratePublicLinkShortCode: jest.Mock;
    deletePublicLink: jest.Mock;
    restorePublicLink: jest.Mock;
  };

  beforeEach(() => {
    serviceMock = {
      createPublicLink: jest.fn(),
      listPublicLinks: jest.fn(),
      listArchivedPublicLinks: jest.fn(),
      updatePublicLink: jest.fn(),
      regeneratePublicLinkShortCode: jest.fn(),
      deletePublicLink: jest.fn(),
      restorePublicLink: jest.fn(),
    };

    controller = new TestsAdminPublicLinksController(
      serviceMock as unknown as TestsPublicLinkService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('createPublicLink delegates to service', async () => {
    const dto: AdminCreatePublicLinkDto = {
      publishedVersionId: 12,
      consentVersion: 'v1',
      consentText: 'consent',
    };
    const response = { id: 9 };

    serviceMock.createPublicLink.mockResolvedValue(response);

    await expect(controller.createPublicLink(7, dto)).resolves.toEqual(response);
    expect(serviceMock.createPublicLink).toHaveBeenCalledWith(7, dto);
  });

  it('listPublicLinks delegates to service', async () => {
    const response = { links: [] };
    serviceMock.listPublicLinks.mockResolvedValue(response);

    await expect(controller.listPublicLinks(7)).resolves.toEqual(response);
    expect(serviceMock.listPublicLinks).toHaveBeenCalledWith(7);
  });

  it('listArchivedPublicLinks delegates to service', async () => {
    const response = { links: [] };
    serviceMock.listArchivedPublicLinks.mockResolvedValue(response);

    await expect(controller.listArchivedPublicLinks(7)).resolves.toEqual(response);
    expect(serviceMock.listArchivedPublicLinks).toHaveBeenCalledWith(7);
  });

  it('updatePublicLink delegates to service', async () => {
    const dto: AdminUpdatePublicLinkDto = {
      isActive: false,
    };
    const response = { id: 5, isActive: false };

    serviceMock.updatePublicLink.mockResolvedValue(response);

    await expect(controller.updatePublicLink(7, 5, dto)).resolves.toEqual(response);
    expect(serviceMock.updatePublicLink).toHaveBeenCalledWith(7, 5, dto);
  });

  it('regeneratePublicLinkShortCode delegates to service', async () => {
    const response = { id: 5, shortCode: 'NEW12' };
    serviceMock.regeneratePublicLinkShortCode.mockResolvedValue(response);

    await expect(controller.regeneratePublicLinkShortCode(7, 5)).resolves.toEqual(response);
    expect(serviceMock.regeneratePublicLinkShortCode).toHaveBeenCalledWith(7, 5);
  });

  it('deletePublicLink delegates to service', async () => {
    const response = { linkId: 5 };
    serviceMock.deletePublicLink.mockResolvedValue(response);

    await expect(controller.deletePublicLink(7, 5)).resolves.toEqual(response);
    expect(serviceMock.deletePublicLink).toHaveBeenCalledWith(7, 5);
  });

  it('restorePublicLink delegates to service', async () => {
    const response = { id: 5 };
    serviceMock.restorePublicLink.mockResolvedValue(response);

    await expect(controller.restorePublicLink(7, 5)).resolves.toEqual(response);
    expect(serviceMock.restorePublicLink).toHaveBeenCalledWith(7, 5);
  });
});
