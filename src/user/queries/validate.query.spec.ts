import { ValidateDto } from '../dto/validate.dto';
import { ValidateUserHandler } from './validate.query';

describe('ValidateUser QueryHandler', () => {
  let handler: ValidateUserHandler;

  const jwtService = {
    sign: jest.fn(),
    verifyAsync: jest.fn(),
  };

  beforeAll(async () => {
    handler = new ValidateUserHandler(jwtService as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  it('when given a valid token > should return the decoded token', async () => {
    const token = 'valid_token';
    const decodedToken = { id: 1, username: 'testuser' };
    jwtService.verifyAsync.mockResolvedValueOnce(decodedToken);
    const result = await handler.execute(new ValidateDto(token));

    expect(result).toEqual(true);
    expect(jwtService.verifyAsync).toHaveBeenCalledWith(token, {});
  });
  it('when given an invalid token > should reject with an error', async () => {
    const token = 'invalid_token';
    const error = new Error('Invalid token');
    jwtService.verifyAsync.mockRejectedValueOnce(error);

    await expect(handler.execute(new ValidateDto(token))).rejects.toThrow(error);
    expect(jwtService.verifyAsync).toHaveBeenCalledWith(token, {});
  });
});
