# Tipos Oracle en la migración SPU → PostgreSQL

## ¿Qué es un LOB?

**LOB** = **L**arge **OB**ject. En Oracle son tipos para datos grandes:

| Tipo  | Uso              | En PostgreSQL |
|-------|------------------|----------------|
| **CLOB** | Texto largo       | TEXT (como string) |
| **NCLOB**| Texto en otro juego de caracteres | TEXT |
| **BLOB** | Binario (archivos, imágenes) | BYTEA |

Por defecto, al hacer `SELECT` de una columna LOB, el driver devuelve un **objeto Lob** (manejador/stream) que hay que leer de forma asíncrona. Para evitar eso, el script usa:

- `fetchAsString: [ oracledb.CLOB, oracledb.NCLOB ]` → el driver devuelve **string** directamente.
- `fetchAsBuffer: [ oracledb.BLOB ]` → el driver devuelve **Buffer** directamente.

Así la mayoría de LOBs llegan ya como string o buffer y se insertan bien en PG. Si en algún caso el driver devolviera un **Lob** (p. ej. LOB muy grande), no se puede llamar `getData()` durante el streaming del mismo result set (error NJS-023), por eso ese valor se guarda como `null` para no bloquear la migración.

---

## Objetos Oracle (NVPair, XMLType, etc.)

### NVPair

Estructura nombre–valor que a veces devuelve Oracle o el driver en tipos complejos. Al serializar a JSON tiene referencias circulares, por eso el script no lo pasa a PG y se usa `null` en esa celda.

**Posible mejora:** Si en Oracle la columna admite `TO_CHAR()` o una función que devuelva texto, se puede cambiar el `SELECT` para esa columna a algo como `TO_CHAR(columna)` y guardar el resultado en TEXT en PostgreSQL. Depende del tipo exacto de la columna en Oracle.

### XMLType

Tipo nativo de Oracle para XML. En node-oracledb puede llegar como string o como objeto.

**Mejora aplicada en el script:** Para columnas con `DATA_TYPE = 'XMLTYPE'`, el `SELECT` usa **`XMLTYPE.GETCLOBVAL(nombre_columna)`** para convertir el XML a CLOB; con `fetchAsString` para CLOB el valor llega como string y se guarda en una columna **TEXT** en PostgreSQL. Así se puede guardar y leer el XML después.

### Otros tipos objeto

Tipos OBJECT, colecciones anidadas, etc., no tienen una conversión estándar a texto/binario. Opciones:

1. **En Oracle:** Usar en el `SELECT` funciones que devuelvan string (p. ej. `TO_CHAR`, `XMLTYPE.GETCLOBVAL`, o funciones personalizadas del esquema) y mapear esa columna a TEXT en PG.
2. **En el script:** Detectar por `DATA_TYPE` y armar el `SELECT` con la expresión SQL adecuada para cada tipo (como con XMLType).

---

## Resumen

| Origen (Oracle) | Cómo se trata ahora        | Guardado en PG |
|-----------------|----------------------------|----------------|
| CLOB/NCLOB      | fetchAsString              | TEXT (string)  |
| BLOB            | fetchAsBuffer              | BYTEA (binario)|
| XMLType         | GETCLOBVAL en el SELECT    | TEXT (XML)     |
| Lob (objeto)    | No se puede leer en streaming | null       |
| NVPair/objeto   | Sin conversión             | null           |

Para poder **guardar y leer** después en PostgreSQL: CLOB, NCLOB, BLOB y XMLType (vía GETCLOBVAL) ya se migran con contenido; el resto de objetos solo se pueden mejorar si en Oracle se expone una forma de convertirlos a string/binario en el propio SQL.

---

## Migración campo a campo (columnas sensibles)

Para tablas que tienen columnas **sensibles** (CLOB, NCLOB, BLOB, BFILE, XMLTYPE, LONG), el script aplica:

1. **Export por lotes** desde Oracle (sin result set) para poder llamar `getData()` en objetos Lob cuando haga falta.
2. **Resolución de LOBs** fila a fila, campo a campo: cada celda en su propio try/catch; si una falla se guarda `null` y se sigue con el resto.
3. **Inserción fila a fila** en PostgreSQL: cada fila se construye con valores obtenidos **campo a campo** (cada columna con try/catch y límite de tamaño). Si el INSERT de una fila falla, se reintenta esa fila poniendo en `null` solo las columnas sensibles, para no perder el resto de la fila.

Así un LOB o XMLType problemático (por tamaño o serialización) no tumba la fila ni la tabla; como máximo esa celda queda en `null`.

---

## Errores frecuentes y ajustes

### "Invalid string length" (p. ej. en T_ANEXO)

Ocurre cuando un valor (sobre todo LOB/BLOB) es tan grande que Node no puede manejarlo en memoria o al enviarlo a PostgreSQL. El script ahora:

- **Nunca** llama `getData()` sin límite: siempre usa `getData(1, amount)` con `amount` ≤ `MAX_INSERT_VALUE_LENGTH` (por defecto 2 MB).
- Aplica **`capSizeForInsert`** a todos los valores antes de insertar (límite 2 MB por valor).
- Si al construir los valores de la fila se lanza "Invalid string length", se reintenta la fila con las columnas sensibles en `null`.

Variables útiles: `MAX_INSERT_VALUE_LENGTH` (default 2097152), `MAX_LOB_LENGTH` (solo lectura desde Oracle).

### "write ENOBUFS" (p. ej. en T_DOCBENEFICIARIOS)

El buffer del socket se llena al enviar muchos datos seguidos a PostgreSQL. El script ahora:

- Hace **throttle**: cada `ROW_THROTTLE_EVERY` filas (default 50) hace una pausa de `ROW_THROTTLE_MS` ms (default 20).
- Ante error **ENOBUFS** reintenta la misma fila hasta 2 veces con pausa creciente.

Variables: `ROW_THROTTLE_EVERY`, `ROW_THROTTLE_MS`. Si sigue fallando, subir la pausa (p. ej. `ROW_THROTTLE_MS=100`) o bajar `MAX_INSERT_VALUE_LENGTH`.

---

## Migrar el 100% (sin truncar LOBs grandes)

Para no perder contenido en LOBs mayores a `MAX_INSERT_VALUE_LENGTH` (p. ej. 2 MB), el script hace **stream a archivo**:

- Si el LOB es **mayor** que ese umbral: se escribe **íntegro** en un archivo bajo `backups/lobs/spu/<tabla>/<rowid>_<columna>.bin` y en la tabla se guarda la **ruta relativa** en la columna **`<columna>_path`** (TEXT). La columna del LOB queda en NULL.
- Si el LOB es **menor o igual**: se guarda en la columna normal (BYTEA/TEXT) y `_path` queda NULL.

En la aplicación: si `<col>_path` tiene valor, leer el archivo desde esa ruta (p. ej. `BACKUP_DIR + contenido_path`); si no, usar la columna `<col>`. Detalle en `ESTRATEGIA-MIGRACION-100-PORCIENTO.md`.
