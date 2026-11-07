# Bambu Tech: contrato mínimo propuesto y plan de integración

Fecha: 6 de noviembre de 2026. Estado: **propuesta para revisión; no autoriza implementación ni recursos remotos**.

## 1. Evidencia y alcance

Se leyeron `AGENTS.md`, `MVP.md`, `ESTADO_ACTUAL.md`, `PLAN_AGENTES.md`, las cuatro páginas de `C:\Users\ele\Downloads\Requerimientos_CatalogoWeb_Admin.pdf` y el código de la aplicación extraída. El PDF es la fuente del producto; las decisiones técnicas que siguen son propuestas, salvo las identificadas como exigidas.

Revisión estática: `lib/products.ts`, páginas pública y administrativa, catálogo, filtros, tarjetas, detalle, galería, formulario, carga de fotos, tabla, métricas y dashboard, además de dependencias y configuración. Se confirma el arreglo de nueve muestras, el estado local del panel, ausencia de integración Supabase, ocultación por `isSold`, límite de ocho fotos, URLs/blob temporales, WhatsApp fijo y especificaciones centradas en teléfonos. No se localizaron rutas de datos persistentes ni controles de autenticación en los archivos revisados.

No se ejecutaron aplicación, build, comprobación de tipos ni pruebas contra servicios: esta tarea es de arquitectura. La consulta de estado Git falló incluso con el ejecutable suministrado por el entorno; no se afirma que exista un repositorio operativo ni que esté limpio. No se modificó código ni documentación previa. Este documento es el único archivo nuevo de la tarea.

## 2. Qué exige el PDF y qué deja abierto

| Tema | Exigido por el PDF | Propuesta o decisión pendiente |
| --- | --- | --- |
| Plataforma | Next.js App Router, Tailwind, Lucide; Server Actions/API Routes en Vercel; Supabase PostgreSQL/Auth/Storage; español de México y MXN (p. 1) | Plan comercial de hosting, cuentas, entornos y presupuesto |
| Datos | `settings` singleton `id=1`; campos de `products` descritos abajo (pp. 2–3) | Tipos concretos de JSON, restricciones, valores iniciales y concurrencia |
| Estados | Solo activos públicos; activo agotado visible con etiqueta (p. 3) | Nuevos productos inicialmente ocultos como medida editorial |
| Catálogo | Búsqueda al escribir por modelo/marca; pestañas Todos y cinco categorías; selectores de marca/precio; cuadrícula adaptable; detalle modal (p. 3) | Paginación, límites técnicos y política de actualización de una pestaña ya abierta |
| Imágenes | Portada y hasta tres secundarias en Storage (pp. 2 y 4) | Bucket privado, tamaños, tipos, staging, borrado y recuperación |
| Vistas | +1 en BD al hacer clic y abrir detalle; suma global en panel (pp. 3–4) | Reintentos, límites antiabuso y tratamiento de fallos; no exige visitantes únicos |
| Acceso | `/admin` privado mediante correo/contraseña de Supabase Auth (p. 4) | Quién es administrador, provisión, recuperación y duración de sesión |
| Gestión | CRUD, ajustes WhatsApp, métricas y controles separados de visibilidad/agotado (p. 4) | Política de eliminación, colisiones de edición y datos obligatorios |
| Contacto | Número dinámico de ajustes; nueva pestaña; mensaje con nombre y precio (pp. 3–4) | Número real, normalización y contacto de agotados |

El PDF menciona especificaciones de celular en formulario/detalle, pero también otras categorías y ejemplos como potencia RMS e IPX7. Propuesta: campos pertinentes por categoría y ningún dato ficticio. No se interpreta que una bocina deba tener RAM o desbloqueo telefónico. El PDF habla de garantizar costo inicial cero; las condiciones de proveedores no permiten prometerlo.

## 3. Decisiones bloqueantes para aprobación

No comenzar implementación hasta cerrar el contrato que dependa de estas respuestas. Las recomendaciones no constituyen decisiones aprobadas.

| ID | Pregunta | Recomendación concreta | Qué bloquea |
| --- | --- | --- | --- |
| D1 | ¿Quiénes tendrán acceso y quién podrá otorgarlo o revocarlo? ¿Qué correo se usará para recuperación? | Lista explícita de UUID de Auth autorizados, sin registro público; alta inicial manual por el propietario, fuera del panel | Auth, autorización y pruebas con usuarios reales |
| D2 | ¿Se aprueba precio con dos decimales y especificaciones opcionales por categoría? ¿Qué datos serán obligatorios para publicar? | Contrato de datos de la sección 4; publicar requiere título, categoría, marca, precio positivo, condición, descripción y portada. Especificaciones desconocidas quedan ausentes | Esquema, validaciones y formularios |
| D3 | ¿Eliminar será irreversible o recuperable? ¿Se conservan vistas de eliminados? ¿Cuánto se retienen fotos reemplazadas/huérfanas? | Borrado lógico recuperable durante 30 días; sin purga automática inicial. Métricas sobre inventario no eliminado; explicar que eliminar reduce su total de vistas. Retención de archivos propuesta: 30 días y limpieza solo tras política aprobada | DELETE, métricas, Storage y recuperación. Si se requiere histórico vitalicio de vistas, cambia el alcance del modelo |
| D4 | ¿Se aprueban JPEG/PNG/WebP, 3 MiB por archivo recibido, hasta 16 megapíxeles decodificados y cuatro imágenes totales? ¿Se acepta bloquear URLs externas? | Sí; límite por archivo verificado también en servidor. Subir de una en una para limitar tamaño de peticiones | Carga, validación y límites de infraestructura |
| D5 | ¿Se acepta que el contador mida aperturas aceptadas, con reintentos idempotentes y límites antiabuso? | Cada nueva apertura cuenta; mismo intento repetido no. Límites iniciales propuestos: 60 aperturas/minuto por visitante y 120/minuto por IP, globales para todos los productos | Contador, retención técnica y tratamiento de abuso |
| D6 | ¿Cuál es el número real de WhatsApp y se permite contactar por agotados? | Guardar dígitos internacionales sin `+`; para el negocio mexicano, `52` + diez dígitos nacionales. Permitir consulta de agotados, sin prometer existencia. Falta de número: contacto deshabilitado con explicación | Ajustes y aceptación del CTA; no bloquea modelar configuración vacía |
| D7 | ¿Se descartan las nueve muestras en producción y se conservan solo como ejemplos locales? | Sí. Inventario real inicialmente vacío; revisión manual antes de cualquier importación | Migración o semilla de negocio |
| D8 | ¿Se mantiene Vercel para el negocio con un plan apto y presupuesto aprobado, o se pide cambiar el requisito de hosting? ¿Qué proyecto Supabase y entornos se autorizarán? | Mantener el stack del PDF, aprobar condiciones y tope de gasto antes de contratar. No crear recursos en esta fase | Configuración remota, pruebas integradas y despliegue |

También se propone expirar la sesión administrativa tras 8 horas absolutas y 30 minutos de inactividad, con seguimiento de sesión en servidor si se aprueba ese requisito. Supabase no debe darse por configurado para ello. Para el mínimo inicial puede aceptarse su ciclo de sesión configurado, con cierre de sesión y revocación de permiso comprobada en cada operación. Elegirlo dentro de D1 antes de implementar acceso.

## 4. Contrato de datos propuesto v1

Nombres de campos iguales en BD y DTO para reducir traducciones. Los DTO públicos son proyecciones explícitas: no serializar una fila administrativa completa.

### `settings` — exigido, formato propuesto

- `id`: integer PK con restricción `id = 1`; no se permiten filas adicionales.
- `whatsapp_number`: text nullable hasta configurar, luego dígitos internacionales válidos según D6. La fila puede crearse vacía, sin copiar el número de ejemplo del código.
- `revision`: integer positivo, administrado por servidor, para impedir que un formulario viejo sobrescriba cambios recientes.
- Lectura pública: exclusivamente el número configurado o `null`. Actualización: solo admin. No se permite borrar el singleton.

### `products` — campos exigidos, restricciones propuestas

| Campo | Contrato propuesto |
| --- | --- |
| `id` | UUID generado por BD; no editable ni derivado del título |
| `title` | Texto plano, trim, 1–160 caracteres |
| `category` | Uno de `Celulares`, `Bocinas`, `Smartbands`, `Smartwatches`, `Otros` |
| `brand` | Texto plano, trim, 1–80; abierto a nuevas marcas, sin tabla adicional. Normalizar espacios y comparación de filtros; no renombrar automáticamente datos existentes |
| `price` | `numeric(12,2)`, mayor a cero y como máximo 9,999,999,999.99 MXN. Interfaz/API usan cadena decimal canónica, p. ej. `"11499.00"`; nunca flotantes para cálculos ni redondeo silencioso de entradas |
| `condition` | `Nuevo` o `Reacondicionado` |
| `main_image` | URL canónica de un objeto verificado del bucket privado; nullable solo mientras esté oculto. No una URL firmada que caduca |
| `gallery_images` | `text[]` de cero a tres URLs canónicas verificadas y distintas; no repetir portada |
| `description` | Texto plano, 0–4,000 caracteres como borrador; no vacío para publicar |
| `specs` | JSONB, objeto validado con claves conocidas y sin HTML; estructura siguiente |
| `is_active` | boolean no nulo, default propuesto `false`; independiente de `is_sold` |
| `is_sold` | boolean no nulo, default `false`; agotado no significa oculto |
| `views_count` | integer no negativo, default `0`; solo lo escribe la operación de vistas; no forma parte de ningún formulario de alta/edición |
| `created_at` | timestamptz generado por BD, inmutable |

Extensiones propuestas necesarias para D3 y concurrencia: `deleted_at` timestamptz nullable y `revision` integer positivo. Eliminar marca `deleted_at` y pone `is_active=false` en una transacción; restaurar conserva `is_sold`, vistas e imágenes y deja el producto oculto hasta publicación explícita. Estas extensiones no son exigencias del PDF. Una política de borrado físico alternativa eliminaría la fila y requeriría aceptar la pérdida de sus vistas y coordinar limpieza de archivos.

`specs` propuesto, todas sus claves opcionales; vacío significa desconocido:

- Comunes: `color` texto, máximo 80 caracteres.
- Celulares: `processor` texto (160); `ram_gb`, `storage_gb`, `battery_mah` enteros positivos; `unlocked` boolean. `false` significa explícitamente no liberado; ausencia significa desconocido. Topes técnicos propuestos: 1,024 GB RAM, 65,536 GB almacenamiento y 1,000,000 mAh.
- Bocinas: `power_rms_w` número positivo hasta 100,000; `ip_rating` texto hasta 16; `battery_hours` número positivo hasta 1,000.
- Smartbands/Smartwatches: `battery_days` número positivo hasta 365; `water_resistance` texto hasta 80; `compatibility` texto hasta 160.
- Otros: `features`, hasta diez pares de texto `label`/`value` de 80/200 caracteres. Puede usarse también para características adicionales de las demás categorías, con igual límite.

Los límites son propuestas técnicas, no datos comerciales. Validar forma, tamaño total de JSON y claves tanto en servidor como en BD; una escritura directa no debe eludirlos. Al cambiar categoría, pedir confirmar qué especificaciones conservar o convertir; no descartarlas silenciosamente. En público omitir lo desconocido o indicar «No especificado»; jamás convertir ausencias en cero, `false` o «Por definir». Resúmenes de tarjetas se construyen con valores presentes de esa categoría; no copiar ejemplos del PDF como hechos de un producto.

### Tablas técnicas mínimas propuestas

- `private.admin_users(user_id UUID PK → auth.users, enabled boolean)`: no expuesta como listado público. Nadie se puede añadir a sí mismo. El propietario provisiona/revoca mediante un procedimiento fuera del panel; no hay gestión de roles en el MVP.
- `private.media_assets(id UUID, product_id nullable, uploaded_by, object_path único, mime, byte_size, width, height, status, created_at)`: registra archivos validados pendientes y asociados. Estados mínimos `pending`, `attached`, `retained`. No se entrega al público. Impide asociar rutas ajenas, pendientes de otro administrador o inexistentes.
- `private.view_receipts(event_id UUID único, product_id, visitor_hash, ip_hash, accepted_at)`: deduplicación y límites en transacciones; retención propuesta de 24 horas, limpieza documentada. No analítica personal ni IP en claro. No se expone al panel ni al público. La limpieza y borrado de productos deben contemplar referencias sin cascadas accidentales sobre métricas.

No agregar cuentas de clientes, carrito, pedidos, pagos ni roles comerciales.

## 5. Autenticación, autorización y lecturas públicas

Propuesta: Route Handlers de Next.js como interfaz HTTP única para las mutaciones; páginas servidor pueden llamar a las mismas funciones internas de lectura/autorización. No duplicar lógica en Server Actions paralelas. Supabase Auth administra credenciales; no crear una tabla propia de contraseñas.

1. Login por correo/contraseña, logout y recuperación controlada. Sin alta pública. Ser usuario autenticado no basta: se exige coincidencia vigente en `private.admin_users`.
2. Verificar identidad en servidor con una llamada de validación adecuada del SDK; propuesta conservadora: `getUser()` por petición administrativa. Comprobar además la lista vigente de administradores. No confiar en `getSession()` sin validar, metadatos editables del usuario, parámetros del navegador ni un correo escrito en el formulario. La documentación distingue estas funciones en [autenticación SSR de Supabase](https://supabase.com/docs/guides/auth/server-side/creating-a-client).
3. Cookies de sesión administradas por el adaptador SSR; HTTPS, atributos y refresco según integración comprobada. Para mutaciones comprobar origen esperado y defensa CSRF; no usar GET para cambiar estado. Proteger también login y recuperación contra abuso y respuestas que enumeren cuentas.
4. Control de acceso en la página administrativa **y en cada handler/función**. Sin sesión: 401 en API o redirección en navegación. Sesión sin permiso: 403. Una redirección o un `noindex` no protege datos.
5. RLS activa en tablas expuestas: visitantes y usuarios no admin solo pueden SELECT productos con `is_active=true AND deleted_at IS NULL`. Admin puede leer inventario completo no eliminado; recuperación, si D3 se aprueba, mediante operación explícita. INSERT/UPDATE exigen admin, con políticas `USING` y `WITH CHECK` según corresponda. DELETE físico denegado a roles de aplicación en la variante recomendada.
6. Función auxiliar de permiso en esquema privado, sin parámetros de identidad elegidos por cliente; usa la identidad autenticada. Privilegios mínimos, nombres cualificados y `search_path` fijo si requiere `SECURITY DEFINER`. Sin política que convierta `authenticated` entero en admin. Las políticas de lectura pública también aplican a un usuario autenticado no admin.
7. Revocar privilegios de escritura de tabla amplios antes de conceder solo columnas editoriales. No conceder INSERT/UPDATE de `views_count`, `created_at`, `id` ni `revision`; revisión se modifica por lógica de servidor/BD. Para altas, el default de vistas es cero. RLS limita filas, pero no protege por sí sola cada columna: se necesitan [privilegios por columna](https://supabase.com/docs/guides/database/postgres/column-level-security).
8. No usar vistas SQL con privilegios del propietario que filtren RLS por accidente: evitar vistas al inicio o usar `security_invoker` y permisos verificados. Toda función privilegiada reevalúa explícitamente visibilidad/autorización. [RLS de Supabase](https://supabase.com/docs/guides/database/postgres/row-level-security).

Las consultas públicas se ejecutan como anónimo, incluso si el visitante tiene una sesión administrativa, para que la tienda no filtre por accidente inventario oculto. Inactivos y eliminados devuelven 404 indistinguible en detalle, fotos y contador. Marca/facetas y cualquier búsqueda se calculan exclusivamente de activos; no filtrar después de mandar el inventario al navegador.

Proyección pública: `id,title,category,brand,price,condition,description,specs,is_sold` más URLs de entrega de imágenes. No necesita `views_count`, marcas temporales internas ni lista de administradores. Catálogo paginado, orden estable `created_at DESC,id DESC`, 24 elementos por página, máximo 100. Filtros `q` hasta 100 caracteres, categoría, marca, precio mínimo inclusivo y máximo exclusivo; todos combinables, parámetros validados y consultas parametrizadas. Facetas de marca sobre el conjunto activo, sin revelar ocultos. Si se mantienen los rangos actuales, ajustar etiquetas para expresar correctamente los límites de 5,000, 10,000 y 20,000.

Para el mínimo inicial, lecturas públicas y administrativas dinámicas y sin caché compartida (`no-store`); no generar inventario en build. Refrescar listado al recuperar foco y consultar detalle vigente al abrirlo. Una publicación vieja ya descargada no puede retirarse de memoria de otro dispositivo; la garantía se refiere a nuevas lecturas autorizadas. Ningún sistema puede recuperar una foto que alguien ya guardó.

## 6. Interfaces acordables para panel y catálogo

Todas las firmas y rutas de esta sección son propuestas de contrato, no código implementado. Error común: `{ error: { code, message, fieldErrors?, requestId } }`, sin trazas, SQL ni secretos. 400 entrada inválida; 401/403 acceso; 404 ausente/no público; 409 conflicto de revisión; 413 tamaño; 415 tipo; 429 límite; 503 dependencia temporal. Fechas ISO UTC; precio cadena decimal; contadores enteros no negativos. Rechazar campos desconocidos en mutaciones, en particular `views_count`.

| Operación | Entrada | Salida y reglas |
| --- | --- | --- |
| `GET /api/catalog` | `q,category,brand,min_price,max_price,cursor,limit` | `{items: PublicProduct[], next_cursor, brands}`; siempre filtro público en BD; lista vacía válida |
| `GET /api/catalog/:id` | UUID | `{product: PublicProduct, view_ticket: string}` vigente; ticket firmado de corta duración ligado a producto y visitante. No incrementa vistas, para no contar prefetch/reintentos de GET |
| `GET /api/settings` | Ninguna | `{whatsapp_number: string|null}`; ninguna configuración privada |
| `POST /api/catalog/:id/views` | `{event_id,view_ticket}` y cookie anónima firmada | `{counted: boolean}`; operación sección 7; no acepta un contador ni delta |
| `POST /api/auth/login` | email/password | Sesión; solo usuarios autorizados entran al panel; no registrar contraseña en logs |
| `POST /api/auth/logout` | Sesión | Cierre de sesión; no cambia inventario |
| `POST /api/auth/recovery` | email | Respuesta genérica; envío real y URL de retorno solo tras configurar y autorizar flujo |
| `GET /api/admin/products` | cursor/limit | Productos administrativos, con estados separados, URLs para previsualización y `revision`; paginado, no usarlo como catálogo |
| `GET /api/admin/metrics` | Sesión admin | `{total,available,sold,total_views}` en una lectura coherente de BD |
| `POST /api/admin/products` | `ProductWrite` | Producto persistido con UUID, vistas cero y revisión inicial; `is_active=false` por defecto si no se solicita publicar |
| `PATCH /api/admin/products/:id` | Campos editoriales y `expected_revision` | Actualización condicional, sin sobrescribir vistas; devuelve producto y nueva revisión |
| `PATCH /api/admin/products/:id/state` | `expected_revision` y uno o ambos booleanos `is_active,is_sold` | Cambia solo campos enviados. No «toggle» ciego: enviar valor deseado y esperar confirmación |
| `DELETE /api/admin/products/:id` | `expected_revision`, confirmación explícita | Si D3 se aprueba: borrado lógico transaccional y retención. Sin política aprobada no habilitar eliminación |
| `POST /api/admin/products/:id/restore` | `expected_revision` | Solo si se aprueba D3; restaura oculto durante retención, nunca publica automáticamente |
| `POST /api/admin/media` | Multipart: un archivo | `{asset_id,preview_url}` después de validar y almacenar; asociación posterior. Los límites de petición incluyen sobrecarga multipart |
| `GET /api/admin/settings` | Sesión admin | Número actual y `revision` |
| `PATCH /api/admin/settings` | `whatsapp_number,expected_revision` | Ajuste persistido, revisión incrementada |
| `GET /api/catalog/:id/images/:slot` | `main` o índice 0–2 | Bytes solo si producto activo, no eliminado y objeto asociado; sin redirección pública permanente |

`ProductWrite`: título, categoría, marca, precio decimal, condición, descripción, specs, `main_asset_id|null`, `gallery_asset_ids` (0–3), y estados opcionales. En edición enviar únicamente cambios y revisión; un campo ausente no equivale a borrarlo. Solo campos editoriales aceptados. El servidor traduce IDs validados de archivos a URLs canónicas; el navegador no fija `main_image` a una URL arbitraria. Publicación debe validar portada existente y resto de campos en la misma transacción.

`PublicProduct` usa `main_image` como URL de entrega de la aplicación, no la referencia interna de Storage, y `gallery_images` como URLs de entrega ordenadas. `AdminProduct` añade `is_active,views_count,created_at,revision` y referencias de edición de medios. Separar ambos tipos aunque compartan campos. Exponer `deleted_at` solo en el flujo administrativo de recuperación aprobado.

Métricas calculadas en servidor, sobre productos no eliminados según D3: total = count; disponibles = `is_active AND NOT is_sold`; agotados = `is_sold`, incluyendo ocultos; vistas = suma de todos esos productos, incluidos ocultos y agotados, con cero para conjunto vacío. No sumar solo la página cargada. Si se aprueba incluir papelera, cambiar explícitamente el alcance y etiquetas antes de implementar.

Catálogo abre detalle aunque falle el registro de vista; muestra los datos vigentes y trata el fallo de métricas sin bloquear navegación. Mensaje WhatsApp codificado completo: «Hola, me interesa el equipo: {title} con precio de {precio formateado MXN}». Nueva pestaña con `noopener noreferrer`. Sin número válido no generar enlace. El precio del mensaje es informativo, no una reserva ni una cotización garantizada.

## 7. Contador: +1 atómico sin asignación arbitraria

Propuesta recomendada: endpoint Next.js y función PostgreSQL **privada**, invocable exclusivamente mediante un rol de conexión servidor `view_writer`. Este rol no tiene UPDATE/INSERT/DELETE sobre productos, no administra Auth/Storage y solo puede ejecutar la función necesaria. Credencial de conexión con pool en servidor, nunca `NEXT_PUBLIC_*`; confirmar soporte de conexión en el entorno antes de fijar el adaptador. El SDK público no puede invocar la función por Data API.

La función toma ID de producto, ID de evento y hashes antiabuso calculados por servidor; no toma contador, delta ni identidad administrativa. Es `SECURITY DEFINER` con propietario de privilegios mínimos, `search_path` fijo, referencias cualificadas, sin SQL dinámico y sin EXECUTE concedido a PUBLIC/anon/authenticated. Su lógica transaccional:

1. Comprobar producto activo y no eliminado, con bloqueo apropiado para serializar frente a ocultación/borrado. Si la ocultación se confirma primero, no contar; si la vista se confirma primero, puede contar esa apertura.
2. Serializar evaluación de cuotas por visitante e IP para evitar carreras entre productos; deduplicar `event_id` con restricción única. Un UUID repetido nunca aumenta dos veces, incluso con peticiones concurrentes. Un reuso para otro producto es inválido.
3. Verificar límites globales de D5 y registrar recibo únicamente si se acepta.
4. Ejecutar incremento atómico `views_count = views_count + 1` dentro de la misma transacción. Manejar el tope del integer sin reiniciar ni desbordar. Si falla incremento o recibo, revertir ambos.
5. Devolver solo si fue contabilizado; no revelar el contador ni existencia de productos ocultos.

El navegador genera un evento nuevo por transición cerrado → abierto y por cambio de producto abierto; conserva ese UUID y su ticket al reintentar. Render, hidratación, Strict Mode, cambio de foto, filtros, hover o prefetch no cuentan. Cerrar y volver a abrir sí es nueva apertura; no deduplicar por producto/persona porque alteraría lo pedido en el PDF. Reintentos propuestos: solo fallos transitorios, mismo evento, máximo dos, dentro de diez minutos. Con recibos de 24 horas la idempotencia no es eterna; el servidor rechaza tickets vencidos antes de llegar a BD. El ticket emitido al leer el detalle firma producto, visitante, emisión y vencimiento de diez minutos; no admite tiempos inventados del cliente. No renovar un ticket para reintentar un evento viejo. El ticket no demuestra una apertura humana ni sustituye cuotas.

Cookie anónima aleatoria firmada por servidor, sin cuenta de cliente. HMAC de IP con secreto exclusivo y rotación; usar solo dirección suministrada por infraestructura confiable, nunca confiar ciegamente en `X-Forwarded-For` aportado por visitante. Las cuotas deben ser compartidas y atómicas en BD; un Map en una función serverless no basta. En D5 confirmar retención y límites; las cuotas pueden afectar redes compartidas.

Alternativas: una RPC pública que solo hace +1 evita asignar un número arbitrario, pero permite saltarse el endpoint y sus límites; por eso no se recomienda. Usar una clave `service_role` para todas las operaciones es más simple, pero omite RLS y amplía mucho el daño de un error. El rol dedicado reduce ese privilegio. Aunque se proteja la asignación, ningún contador público demuestra que cada apertura sea humana: bots, cookies nuevas y distintas IP aún pueden inflarlo. Esto es una métrica de aperturas aceptadas, no analítica antifraude.

## 8. Storage, archivos y operaciones parciales

Propuesta: un bucket privado `product-images`; rutas inmutables generadas por servidor `products/{asset_uuid}.{extension}`. No usar nombre original como ruta. La BD conserva URLs canónicas del Storage propio y su registro de medios; no URLs firmadas ni `blob:`. Un bucket público permite recuperar archivos con su URL aunque el producto se oculte, por lo que no satisface ocultación de medios. [Buckets de Supabase](https://supabase.com/docs/guides/storage/buckets/fundamentals).

Permisos:

- Anónimo y autenticado no admin: lectura de objeto solo si está asociado como portada/secundaria a producto activo y no eliminado. Sin listar staging ni medios no asociados. La política comprueba asociación exacta, no solo un prefijo predecible.
- Admin vigente: lectura de medios vinculados y previsualización de sus pendientes; sin escrituras directas desde navegador.
- Todos los roles de navegador: INSERT/UPDATE/DELETE de Storage denegados. Bucket restringe tipos y tamaño además del servidor. Las políticas de [Storage](https://supabase.com/docs/guides/storage/security/access-control) son parte de la prueba de acceso, no decoración.
- Solo el módulo servidor de archivos utiliza la credencial privilegiada requerida por la API de Storage para subir/borrar. Nunca se exporta al cliente ni se reutiliza para consultas de catálogo, CRUD o contador. Antes de cada operación comprueba sesión, admin vigente y solicitud validada. La clave privilegiada omite RLS: esta es una excepción explícita de confianza, no una garantía proporcionada por las políticas. [Alcance de service role](https://supabase.com/kb/troubleshooting/why-is-my-service-role-key-client-getting-rls-errors-or-not-returning-data-7_1K9z).

Servidor recibe un archivo por petición; mide bytes reales, verifica firma, decodifica con límite de píxeles y vuelve a codificar a un formato permitido. Rechazar SVG, GIF animado, formatos no permitidos y archivos corruptos; quitar EXIF/metadatos. No basta `accept`, extensión o MIME declarado. Limitar también dimensiones y tamaño final; nunca descargar URLs externas suministradas por usuario, evitando además SSRF. Bucket y servidor comparten límites coherentes. El límite propuesto de 3 MiB debe comprobarse frente al límite real del host y la sobrecarga multipart antes de aprobar D4.

Secuencia: validar → subir objeto nuevo → registrar medio pendiente → devolver ID → guardar producto y asociar medios en una transacción → conservar anteriores como retenidos. No sobrescribir una ruta: evita cachés ambiguas y perder la foto anterior si falla una edición.

Storage y PostgreSQL no comparten transacción. Si falla el registro tras subir, intentar compensación segura y registrar el huérfano para conciliación; si falla guardar producto, mantener pendiente para reintento. Nunca retirar fotos antiguas antes de confirmar producto nuevo. Un job de conciliación solo podrá borrar archivos sin referencias, vencidos y cubiertos por política D3; volver a comprobar referencias justo antes de borrar. No tocar manualmente metadatos internos de Storage como sustituto de su API.

Entrega pública por el endpoint de imágenes: verifica producto y asociación en cada solicitud, descarga con permisos anónimos sujetos a RLS y entrega sin caché compartida ni URL firmada reutilizable. Las URL firmadas serían una alternativa de menor carga, pero seguirían válidas hasta caducar después de ocultar: requieren aceptar explícitamente esa ventana. La entrega por servidor añade ancho de banda y ejecución; no prometer costo cero. También requiere probar el acceso a objetos con la clave pública/identidad apropiada del SDK. Fotos ya descargadas permanecen fuera del control de la aplicación.

## 9. Adaptación del código y muestras sin inventar datos

| Modelo actual | Adaptación propuesta |
| --- | --- |
| `id` tipo slug o UUID local | UUID nuevo de BD; si se aprueba importar, conservar un mapa externo slug → UUID. No inventar enlaces históricos |
| `model` | `title`, conservando texto original verificado |
| `Brand` unión de cuatro marcas | Marca como texto validado; facetas derivadas de productos públicos |
| `price` entero | Conversión decimal exacta, p. ej. `11499` → `"11499.00"` |
| `ram/storage/processor/battery/unlocked/color` | Claves correspondientes de `specs`, solo valores conocidos y revisados |
| Sin categoría | Para estas muestras de teléfonos, proponer `Celulares` sujeto a revisión; no inferir categorías de futuros productos por su nombre |
| `images[]` | Primera como portada, siguientes hasta tres secundarias, tras verificar y subir archivos. Más de cuatro requiere selección humana; no truncar sin aviso |
| `isSold` | `is_sold`; jamás derivar `is_active = !isSold` |
| Sin visibilidad | Empezar oculto y pedir publicación explícita; no afirmar que el dato histórico era activo |
| Sin vistas/fecha persistidas | Vistas iniciales cero y fecha real de importación; no inventar histórico |

Las nueve filas son muestras, no inventario confirmado. El iPhone 13 reutiliza una imagen de iPhone 14: bloquear importación/publicación hasta corregir foto o descartar esa muestra. No asumir que textos como «certificado», «con garantía», «libre» o los datos de batería describen mercancía real. El encabezado general actual promete equipos libres/garantizados aunque contiene una muestra `unlocked=false`; revisar ese texto con el negocio, sin añadir garantías nuevas.

Eliminar defaults falsos del formulario: RAM/ROM predeterminadas, batería cero, desbloqueo verdadero y procesador «Por definir» no deben convertirse en hechos. Mantener borrador incompleto oculto y permitir entrada explícita. Conservar el diseño del modal, tarjetas y galería donde sea compatible; cambiar fuente de verdad a BD. `useState` puede manejar borradores y carga, pero éxito de guardado exige confirmación de servidor. No mostrar una edición como persistida si la petición falló.

## 10. Responsables de archivos e integración

Rutas relativas a `bambu-tech-app/`. Son límites de trabajo futuro; no se han lanzado agentes de implementación.

| Responsable | Archivos exclusivos propuestos | Entrega requerida |
| --- | --- | --- |
| Integrador/contrato | `lib/contracts/**`, adaptación o retirada de `lib/products.ts`, `lib/utils.ts`, `package.json`, lockfile, configuración, `app/layout.tsx`, estilos globales, componentes UI compartidos y documentación | DTO, validaciones comunes, errores, utilidades MXN/WhatsApp y decisiones versionadas; único editor de dependencias |
| Datos y seguridad | `supabase/migrations/**`, `lib/server/**`, `lib/supabase/**`, `app/api/**`, `.env.example` sin valores y pruebas de políticas/servicios | Esquema, RLS, privilegios, Auth, Storage, contador, operaciones y guía reproducible. Solicita dependencias al integrador |
| Panel | `components/admin/**`, `app/admin/**` y componentes propios de login/recuperación | Interfaz privada, ajustes, cuatro métricas, CRUD, estados y manejo de errores. No cambia handlers ni contrato |
| Catálogo | `app/page.tsx`, `components/catalog.tsx`, `components/catalog-filters.tsx`, `components/product-card.tsx`, `components/product-detail-dialog.tsx`, `components/product-gallery.tsx`, `components/site-header.tsx`, `components/condition-badge.tsx`, `components/whatsapp-icon.tsx` | Catálogo y detalle por categoría, filtros, agotados, WhatsApp, evento de apertura. Si el panel necesita un componente de esta lista, lo consume sin editarlo o pide al integrador extraerlo |
| Integración/calidad | Pruebas de recorridos y revisión cruzada; correcciones asignadas al propietario del archivo | Evidencia de contratos, permisos, persistencia, móvil y escritorio; integrador incorpora cambios comunes secuencialmente |

Orden obligatorio:

1. Usuario resuelve D1–D8 y se fija versión del contrato, incluidas decisiones de métricas/borrado. Resolver Git operativo y punto de partida sin crear repositorio por suposición.
2. Integrador publica tipos, operaciones y ejemplos sintéticos inequívocamente de prueba. Datos/seguridad prepara migraciones y adaptadores localmente, sin crear recursos externos. Verificar disponibilidad/versiones de herramientas antes de ejecutar.
3. Revisar primero permisos y contrato del contador/medios. Integrador incorpora dependencia y configuración comunes; nunca dos agentes editan el lockfile.
4. Panel y catálogo pueden trabajar en paralelo solo con contrato estable y archivos exclusivos. Usar fixtures aislados de desarrollo, sin fallback silencioso a muestras cuando falla BD real. Cualquier cambio de contrato se acuerda y aplica por el integrador antes de continuar.
5. Integrar backend, luego panel y catálogo, verificando tras cada incorporación. Crear/provisionar recursos remotos solo con autorización posterior expresa y entorno identificado.
6. Ejecutar aceptación completa en entorno de prueba autorizado. Despliegue requiere decisión posterior; esta propuesta no lo autoriza.

## 11. Verificación y condiciones de aceptación futuras

- Matriz anónimo / autenticado no admin / admin / admin revocado, probada por HTTP y directamente en Data API/Storage. Intentar acceder al panel y mutar sin UI. Confirmar denegación por servidor y políticas, no solo botón oculto.
- Cuatro combinaciones de estados: activo disponible y activo agotado públicos; oculto disponible y oculto agotado ausentes en listado, detalle, búsqueda, facetas, fotos y contador. Producto eliminado también ausente. Probar revocación con sesiones ya abiertas y URLs conocidas.
- Intentar asignar vistas mediante alta, PATCH y acceso directo a tablas/RPC. Debe rechazarse; también admin de aplicación. Rol contador incapaz de editar título, precio o fijar el contador. Rol de archivos nunca usado como conexión general.
- Vistas concurrentes: con cuotas ajustadas en pruebas controladas, N eventos distintos válidos aumentan exactamente N; reintentos de un mismo evento solo uno; rollback no deja recibo sin incremento; ocultación concurrente coherente; límites compartidos entre instancias y productos; no contar render, GET ni galería. Fallos del contador no cierran detalle.
- Persistencia real tras recargar y desde otra sesión; actualización con revisión antigua devuelve 409, sin perder cambios ni contador. No confundir estado optimista con éxito persistente.
- Crear/publicar/ocultar/agotar/editar/eliminar y restaurar si se aprueba. Métricas incluyen ocultos y agotados en el ámbito acordado, y no solo resultados filtrados o primera página.
- Fotos: falsificar extensión/MIME, superar bytes/píxeles/número, objeto ajeno, URL externa, ruta inexistente; todos rechazados. Simular fallos de subida, registro y guardado; referencias antiguas conservadas y huérfanos reconciliables. No efectuar borrados reales sin política.
- Filtros combinados, fronteras exactas de rangos, marcas nuevas, vacíos, valores faltantes y categorías no telefónicas sin RAM/batería ficticias; móvil/escritorio, teclado y estados de carga/error.
- WhatsApp vacío/inválido/actualizado, caracteres acentuados y precio con centavos; comportamiento de agotados según D6.
- Ejecutar comprobación de tipos separada de build. El proyecto declara pnpm 12.3.4 y no tiene scripts de pruebas/lint; verificar herramientas reales. `ignoreBuildErrors` actual impide tomar build como prueba de tipos. Acordar pruebas específicas de seguridad y concurrencia al implementar; no afirmar que hoy pasaron.

Configuración futura sin valores: URL y clave pública de Supabase; clave privilegiada exclusiva del módulo de archivos; conexión restringida de contador mediante pool; secretos independientes para cookie/firmas y HMAC; origen canónico para CSRF/recuperación; identificador del bucket. Ninguna clave privada bajo prefijo público ni en control de versiones/logs. SQL de despliegue usa credenciales de administración separadas del runtime. Las dependencias Supabase SSR/cliente, validador, conexión PostgreSQL y decodificador de imágenes se seleccionarán y fijarán al implementar, no en esta fase.

## 12. Costos, opciones y límites

Consulta de documentación oficial durante esta revisión:

- [Vercel Hobby](https://vercel.com/docs/plans/hobby) está limitado a uso personal no comercial. Un catálogo comercial Bambu Tech no debe asumir elegibilidad; mantener el requisito Vercel exige evaluar un plan apto y obtener autorización de presupuesto. Elegir otro proveedor modificaría el requisito del PDF y requiere decisión del usuario.
- [Supabase Free](https://supabase.com/pricing) publica cuotas de almacenamiento, base y transferencia, además de suspensión por inactividad. Que las peticiones API se anuncien sin límite numérico no vuelve ilimitados cómputo, transferencia o capacidad. No se ha inspeccionado ningún proyecto ni su plan real.
- Imágenes privadas servidas por Next.js consumen ejecución y transferencia; contadores, recibos y cuotas consumen BD. Compresión y paginación reducen consumo, no lo eliminan. URLs firmadas reducen intermediación, a cambio de ventana de acceso tras ocultación.
- Dominio, correo de recuperación/SMTP, respaldos, observabilidad, tráfico, abuso, cambios de plan e impuestos pueden tener costos o límites propios. Acordar alertas, topes disponibles y comportamiento al agotar cuotas; no activar upgrade, facturación ni servicios para evadir límites sin autorización.
- Contador y CRUD con PostgreSQL más Storage permiten el MVP, pero no garantizan cero costo, disponibilidad continua ni ausencia de abuso. Empezar con simulación/local y después entorno real autorizado permite medir antes de publicar.

La propuesta queda lista para resolver decisiones; no acredita una aplicación implementada ni un despliegue seguro.
