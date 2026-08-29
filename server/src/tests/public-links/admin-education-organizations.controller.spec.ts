import {
  type AdminCreateEducationOrganizationDto,
  type AdminUpdateEducationOrganizationDto,
} from '../dto/tests-links.dto';
import { TestsAdminEducationOrganizationsController } from '../public-links/admin-education-organizations.controller';
import { TestsPublicLinkService } from '../public-links/public-link.service';

describe('TestsAdminEducationOrganizationsController', () => {
  let controller: TestsAdminEducationOrganizationsController;
  let serviceMock: {
    listEducationOrganizations: jest.Mock;
    createEducationOrganization: jest.Mock;
    updateEducationOrganization: jest.Mock;
  };

  beforeEach(() => {
    serviceMock = {
      listEducationOrganizations: jest.fn(),
      createEducationOrganization: jest.fn(),
      updateEducationOrganization: jest.fn(),
    };

    controller = new TestsAdminEducationOrganizationsController(
      serviceMock as unknown as TestsPublicLinkService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('listEducationOrganizations delegates to service', async () => {
    const response = { organizations: [] };
    const query = { page: 2, limit: 10 };
    serviceMock.listEducationOrganizations.mockResolvedValue(response);

    await expect(
      (
        controller.listEducationOrganizations as (
          userId: number,
          query: typeof query,
        ) => Promise<typeof response>
      )(7, query),
    ).resolves.toEqual(response);
    expect(serviceMock.listEducationOrganizations).toHaveBeenCalledWith(7, query);
  });

  it('createEducationOrganization delegates to service', async () => {
    const dto: AdminCreateEducationOrganizationDto = {
      name: 'Лицей 42',
    };
    const response = { id: 3 };

    serviceMock.createEducationOrganization.mockResolvedValue(response);

    await expect(controller.createEducationOrganization(7, dto)).resolves.toEqual(response);
    expect(serviceMock.createEducationOrganization).toHaveBeenCalledWith(7, dto);
  });

  it('updateEducationOrganization delegates to service', async () => {
    const dto: AdminUpdateEducationOrganizationDto = {
      groupValidationMode: 'HINT',
      groupValidationPattern: '^[A-Z]+$',
    };
    const response = { id: 3 };

    serviceMock.updateEducationOrganization.mockResolvedValue(response);

    await expect(controller.updateEducationOrganization(7, 3, dto)).resolves.toEqual(response);
    expect(serviceMock.updateEducationOrganization).toHaveBeenCalledWith(7, 3, dto);
  });
});
