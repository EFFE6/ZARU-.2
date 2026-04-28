const { authorizePermissions, authorizeModulePermissions } = require('../middlewares/auth');

jest.mock('../utils/tokenManager', () => ({
  verifyAccessToken: jest.fn()
}));

jest.mock('../utils/tokenStore', () => ({
  isAccessTokenRevoked: jest.fn().mockResolvedValue(false)
}));

jest.mock('../utils/rbac', () => ({
  hasPermission: jest.fn((permissions, required) => Array.isArray(permissions) && permissions.includes(required)),
  getUserPermissions: jest.fn().mockResolvedValue([])
}));

const { getUserPermissions } = require('../utils/rbac');

function mockRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis()
  };
}

describe('RBAC middlewares', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('authorizePermissions permite cuando usuario tiene permiso', async () => {
    const middleware = authorizePermissions('usuarios.read');
    const req = { user: { permissions: ['usuarios.read'] } };
    const res = mockRes();
    const next = jest.fn();

    await middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('authorizePermissions bloquea cuando faltan permisos', async () => {
    const middleware = authorizePermissions('usuarios.delete');
    const req = { user: { permissions: ['usuarios.read'] } };
    const res = mockRes();
    const next = jest.fn();

    await middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('authorizePermissions consulta DB/fallback cuando token no trae permisos', async () => {
    getUserPermissions.mockResolvedValueOnce(['reportes.read']);
    const middleware = authorizePermissions('reportes.read');
    const req = { user: { sub: '1', email: 'admin@sena.edu.co', rol: 'ADMIN' } };
    const res = mockRes();
    const next = jest.fn();

    await middleware(req, res, next);

    expect(getUserPermissions).toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('authorizeModulePermissions permite read_own para GET', async () => {
    const middleware = authorizeModulePermissions('beneficiarios');
    const req = {
      method: 'GET',
      user: { permissions: ['beneficiarios.read_own'] }
    };
    const res = mockRes();
    const next = jest.fn();

    await middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('authorizeModulePermissions bloquea write sin permisos', async () => {
    const middleware = authorizeModulePermissions('ordenes');
    const req = {
      method: 'POST',
      user: { permissions: ['ordenes.read'] }
    };
    const res = mockRes();
    const next = jest.fn();

    await middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });
});
