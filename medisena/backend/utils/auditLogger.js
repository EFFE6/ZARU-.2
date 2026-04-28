const { getConnection, getTableName, OUT_FORMAT_OBJECT } = require('./db');

// Tipos de acciones para auditoría
const ACTION_TYPES = {
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  READ: 'READ',
  EXPORT: 'EXPORT',
  IMPORT: 'IMPORT',
  CREATE_RESOLUCION: 'CREATE_RESOLUCION',
  UPDATE_RESOLUCION: 'UPDATE_RESOLUCION',
  DELETE_RESOLUCION: 'DELETE_RESOLUCION'
};

/**
 * Registra un evento de auditoría
 * @param {Object} params - Parámetros del evento
 */
async function logAuditEvent({ userId, userEmail, action, resource, resourceId, details, ip }) {
  let conn;
  try {
    conn = await getConnection();
    
    const sql = `
      INSERT INTO ${getTableName('SMA_AUDIT_LOG')} 
      (USER_ID, USER_EMAIL, ACTION, RESOURCE, RESOURCE_ID, DETAILS, IP_ADDRESS, CREATED_AT)
      VALUES (:userId, :userEmail, :action, :resource, :resourceId, :details, :ip, SYSDATE)
    `;
    
    await conn.execute(sql, {
      userId: userId || null,
      userEmail: userEmail || null,
      action: action || 'UNKNOWN',
      resource: resource || null,
      resourceId: resourceId || null,
      details: details ? JSON.stringify(details) : null,
      ip: ip || null
    }, { autoCommit: true });
    
  } catch (error) {
    // No lanzar error para no interrumpir el flujo principal
    console.warn('⚠️ Error registrando evento de auditoría:', error.message);
  } finally {
    if (conn) {
      try { await conn.close(); } catch (e) { /* ignore */ }
    }
  }
}

/**
 * Registra un login
 */
async function logLogin({ userId, userEmail, ip, details }) {
  return logAuditEvent({
    userId,
    userEmail,
    action: ACTION_TYPES.LOGIN,
    resource: '/api/auth/login',
    resourceId: userId,
    details,
    ip
  });
}

/**
 * Registra un logout
 */
async function logLogout({ userId, userEmail, ip }) {
  return logAuditEvent({
    userId,
    userEmail,
    action: ACTION_TYPES.LOGOUT,
    resource: '/api/auth/logout',
    resourceId: userId,
    ip
  });
}

/**
 * Consulta eventos de auditoría
 */
async function queryAuditEvents({ page = 1, pageSize = 10, userId, action, startDate, endDate }) {
  let conn;
  try {
    conn = await getConnection();
    
    let whereConditions = [];
    let params = {};
    
    if (userId) {
      whereConditions.push('USER_ID = :userId');
      params.userId = userId;
    }
    if (action) {
      whereConditions.push('ACTION = :action');
      params.action = action;
    }
    if (startDate) {
      whereConditions.push('CREATED_AT >= TO_DATE(:startDate, \'YYYY-MM-DD\')');
      params.startDate = startDate;
    }
    if (endDate) {
      whereConditions.push('CREATED_AT <= TO_DATE(:endDate, \'YYYY-MM-DD\') + 1');
      params.endDate = endDate;
    }
    
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    params.maxRow = offset + parseInt(pageSize);
    params.minRow = offset;
    
    const sql = `
      SELECT * FROM (
        SELECT a.*, ROWNUM rnum FROM (
          SELECT * FROM ${getTableName('SMA_AUDIT_LOG')}
          ${whereClause}
          ORDER BY CREATED_AT DESC
        ) a WHERE ROWNUM <= :maxRow
      ) WHERE rnum > :minRow
    `;
    
    const result = await conn.execute(sql, params, { outFormat: OUT_FORMAT_OBJECT });
    
    // Obtener total
    const countSql = `SELECT COUNT(*) AS TOTAL FROM ${getTableName('SMA_AUDIT_LOG')} ${whereClause}`;
    const countParams = { ...params };
    delete countParams.maxRow;
    delete countParams.minRow;
    const countResult = await conn.execute(countSql, countParams, { outFormat: OUT_FORMAT_OBJECT });
    const total = countResult.rows[0]?.TOTAL || 0;
    
    return {
      data: result.rows || [],
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total,
        totalPages: Math.ceil(total / parseInt(pageSize))
      }
    };
  } catch (error) {
    console.warn('⚠️ Error consultando eventos de auditoría:', error.message);
    return {
      data: [],
      pagination: { page: 1, pageSize: 10, total: 0, totalPages: 0 }
    };
  } finally {
    if (conn) {
      try { await conn.close(); } catch (e) { /* ignore */ }
    }
  }
}

module.exports = {
  ACTION_TYPES,
  logAuditEvent,
  logLogin,
  logLogout,
  queryAuditEvents
};

