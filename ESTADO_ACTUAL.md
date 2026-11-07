# Diagnóstico inicial de la aplicación

## Estado vigente para la entrega — 6 de noviembre de 2026

El prompt 2 tiene backend implementado y verificado con Supabase real. La aplicación está en `bambu-tech-app/`; documentación y requisitos están en la raíz. El usuario confirmó recepción del correo de recuperación y transición en su navegador de «autorizado No» a «autorizado Sí», sin cambiar contraseña. Los logs saneados corroboran callback 303, acceso a admin 200 y sesión administrativa 200. Hay dos solicitudes recovery 200 en esos logs; una respuesta genérica no permite inferir cuántos correos se entregaron. El agente no originó esos envíos.

Evidencia: 12 pruebas locales, tipos y compilación Webpack aprobados desde la carpeta nueva; 30 comprobaciones de API con Supabase real aprobadas, dos sesiones independientes, CRUD persistente, imágenes privadas de máximo 4 MiB, permisos, estados, métricas y 20 vistas concurrentes. Auth tiene registro público deshabilitado y el WhatsApp aprobado está guardado. Guía técnica y contrato HTTP en `bambu-tech-app/docs/BACKEND.md`.

La contraseña temporal fue retirada de `.env.local`; las claves y SQL personales permanecen ignorados por Git. Se retiró la página temporal de recuperación y se detuvo únicamente el servidor de prueba propio. El producto de prueba permanece eliminado lógicamente y su imagen privada se conserva según política; no se hizo purga remota. La reestructuración ya tiene un commit independiente; el backend y documentación se registran en el siguiente.

Pendientes explícitos: renovación/expiración de tokens no forzada, flujo real de una cuenta autenticada no administradora no probado, cambio de contraseña no realizado, integración visual de acceso/recuperación y panel (prompt 3), catálogo real (prompt 4) y recorridos finales de navegador/móvil (prompt 5). Turbopack habitual sigue sin certificación por los fallos de entorno documentados. No hay despliegue ni push. Los apartados siguientes registran etapas anteriores y no sustituyen este estado vigente.

## Avance coordinado del prompt 2 — 6 de noviembre de 2026

### Revisión tras reestructuración

Raíz actual de ejecución: `bambu-tech-app/`. El coordinador comprobó que los 60 archivos del paquete original están presentes en esa ubicación; frente a la base Git, solo difieren `.gitignore`, `package.json`, lockfile y configuración pnpm por la implementación backend. Los componentes y recursos originales conservan su contenido. Backend, rutas API, proxy, migración, scripts y pruebas también están presentes. No quedan referencias a la antigua ruta de extracción en los archivos de trabajo inspeccionados. `.env.local`, dependencias, compilados y SQL de configuración personal siguen excluidos por el `.gitignore` de la app. Los documentos raíz ya apuntan a la nueva carpeta.

El agente ejecutó desde la nueva ubicación las 12 pruebas locales, comprobación de tipos y compilación Webpack: aprobadas. Auth real confirma registro público deshabilitado; cuenta, WhatsApp y bucket siguen correctos. El usuario confirmó Site URL y retorno configurados; no se pueden inspeccionar ambos ajustes con las claves de aplicación. El antiguo servidor 3000 no respondía; se inició uno desde la app nueva tras comprobar puerto libre. Settings responde 200 y callback sin código responde 400. Next dev generó `bambu-tech-app/AGENTS.md` y `CLAUDE.md`; se leyeron y conservaron.

Se preparó `public/recovery-check.local.html` temporal, ignorado por Git y sin claves/contraseñas, revisado por el coordinador. Permite que el usuario solicite el único correo autorizado desde su navegador (conservando cookie PKCE) y compruebe sesión antes/después. No se ha enviado correo por scripts ni pulsado el botón; envío, recepción y callback quedan pendientes de la interacción del usuario. Retirar fixture al terminar. La respuesta genérica de recovery no demuestra aceptación del proveedor ni entrega. El servidor de desarrollo propio queda activo para esta prueba, con parámetros de callback ocultos en su salida.

Queda un `package.json`, lockfile y `node_modules` auxiliar en la raíz, distinto del paquete real de la app; se conserva como cambio ajeno. Los comandos de Next se ejecutan dentro de `bambu-tech-app`. Git aún muestra rutas antiguas eliminadas y nueva carpeta sin seguimiento porque la reorganización no se ha preparado ni confirmado mediante commit; esto no implica archivos de aplicación faltantes. No se restauraron ZIP ni se deshizo la mudanza.

### Conexión al proyecto real, posterior a la entrega local

El usuario creó Supabase y autorizó configurar el entorno de prueba. Guardó claves en `.env.local` ignorado por Git y ejecutó manualmente la migración en SQL Editor («success»). Después creó su cuenta Auth y ejecutó la finalización administrativa, reportando ambos booleanos true. Inspección independiente del coordinador: catálogo público responde 200 vacío; bucket `bambu-products` existe, privado, solo WebP y máximo 4,194,304 bytes; cuenta administrativa existe y correo confirmado; WhatsApp coincide con el aprobado. El agente comprobó seis denegaciones de operaciones administrativas anónimas. `service_role` no tiene SELECT/UPDATE genérico de products/settings en este proyecto; no se ampliaron esos grants por comodidad del inspector y el backend usa sesión/RPC para las operaciones de productos. Falta verificar membresía efectiva con sesión, login, CRUD, recuperación y entrega/carga real de imágenes. El usuario eligió contraseña temporal en `.env.local` para la prueba, pendiente de confirmación de que la guardó; nunca se solicitará en chat ni se imprimirá. No se han enviado correos ni publicado la app. Las limitaciones de la entrega local que se describen a continuación conservan su contexto histórico.

Tras la confirmación del usuario, el agente ejecutó `tests/backend/supabase-live.mjs` contra la API de un servidor de producción local propio y Supabase real: **30 comprobaciones aprobadas**. Incluyen login y allowlist efectiva, dos sesiones independientes, CRUD persistente, ajustes, carga/entrega WebP, rechazo de más de 4 MiB, descarga/firma directa pública denegada, 20 incrementos concurrentes conservados, métricas, activo agotado visible, oculto no visible e imagen 404, eliminación lógica y retención de archivo, cierre de sesión local conservando la otra sesión. Solo se utilizó producto sintético `6640ee28-9b8d-45d9-8c4f-b8fce7b12aa0`, eliminado lógicamente al terminar; imagen privada retenida. Compilación Webpack actualizada y tipos aprobados. El servidor de prueba propio se detuvo; servidor del usuario en 3000 se conserva. El coordinador revisó el runner y verificó que `TEST_ADMIN_PASSWORD` fue retirada de `.env.local`, sin imprimir secretos.

Pendiente detectado por inspección real de Auth: `disable_signup=false`, por lo que el usuario debe desactivar el registro público; el email está habilitado. No se pueden verificar Site URL/redirects con las claves de aplicación. Antes del único correo de recuperación autorizado, el usuario debe confirmar Site URL `http://localhost:3000` y redirect `http://localhost:3000/api/auth/callback`. Servidor del usuario en 3000 responde a settings y callback. No se ha enviado ese correo aún ni se cambiará contraseña. Renovación/expiración de tokens todavía no probada explícitamente. La interfaz de acceso/recuperación y recorridos de navegador siguen pendientes de prompts posteriores.

El usuario aprobó las propuestas de negocio y autorizó un agente backend para implementación local. El coordinador mantuvo documentación y revisó las entregas, sin escribir código de aplicación. Contrato: `CONTRATO_BACKEND.md`. No se autorizó ni realizó despliegue o aprovisionamiento remoto.

Se añadieron migración SQL, contratos y validadores, acceso a Supabase de servidor, rutas API, protección de `/admin`, carga/entrega de imágenes y pruebas locales. Las páginas y componentes originales todavía no consumen esas operaciones: el catálogo sigue mostrando ejemplos y el panel requiere futura integración, incluida la interfaz de acceso. El código nuevo no implica un MVP terminado.

Verificado por el coordinador: repositorio Git operativo; comprobación independiente de tipos con `node node_modules/typescript/bin/tsc --noEmit --incremental false` y 12 pruebas con `node --import tsx --test tests/backend/validation.test.ts tests/backend/images.test.ts`, todas aprobadas. El intento de `pnpm exec` quedó detenido en verificación de políticas del lockfile y fue cancelado; se usaron ejecutables locales instalados. Se conservaron archivos ajenos sin seguimiento en la raíz.

También verificado independientemente: nueve comprobaciones HTTP sobre un servidor local de producción aislado, con Supabase sin configurar: `/admin` y sus subrutas deniegan acceso (503), las API informan servicio no configurado, las mutaciones de origen ajeno o ausente se rechazan (403), y rutas desconocidas devuelven 404; respuestas sin detalles internos y sin caché.

El agente reportó ejecución aprobada de migración/políticas/estados en PostgreSQL 18 temporal aislado y 400 incrementos concurrentes desde ocho conexiones, conservados íntegros. Auth y Storage fueron estructuras de prueba, no servicios Supabase reales. La primera ejecución restringida de initdb falló al renombrar WAL; el reintento permitido pasó. La prueba SQL detectó un error de sintaxis CASE que fue corregido antes de aprobar la suite. Reportó además compilación aprobada con `node node_modules/next/dist/bin/next build --webpack`; el intento Turbopack falló por fuentes/red e inicio del proceso CSS. `pnpm build` habitual no queda certificado por esa alternativa.

Pendiente real: Supabase Auth/Storage, persistencia entre sesiones, correo de recuperación, identidades administrativas, WhatsApp y proyecto/entorno. El usuario aprobó reducir las imágenes de 5 a 4 MiB (4,194,304 bytes) para entrada, salida WebP y límite del bucket, por debajo del límite de 4.5 MB de Vercel Functions ([documentación oficial](https://vercel.com/docs/functions/limitations#request-body-size), revisada el 6 de noviembre de 2026). La interfaz de fotos original conserva su validación antigua hasta integrarla en el prompt 3; no confundirla con el backend nuevo. No hay publicación. El diagnóstico inicial siguiente se conserva como referencia anterior a esta implementación.

Revisión estática del código disponible el 6 de noviembre de 2026. No se arrancó la aplicación, no se ejecutaron compilación ni pruebas y no se verificaron servicios remotos. Las afirmaciones describen el código inspeccionado, no un despliegue.

## Ubicación y stack

Raíz de la app: `bambu-tech-app/`. Los ZIP de extracción se eliminaron y el DOCX de requisitos se conservó en la raíz del proyecto. El paquete incluye `node_modules`, `.next` y lockfile; su presencia no demuestra que la app compile o funcione. No se ha confirmado un repositorio Git operativo.

`package.json` declara Next.js 16.3.3, React 19, TypeScript 5.7.3, Tailwind CSS 4, Base UI/shadcn, Lucide y Vercel Analytics; declara pnpm 12.3.4. App Router usa `app/page.tsx`, `app/admin/page.tsx` y `app/layout.tsx`. No aparecen dependencias de Supabase ni scripts de pruebas/lint. `next.config.mjs` desactiva optimización de imágenes y tiene `typescript.ignoreBuildErrors: true`. `layout.tsx` incluye fuente Geist y Analytics solo en producción.

## Cómo funciona hoy

- `lib/products.ts`: tipo `Product` centrado en teléfonos, cuatro marcas fijas, rangos de precio y nueve productos de ejemplo. WhatsApp usa un número fijo y el mensaje solo incluye el modelo.
- `app/page.tsx` pasa esos datos a `components/catalog.tsx`, que filtra en el cliente por texto, marca y precio. Oculta los `isSold`; abre el detalle como modal. Tarjetas y galería usan imágenes de `public/phones` o rutas presentes en datos.
- El detalle muestra características de teléfono, precio y enlace de WhatsApp. No se ve un contador de vistas persistente.
- `app/admin/page.tsx` entrega la misma lista fija a `AdminDashboard`; el panel mantiene otra copia con `useState`. Alta, edición, venta y eliminación solo cambian esa copia: al recargar se reinicia y no actualiza el catálogo público.
- El formulario edita modelo, marca, precio entero, color, RAM, ROM, condición, fotos y estado. No edita procesador, batería, liberación ni descripción; para un producto nuevo utiliza valores predeterminados como `Por definir`, `0` y descripción vacía.
- `photos-field.tsx` admite hasta ocho imágenes, URLs y archivos locales con vista previa `blob:`. Estos archivos no se suben a un servicio ni persisten tras la sesión. Permite elegir portada.
- El panel muestra total, activas y vendidos, pero no vistas. No se observa autenticación, base de datos, almacenamiento remoto, ajustes de negocio, categorías ni distinción entre visibilidad y agotado. El metadato `robots: noindex` no constituye protección.

## Diferencias principales frente al PDF

| Área | Actual | MVP requerido |
| --- | --- | --- |
| Datos | Arreglo fijo; estado temporal independiente | PostgreSQL compartido y persistente |
| Productos | Solo teléfonos, marcas fijas | Cinco categorías, marca y especificaciones apropiadas |
| Estado | `isSold` oculta en público | `is_active` y `is_sold` separados; agotados activos visibles |
| Fotos | Hasta 8 referencias locales/URL | Portada y máximo 3 secundarias en Storage |
| Administración | Ruta sin protección observable | Auth, autorización y gestión persistente |
| Negocio | WhatsApp fijo, sin precio en mensaje | Número editable y mensaje con nombre y precio |
| Analítica | Sin contador persistente | Incremento por apertura y métricas de vistas |
| Formulario | Especificaciones incompletas | Campos generales, descripción y especificaciones editables |

## Riesgos de integración

`Product` y los componentes asumen especificaciones de teléfono; adaptar datos sin romper la interfaz requiere un contrato común. Las vistas deben incrementarse de forma atómica sin permitir que un cliente manipule directamente el contador. Separar lectura pública de datos administrativos y revisar permisos de Storage. Evitar caché que oculte cambios recientes del catálogo y medir el comportamiento real. Las imágenes temporales `blob:` no son archivos almacenados. Revisar accesibilidad, móvil y errores reales al integrar.
