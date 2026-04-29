const bcrypt = require('bcryptjs');

const BCRYPT_PREFIX_RE = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/;

function isBcryptHash(value) {
  return typeof value === 'string' && BCRYPT_PREFIX_RE.test(value);
}

async function verifyPassword(storedValue, inputPassword) {
  if (!storedValue || !inputPassword) return false;
  if (!isBcryptHash(storedValue)) return false;
  try {
    return await bcrypt.compare(inputPassword, storedValue);
  } catch (_) {
    return false;
  }
}

async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

/**
 * Transición segura:
 * - Si está hasheada, verifica normal.
 * - Si está en texto plano y coincide, migra a hash vía callback.
 */
async function verifyAndMigrateLegacyPassword({
  storedValue,
  inputPassword,
  migratePlaintextToHash
}) {
  if (!storedValue || !inputPassword) {
    return { ok: false, migrated: false, legacy: false };
  }

  if (isBcryptHash(storedValue)) {
    const ok = await verifyPassword(storedValue, inputPassword);
    return { ok, migrated: false, legacy: false };
  }

  const matchesPlaintext = String(storedValue) === String(inputPassword);
  if (!matchesPlaintext) {
    return { ok: false, migrated: false, legacy: true };
  }

  if (typeof migratePlaintextToHash === 'function') {
    const newHash = await hashPassword(inputPassword);
    await migratePlaintextToHash(newHash);
  }

  return { ok: true, migrated: true, legacy: true };
}

module.exports = {
  isBcryptHash,
  verifyPassword,
  hashPassword,
  verifyAndMigrateLegacyPassword
};

