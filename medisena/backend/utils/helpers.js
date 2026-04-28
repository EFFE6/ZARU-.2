/**
 * Formatea una fecha para Oracle
 * @param {Date|string} date - Fecha a formatear
 */
function formatDateForOracle(date) {
  if (!date) return null;
  
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Convierte nombres de campos de camelCase a snake_case para Oracle
 * @param {Object} obj - Objeto con campos en camelCase
 */
function toSnakeCase(obj) {
  const result = {};
  
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      result[snakeKey] = obj[key];
    }
  }
  
  return result;
}

/**
 * Convierte nombres de campos de snake_case a camelCase para JavaScript
 * @param {Object} obj - Objeto con campos en snake_case
 */
function toCamelCase(obj) {
  const result = {};
  
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      result[camelKey] = obj[key];
    }
  }
  
  return result;
}

/**
 * Convierte un array de objetos de snake_case a camelCase
 * @param {Array} array - Array de objetos
 */
function toCamelCaseArray(array) {
  if (!Array.isArray(array)) return [];
  return array.map(item => toCamelCase(item));
}

/**
 * Genera un código único basado en prefijo y timestamp
 * @param {string} prefix - Prefijo del código
 */
function generateCode(prefix) {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}-${timestamp}-${random}`;
}

/**
 * Valida formato de email
 * @param {string} email - Email a validar
 */
function isValidEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * Sanitiza strings para prevenir SQL injection
 * @param {string} str - String a sanitizar
 */
function sanitizeString(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/['";\\]/g, '');
}

/**
 * Crea un objeto de respuesta estandarizado
 * @param {boolean} success - Indica si la operación fue exitosa
 * @param {string} message - Mensaje descriptivo
 * @param {*} data - Datos a retornar
 */
function createResponse(success, message, data = null) {
  return {
    success,
    message,
    data,
    timestamp: new Date().toISOString()
  };
}

/**
 * Maneja errores de forma consistente
 * @param {Error} error - Error capturado
 * @param {string} context - Contexto del error
 */
function handleError(error, context = '') {
  console.error(`Error en ${context}:`, error);
  
  return {
    success: false,
    error: error.message || 'Error desconocido',
    context,
    timestamp: new Date().toISOString()
  };
}

/**
 * Pagina resultados
 * @param {Array} data - Datos a paginar
 * @param {number} page - Página actual (base 0)
 * @param {number} limit - Límite de items por página
 */
function paginate(data, page = 0, limit = 10) {
  const start = page * limit;
  const end = start + limit;
  
  return {
    data: data.slice(start, end),
    pagination: {
      page,
      limit,
      total: data.length,
      totalPages: Math.ceil(data.length / limit),
      hasNext: end < data.length,
      hasPrev: page > 0
    }
  };
}

module.exports = {
  formatDateForOracle,
  toSnakeCase,
  toCamelCase,
  toCamelCaseArray,
  generateCode,
  isValidEmail,
  sanitizeString,
  createResponse,
  handleError,
  paginate
};

