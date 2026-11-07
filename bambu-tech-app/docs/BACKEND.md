# Backend local — entrega del prompt 2

Fecha: 6 de noviembre de 2026. Implementación bajo `CONTRATO_BACKEND.md` de la raíz. La entrega inicial fue local; las secciones siguientes registran la configuración y verificación real posteriores expresamente autorizadas. No hay publicación ni despliegue. El catálogo conserva el prototipo; el panel se integra en el prompt 3, descrito en `PANEL.md`. `/admin` está protegido por `proxy.ts`: sin configuración devuelve 503 y sin membresía 403, como JSON; sin sesión redirige con 303 a `/admin/login`. Solo `/admin/login` y `/admin/recovery` son páginas públicas exactas. Las API administrativas siguen devolviendo 401 sin sesión y no cambian su autorización de servidor/RLS.

### Inspección posterior del entorno real autorizado

Tras autorización del usuario para configurar su proyecto de prueba, se comprobó `.env.local` sin mostrar valores de claves: archivo legible, URL HTTPS válida, claves publicable/privilegiada presentes y con formato esperado, origen definido. La conexión real Auth Admin responde. `.env.local` está ignorado por Git.

Resultado de la inspección de solo lectura: `products` y `settings` todavía no existen (`PGRST205`, productos HTTP404); no existe el bucket `bambu-products` (`NoSuchBucket`); Auth tiene cero usuarios, por lo que la cuenta administrativa indicada aún no existe. No se ejecutó SQL remoto, no se creó ni invitó usuario y no se enviaron correos.

Las claves de aplicación no permiten ejecutar DDL SQL. Falta aplicar la migración mediante SQL Editor del proyecto autorizado, o proporcionar una vía administrativa SQL por un canal seguro. No usar RPC inventadas para ejecutar SQL. Se preparó `docs/SQL_EDITOR_SETUP.local.sql`, artefacto local ignorado por Git que reúne la migración revisada y el WhatsApp aprobado. Al final registra en la allowlist solo una cuenta Auth ya existente; si falta, emite aviso y deja la lista vacía. No crea usuarios ni contraseñas. Revisar el proyecto destino antes de ejecutar y no repetir el bloque de esquema una vez inicializado.

Puede repetirse la inspección con `node scripts/inspect-supabase.mjs`: solo emite booleanos, host público y códigos/estados saneados, nunca claves, cabeceras, objetos de cliente ni mensajes de error crudos. Las afirmaciones previas de esta guía que indican entorno todavía no configurado describen la entrega local inicial; las pruebas integradas reales continúan pendientes hasta aplicar SQL y aprovisionar la cuenta.

### Verificación real después de aplicar la migración

El usuario ejecutó `supabase/migrations/202611060001_backend.sql` en SQL Editor y comunicó éxito. La inspección POSTERIOR confirmó: productos públicos HTTP200 con lista vacía, ajustes públicos HTTP200 con fila id1, bucket existente y privado, máximo 4,194,304 bytes y MIME exclusivamente WebP. Auth Admin responde y todavía tiene cero usuarios. No se repitió la migración ni el artefacto completo de setup.

Se comprobaron seis denegaciones reales anónimas de escritura/operaciones administrativas: UPDATE de ajustes/productos sobre claves imposibles (sin filas modificables), métricas, RPC de ajustes, cambio de estados de UUID inexistente y registro de asset ficticio. Todas devolvieron HTTP401/código42501. `image_path` de UUID inexistente devolvió null/200; incremento de vistas de ese UUID devolvió204 sin cambiar inventario; listado Storage no mostró entradas. Son pruebas de privilegios reales con inventario vacío, no sustituyen pruebas de activos/ocultos/imágenes reales con sesión administrativa.

La clave service_role recibe403/42501 al leer tablas directamente y al intentar el único UPDATE autorizado de WhatsApp. BYPASSRLS no concede privilegios SQL; esto no se remedia ampliando grants por comodidad. El flujo de app usa sesiones de usuario y RPC protegidas para datos, y el cliente privilegiado se limita a Storage y registro de assets. El inspector ahora lee ajustes con la clave pública, conforme al contrato.

Queda listo `docs/SQL_EDITOR_FINALIZE.local.sql` (ignorado por Git, sin claves), con SOLO WhatsApp aprobado y allowlist. Debe ejecutarse después de crear manualmente la cuenta Auth indicada, sin invitación/correo. Si esa cuenta no existe o la fila de ajustes falta, la transacción aborta sin aplicar cambios. No crea usuarios, no cambia contraseñas, no amplía permisos y no repite esquema. El antiguo `SQL_EDITOR_SETUP.local.sql` es un artefacto previo a la migración y NO debe repetirse en el proyecto inicializado. Antes de usar futuras migraciones CLI, el operador debe conciliar la migración aplicada manualmente con el historial de su entorno.

Los checks se pueden repetir con `node scripts/verify-supabase-access.mjs`; el flag `--apply-approved-whatsapp` intenta únicamente guardar el número aprobado en el proyecto fijado y no cambia permisos si se deniega. No se crearon archivos remotos, productos, usuarios ni correos en esta verificación. Persistencia, sesiones administrativas, cargas y CRUD completos quedan pendientes hasta disponer de la cuenta autorizada.

### Cuenta autorizada y 30 pruebas reales de backend

El usuario creó manualmente la cuenta Auth y ejecutó exclusivamente `SQL_EDITOR_FINALIZE.local.sql`, con ambos resultados true. La inspección posterior confirmó cuenta existente y correo confirmado, WhatsApp coincidente, bucket privado 4 MiB/WebP y denegaciones anónimas vigentes. La membresía administrativa se verificó después mediante una sesión real y la operación `admin_session`, además del resultado SQL indicado por el usuario.

Con autorización explícita, el usuario proporcionó su contraseña temporal solo mediante la entrada ignorada `TEST_ADMIN_PASSWORD` en `.env.local`. Se reconstruyó la app actual con Webpack y se inició un servidor propio en 127.0.0.1:3107, fijando `APP_ORIGIN=https://bambu.test` únicamente en ese proceso. El dominio ficticio no se usó para correos ni se creó recurso alguno. El servidor del usuario en3000 no se detuvo ni reconfiguró.

`tests/backend/supabase-live.mjs --run-approved` completó **30 comprobaciones reales** contra la API de la app y Supabase:

- Denegación administrativa anónima, WhatsApp persistido y escritura administrativa del mismo valor aprobado.
- Dos inicios de sesión independientes por contraseña, allowlist efectiva, acceso protegido y lectura de métricas.
- Rechazo de archivo mayor de 4 MiB; carga real de PNG pequeño, validación/reexportación WebP, registro y entrega de bytes reales con no-store. Descarga y firma directas de Storage denegadas al público incluso mientras el producto está activo.
- Crear producto inicialmente oculto y editarlo, con persistencia observada entre ambas sesiones; imagen y producto ocultos denegados al público.
- Publicar disponible aumenta la métrica de disponibles; activo agotado permanece visible y pasa a agotados sin sumar disponibles.
- Veinte incrementos concurrentes reales por API conservados íntegros, métricas de vistas correctas y ausencia de incremento cuando está oculto.
- Eliminación lógica excluye el producto de lista administrativa y métricas; archivo retenido. Inventario preexistente conservado.
- Cierre de sesión local quita acceso del primer cliente y conserva la otra sesión; al finalizar se cierra también la segunda. Cookies y sesiones solo existieron en memoria, sin archivos ni logs.

El único producto creado se identifica como `PRUEBA BACKEND` con UUID `6640ee28-9b8d-45d9-8c4f-b8fce7b12aa0`: quedó eliminado lógicamente y su imagen se retuvo según la política, sin borrado físico. El servidor propio3107 se detuvo. Se retiró exclusivamente la entrada `TEST_ADMIN_PASSWORD` de `.env.local`, preservando el resto del archivo; su ausencia se comprobó como booleano sin imprimir claves. Build Webpack actual y comprobación de tipos pasaron por separado. No repetir el runner ni generar más datos sin necesidad y autorización; sin `--run-approved` no lee el archivo de entorno ni inicia sesión.

Límites: no se forzó expiración/renovación de tokens, no se creó una identidad autenticada sin rol para probar ese caso real y no se probó el cambio real de contraseña. Las pruebas SQL aisladas cubren el usuario autenticado sin rol, pero no sustituyen ese caso con Auth real. Estas comprobaciones son de backend; las interfaces no están conectadas y no hubo prueba móvil/escritorio del producto final.

### Recuperación por correo y registro: configuración inicial (histórico)

El usuario autorizó un único correo de recuperación de prueba y ningún cambio de contraseña. **Aún no se ha enviado**. La inspección pública `/auth/v1/settings` respondió200 y detectó `disable_signup=false`: el proveedor mantiene habilitadas las altas públicas, aunque la app no tenga formulario de registro. Antes de exponer el proyecto, desactivar altas desde Auth del dashboard y volver a comprobar esa bandera; no se crearon usuarios nuevos para probarlo.

El `APP_ORIGIN` permanente sigue siendo `http://localhost:3000`; se verificó por GET que el servidor existente responde ajustes200 y callback sin código400. El endpoint público de configuración no revela Site URL ni allowlist de redirecciones y no hay acceso Management en las claves de app. Antes del único envío, el usuario debe confirmar en URL Configuration Site URL `http://localhost:3000` y redirect permitido exacto `http://localhost:3000/api/auth/callback`. No enviar desde el servidor de prueba con origen ficticio. La respuesta genérica del endpoint de recuperación no demuestra aceptación del proveedor ni recepción; ambas evidencias deben distinguirse. PKCE requiere conservar en el navegador iniciador la cookie del verificador. La interfaz final de recuperación sigue pendiente del prompt 3.

Lecturas reproducibles sin correo: `node scripts/inspect-auth-configuration.mjs`. No cambia configuración ni envía mensajes. Referencias: [configuración Auth](https://supabase.com/docs/guides/auth/general-configuration) y [URLs de retorno](https://supabase.com/docs/guides/auth/redirect-urls).

### Reestructuración y preparación del único correo

La app ahora reside en `bambu-tech-app/` bajo la raíz del espacio; la carpeta de extracción anterior fue eliminada por el usuario y no se recreó. Se encontraron rutas API, módulos backend, migración, scripts y pruebas en la nueva ubicación, sin referencias antiguas en esos módulos. Las dependencias apuntan al node_modules de la nueva app. `.env.local` existe y está efectivamente ignorado por Git desde esa ubicación; no contiene ya la contraseña temporal de las pruebas anteriores.

Desde la nueva app se repitieron las 12 pruebas de entradas/imágenes y la comprobación de tipos: aprobadas. La compilación Webpack desde esta ruta también pasó. No se repitieron las pruebas remotas que crean inventario. La reorganización de archivos aún aparece en Git como eliminaciones de la ubicación anterior y nueva app sin seguimiento; no se hizo stage, commit, restauración ni movimiento adicional.

El usuario confirmó haber configurado Auth. La lectura real posterior verifica `disable_signup=true`, correo habilitado, cuenta confirmada, WhatsApp coincidente y bucket privado con 4 MiB/WebP. Site URL y allowlist de retornos no son legibles con las claves de aplicación: su configuración corresponde a la confirmación del usuario. Puerto3000 no respondía inicialmente y se comprobó libre; se inició un servidor de desarrollo de la nueva app en `http://localhost:3000`, sin detener procesos ajenos ni modificar APP_ORIGIN permanente. Settings responde200 y callback sin código400. Los parámetros sensibles del callback se filtran en la salida del servidor de prueba. Next dev generó `AGENTS.md` y `CLAUDE.md` dentro de la app; se conservaron.

Se preparó únicamente para esta comprobación `public/recovery-check.local.html`, ignorado por Git y sin claves, contraseña ni acceso privilegiado. URL local: `http://localhost:3000/recovery-check.local.html`. La página no envía automáticamente: el usuario pulsa una vez para iniciar la petición real al endpoint de recuperación del mismo origen. El botón se desactiva y sessionStorage registra el intento para evitar reenvíos casuales. El estado es deliberadamente honesto: respuesta genérica no confirma aceptación del proveedor ni recepción; el usuario debe confirmar si llega el mensaje.

Esta estrategia conserva el verificador PKCE HttpOnly en el navegador iniciador, a diferencia de un envío SDK desde Node. Para comprobar el retorno, abrir el enlace del correo en ese mismo navegador y volver a la pestaña original de prueba para pulsar «Comprobar sesión después del enlace». La página guarda y muestra solo autorización Sí/No antes y después: si ya había sesión previa, lo señala y no atribuye ese acceso a la recuperación. No muestra tokens, cookies, identificadores ni correos de la sesión. No cambia contraseña ni crea cuentas.

Hasta la entrega de esta preparación **no se ha enviado ningún correo**. El único envío autorizado lo iniciará el usuario mediante ese botón tras la revisión del coordinador. No usar el servidor ficticio3107, no generar magic links administrativos ni repetir la solicitud ante una respuesta ambigua. Después de documentar recepción/callback se retirará el archivo temporal y su entrada específica de ignore; no forman parte de la interfaz del MVP. La renovación forzada de sesión y la interfaz final siguen pendientes.

### Recuperación confirmada y limpieza de la prueba

El usuario informó que recibió el correo y completó el enlace en el mismo navegador. La página temporal mostró autorización **No antes de solicitar y Sí después del callback**, según su reporte. Los registros saneados del servidor corroboran callback final303, entrada `/admin?recovery=1`200 y comprobación de sesión200. No se inspeccionó el contenido del correo, los tokens ni el navegador del usuario mediante herramientas.

Los mismos registros muestran dos solicitudes POST de recuperación200 y callbacks anteriores400 antes del éxito final. Como la respuesta del endpoint es genérica, esos estados no prueban cuántos mensajes aceptó el proveedor o recibió el usuario; no se afirma que hubo exactamente un correo. El agente no inició solicitudes adicionales. No se cambió contraseña ni se forzó renovación/expiración de tokens.

Al finalizar se retiraron únicamente `public/recovery-check.local.html` y su regla específica de ignore. Se detuvo el servidor propio del puerto3000 después de comprobar que seguía siendo el proceso de prueba; no se cerró la sesión personal del usuario ni se modificó su contraseña. `.env.local` y los SQL locales privados se conservaron ignorados. Se añadió `*.tsbuildinfo` al ignore para excluir cachés de TypeScript de la reorganización. Los archivos `AGENTS.md` y `CLAUDE.md` generados por Next permanecen.

## Archivos y responsabilidades

- `lib/backend/contract.ts`: tipos y utilidades compartidos seguros para navegador. El antiguo `lib/products.ts` sigue siendo exclusivamente el prototipo; no es el nuevo contrato.
- `validation.ts`: validación compartible con interfaz, repetida en servidor y, donde corresponde, en SQL.
- `config.ts`, `supabase.ts`, `data.ts`, `http.ts`, `router.ts`: solo servidor. No importar desde componentes cliente. `sessionClient()` está preparado para handlers con cookies mutables; adaptar `setAll` si se necesita usar desde Server Components, coordinando con el proxy.
- `images.ts`: decodificación y reexportación mediante sharp; servidor Node, nunca navegador.
- `app/api/[...backend]/route.ts`: rutas explícitamente enumeradas en el router, sin proxy genérico a Supabase.
- `supabase/migrations/202611060001_backend.sql`: esquema, restricciones, RLS, RPC y definición de bucket privado. Migración versionada para aplicar una vez con el mecanismo de migraciones; no es un script idempotente de repetición manual.
- `tests/backend/`: pruebas de entradas e imágenes, SQL/RLS/concurrencia y comprobación HTTP sin configuración.

Un responsable debe mantener contrato, migraciones, dependencias y configuración. Panel y catálogo pueden trabajar después en sus archivos propios, sin cambiar por separado tipos o rutas compartidas.

## Configuración pendiente, sin secretos

Copiar `.env.example` a `.env.local` cuando se autorice configurar el entorno. Variables requeridas:

| Variable | Uso |
| --- | --- |
| `APP_ORIGIN` | Origen exacto, sin barra final. HTTPS en producción; HTTP localhost/127.0.0.1 permitido en desarrollo. Se usa para CSRF y retorno PKCE. |
| `SUPABASE_URL` | URL del proyecto elegido; HTTPS, salvo Supabase local en desarrollo. |
| `SUPABASE_PUBLISHABLE_KEY` | Clave publicable o JWT anon heredado. La configuración rechaza una clave con rol privilegiado. No lleva prefijo NEXT_PUBLIC porque esta entrega usa API del mismo origen. |
| `SUPABASE_SERVICE_ROLE_KEY` | Solo servidor: carga validada, registro de assets y descarga de una imagen previamente autorizada. Nunca usar en cliente, logs, respuestas o repositorio. |

No hay valores reales guardados. No basta poner variables: falta aplicar y verificar migración en un entorno Supabase autorizado. Si luego se habilita Supabase local, requerirá CLI/Docker instalados y autorización para preparar ese entorno. Esta tarea no los instaló.

Pasos posteriores a la autorización del entorno:

1. Revisar migración contra el esquema y políticas del proyecto destino. No ejecutarla sobre una base ajena o con inventario sin revisión.
2. Aplicar con migraciones Supabase por el operador autorizado. El bucket `bambu-products` debe ser privado; no activar acceso público ni cambiar guardas para resolver errores de integración.
3. Desactivar altas públicas en Auth. Crear/provisionar administradores fuera de la app y registrar exclusivamente sus UUID existentes en `private.admin_users` mediante operador de base autorizado. No hay endpoint ni grant que permita autoasignación. Todos los miembros tienen gestión completa del inventario; no existen roles parciales.
4. Configurar Site URL, redirect permitido exacto `APP_ORIGIN/api/auth/callback`, proveedor de correo/SMTP y límites de Auth. La recuperación usa PKCE: debe completarse en el navegador que inició el proceso. La respuesta de solicitud de recuperación es deliberadamente genérica incluso ante error del proveedor; verificar entrega real y observabilidad operativa antes de publicar.
5. Establecer variables de servidor y comprobar flujos reales de esta guía. Elegir WhatsApp real desde ajustes; `null` inicial significa contacto deshabilitado. No usar automáticamente el número del prototipo.

## Contrato de productos

`ProductInput` tiene exactamente estos campos editables, todos presentes:

```ts
{
  title: string,          // 1..200 caracteres, sin espacios extremos
  category: "Celulares" | "Bocinas" | "Smartbands" | "Smartwatches" | "Otros",
  brand: string,          // 1..80, editable
  price: number,          // MXN: >0, hasta 99,999,999.99 y dos decimales
  condition: "Nuevo" | "Reacondicionado",
  description: string,    // puede estar vacía, hasta 10,000 caracteres
  specs: {},             // claves válidas por categoría, ver abajo
  main_image: string,     // ruta validada retornada por upload, no URL
  gallery_images: string[], // 0..3 rutas, sin duplicados ni repetir portada
  is_active: boolean,
  is_sold: boolean
}
```

El DTO de lectura `ProductRecord` añade `id`, `views_count`, `created_at`. `deleted_at` es interno y no se devuelve en la API de la app. Las referencias de imágenes son rutas `productUUID/assetUUID.webp`; usar `imageUrl(path)` para convertirlas a la URL de entrega. No pasar la URL de entrega al guardar. No aceptar `id`, `views_count`, fechas, permisos u otros campos en `ProductInput`.

La app reserva un UUID mediante `crypto.randomUUID()` antes de cargar las fotos. Todas las imágenes de un producto deben pertenecer a ese UUID y estar registradas por el backend. No se admiten URLs externas, `blob:` ni rutas de otro producto. Los datos de muestra del prototipo se conservan como desarrollo; no hay importación automática.

Claves de especificaciones, siempre opcionales; omitir lo desconocido en vez de usar null/0/«Por definir»:

| Categoría | Texto | Números positivos | Booleano |
| --- | --- | --- | --- |
| Celulares | color, processor | ram_gb, storage_gb, battery_mah | unlocked |
| Bocinas | color, connectivity, water_resistance | power_w, battery_hours | — |
| Smartbands | color, screen, connectivity, water_resistance | battery_days | — |
| Smartwatches | color, screen, connectivity, compatibility, water_resistance | battery_days | — |
| Otros | color, features | — | — |

Texto no vacío, hasta 200 caracteres salvo `features` hasta 1,000. Números hasta 1,000,000 y dos decimales. No convertir unidades en silencio: RAM/almacenamiento GB, batería mAh, potencia W, duración horas/días según clave. No hay campos mínimos ficticios por categoría. Al cambiar categoría deben retirarse claves que no correspondan.

Precio DB `numeric(10,2)`. El validador JS contempla tolerancia de representación flotante; PostgreSQL exige precisión decimal exacta antes del cast. Redondear explícitamente en la interfaz para el importe elegido; el backend puede rechazar números aritméticos como `0.1 + 0.2` si llegan con más decimales. No ocultar este error. `formatMxn` mantiene dos decimales; `CATALOG_PRICE_RANGES` usa límites `[min,max)`. Derivar marcas del listado público activo, no del listado administrativo.

## HTTP para las interfaces

Todas las respuestas JSON son `{data: ...}` o `{error:{code,message}}`. Errores: `VALIDATION` 400, `UNAUTHORIZED` 401, `FORBIDDEN` 403, `NOT_FOUND` 404, `CONFLICT` 409, `UNAVAILABLE` 503, `INTERNAL` 500. No mostrar información interna de Supabase. Todas las respuestas de datos y autenticación usan `private, no-store`.

Las mutaciones exigen cabecera `Origin` igual a `APP_ORIGIN`, rechazan `Sec-Fetch-Site: cross-site` y usan cookies HttpOnly/SameSite=Lax/Secure en producción. El navegador añade Origin en peticiones POST/PUT/PATCH/DELETE; clientes de prueba deben indicarlo. JSON requiere `Content-Type: application/json` y límite 64 KiB. No hay CORS para escrituras de terceros ni endpoints de registro. Las API administrativas comprueban sesión y allowlist en cada operación; el proxy no reemplaza esa comprobación.

| Método y ruta | Entrada / salida |
| --- | --- |
| GET `/api/catalog/products` | `ProductRecord[]`, solo activos no eliminados, incluye agotados. |
| GET `/api/catalog/products/:id` | `ProductRecord` activo o 404. No incrementa vistas por sí solo. |
| GET `/api/catalog/settings` | `{whatsapp_number: string\|null}`. |
| POST `/api/catalog/products/:id/views` | Sin cuerpo. Incremento uno; `{accepted:true}` también para UUID inexistente/oculto, sin revelar existencia. Ejecutar una vez por apertura, sin reintento automático si el resultado es ambiguo. Fallo no bloquea detalle. |
| GET `/api/catalog/images/:assetId` | Bytes WebP si activo/referenciado o si administrador; 404 si no autorizado/existente, 503 sin configuración. |
| GET `/api/admin/session` | `{id,email}` de administrador autenticado. |
| GET `/api/admin/products` | `ProductRecord[]`, activos/ocultos/agotados, excluye eliminados. |
| POST `/api/admin/products/:id` | `ProductInput` completo. Crear con UUID reservado para las cargas. Devuelve DTO, 201. |
| PUT `/api/admin/products/:id` | `ProductInput` completo, reemplaza campos editables. Conserva vistas, id, fecha. |
| PATCH `/api/admin/products/:id/states` | `{is_active:boolean,is_sold:boolean}`. Devuelve DTO. |
| DELETE `/api/admin/products/:id` | `{confirm:true}`. Eliminación lógica; `{deleted:true}`. UI debe pedir confirmación. |
| GET `/api/admin/metrics` | `{total,available,sold,views}` sobre no eliminados: disponibles activos no agotados; sold incluye ocultos agotados. |
| PUT `/api/admin/settings` | `{whatsapp_number:string\|null}`. Acepta internacional con + y normaliza espacios/paréntesis/guiones. Guarda + y 8..15 dígitos, primer dígito distinto de cero. |
| POST `/api/admin/uploads/:productId` | Un archivo binario crudo, no multipart; `Content-Type` exacto image/jpeg, image/png o image/webp. Devuelve `{id,path,url}`, 201. |
| POST `/api/auth/login` | `{email,password}`, establece cookies; `{authenticated:true}` solo si admin. |
| POST `/api/auth/logout` | Sin cuerpo, cierra sesión del navegador actual; `{authenticated:false}`. |
| POST `/api/auth/recovery` | `{email}`, respuesta genérica; requiere configurar correo y retorno. |
| GET `/api/auth/callback?code=...` | Intercambia código PKCE, verifica admin, redirige a `/admin?recovery=1`. No acepta destino arbitrario. |
| POST `/api/auth/password` | `{password}` entre 12 y 128 caracteres, exige sesión admin. `{updated:true}`. UI pendiente. |

Los listados recuperan páginas internas de 200 filas con orden created_at/id; configurar el máximo de filas de Supabase en al menos 200. La consulta no es un snapshot de varias solicitudes: modificaciones concurrentes pueden exigir recargar. La búsqueda/categorías/marca/precio pueden operar en cliente con los DTO; la UI debe diferenciar fallo de carga, lista vacía y sin resultados.

`whatsAppUrl(settings, product)` devuelve null sin configuración válida. Incluye nombre y precio MXN codificados y permite consultas sobre agotados. La UI abre en nueva pestaña con `rel="noopener noreferrer"`.

## Seguridad de datos y archivos

- `private.admin_users` no se expone a PostgREST ni tiene grants de edición para anon/authenticated. No autorizar por email mutable ni metadatos editables.
- Products/settings solo conceden SELECT a anon/authenticated; no conceden escritura directa ni siquiera al administrador. Las RPC de mutación verifican membresía; contador admite únicamente UUID y suma atómica. Las funciones privilegiadas fijan search_path vacío y revocan EXECUTE de PUBLIC antes de conceder roles concretos.
- Un activo agotado permanece público. Ocultar, agotar y eliminar lógicamente son estados distintos. Eliminados no se incluyen en métricas/listados ordinarios y no tienen restauración/purga en esta entrega.
- No se exponen claves privilegiadas en navegador. El cliente privilegiado se usa exclusivamente después de autorización administrativa para cargar/registrar, o después de autorizar un asset exacto para descargar; nunca acepta una ruta arbitraria del solicitante.
- El bucket es privado. Anon/no-admin no pueden leerlo directamente, generar firmas mediante SELECT ni escribirlo. Un admin puede leer assets validados para gestionar inventario; todos sus miembros tienen acceso completo. Guardas restrictivas limitan políticas permisivas amplias preexistentes para este bucket. No desplegar un bucket público.
- La ruta de imagen resuelve el asset con identidad del solicitante y referencia activa, luego descarga desde servidor sin URL firmada pública. Devuelve `no-store` y `nosniff`. No se puede revocar una copia ya entregada al usuario; una solicitud ya autorizada y en curso puede terminar aunque se oculte simultáneamente. No usar optimización/caché CDN de estas rutas al integrar si impide comprobar permisos en cada nueva solicitud.
- Upload limita tanto la entrada como la salida WebP a 4 MiB (4,194,304 bytes) y la imagen a 25 megapíxeles; verifica formato/decodificación, rechaza SVG/animación y elimina metadatos. Si la reexportación excede el límite, la carga se rechaza antes de almacenar. Storage limita tamaño a los mismos 4 MiB y MIME a WebP; las escrituras de usuario se deniegan para impedir saltarse la validación del servidor. Cada objeto tiene UUID nuevo y `upsert:false`.
- Si falla guardar producto, conservar su formulario y referencias registradas para reintentar. Si falla registro tras upload, la API devuelve error sin referencia usable; el objeto queda privado no registrado. Si se cancela el formulario, quedan assets privados sin asociar. No hay borrado automático ni endpoint de purga: revisión/limpieza manual futura con política aprobada.
- Un contador anónimo no es analítica de personas ni anti-bot. No acepta asignación arbitraria, pero se puede invocar repetidamente sobre activos. Configurar límites de Auth/abuso antes de exposición real; no hay limitador distribuido de la app en esta etapa.

## Límite de imágenes y alojamiento

El usuario aprobó reducir el máximo a 4 MiB el 6 de noviembre de 2026. La entrada binaria, la salida WebP y el bucket usan 4,194,304 bytes, por debajo de los 4.5 MB de cuerpo de petición y respuesta de [Vercel Functions](https://vercel.com/docs/functions/limitations#request-body-size). La carga es binaria cruda, sin sobrecarga multipart/base64. Esto resuelve la incompatibilidad de tamaño identificada; el alojamiento real aún debe verificarse antes de publicar. No se creó ningún recurso ni se garantiza costo cero.

El panel del prompt 3 adopta `MAX_IMAGE_BYTES`, muestra 4 MiB y limita a portada más tres secundarias. Maneja rechazos de servidor, conserva cargas pendientes y sube por la API autorizada; ver `PANEL.md`. El catálogo público todavía requiere la integración del prompt 4.

## Verificación reproducible y evidencia

Desde la raíz de la app:

```powershell
pnpm test:backend
pnpm typecheck
pnpm build
./tests/backend/database.ps1
```

Si pnpm se queda comprobando políticas del lockfile, los equivalentes locales no descargan herramientas:

```powershell
node node_modules/tsx/dist/cli.mjs --test tests/backend/validation.test.ts tests/backend/images.test.ts
node node_modules/typescript/bin/tsc --noEmit --incremental false
node node_modules/next/dist/bin/next build --webpack
```

Resultado de esta entrega:

- 12 pruebas de validación/imagen pasan con archivos reales generados localmente. Tipos pasan por separado.
- PostgreSQL 18 temporal aislado: migración completa, pruebas de permisos SQL/RLS, estados, retención y 8 conexiones x 50 incrementos pasan. El runner usa puerto libre, no toca servicios existentes y detiene el cluster al salir. Conserva archivos temporales tras éxito. `bootstrap.sql` simula solo schemas/roles/tablas auth y storage: NO verifica JWT, Auth, PostgREST, Storage HTTP ni firma de URLs reales. No ejecutar ese bootstrap en Supabase real.
- Primer initdb restringido falló por permiso de renombrado WAL; reintento local autorizado fuera de esa restricción pasó. Se corrigió sintaxis SQL detectada por PostgreSQL y se repitió toda la suite.
- Build habitual Turbopack no pasó: intento restringido falló descargando Geist; segundo intento falló al iniciar proceso de CSS. Build alternativo webpack pasó. La app ya ignora errores de tipos en build; por eso se ejecutó tsc separado. No se modificó UI/fuentes para sortear el problema ni el script build habitual.
- La instalación añadió dependencias Supabase SSR/JS, server-only, sharp y tsx para pruebas; `allowBuilds.esbuild: true` explícito. La política de pnpm puede bloquear comprobaciones de red: pruebas directas con herramientas instaladas pasaron. Node 24.21.0, pnpm instalado 12.6.0; declaración original pnpm12.3.4 conservada.
- Los nueve casos de `http-smoke.mjs` pasaron contra servidor de producción local propio en puerto3107, sin credenciales Supabase. La conexión restringida devolvió EACCES; con permiso local de conexión pasó. Se detuvo únicamente ese servidor de prueba, conservando el servidor de desarrollo preexistente del usuario.

Para smoke HTTP sin servicios reales, iniciar servidor propio sin variables Supabase; en producción de prueba usar `APP_ORIGIN=https://bambu.test` (origen ficticio de configuración, no crea dominio) y puerto3107:

```powershell
$env:APP_ORIGIN='https://bambu.test'
node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3107
# En otra terminal:
node tests/backend/http-smoke.mjs
```

No detener servidores ajenos para hacer la prueba. `TEST_BASE_URL` permite elegir otro puerto en el script. Las comprobaciones cubren denegación cerrada de admin/API sin configuración, origen ajeno o ausente y ruta inexistente; no prueban inicio real de sesión.

Pendiente después de las 30 pruebas reales y la recuperación confirmada por el usuario: renovación/expiración forzada de tokens, identidad Auth real autenticada sin rol, fallos parciales reales y reemplazo de imágenes, además de conectar panel y catálogo y verificar móvil/escritorio con los flujos completos. No se realizó cambio de contraseña. Los resultados iniciales sin servicios se conservan arriba como historial; no anulan las verificaciones reales posteriores. El MVP aún no está terminado.

Referencias oficiales consultadas para implementación: [Supabase SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client?queryGroups=framework&framework=nextjs), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [Storage access control](https://supabase.com/docs/guides/storage/security/access-control), [Password auth](https://supabase.com/docs/guides/auth/passwords).
