# Panel de administración — entrega del prompt 3

Raíz de ejecución: `bambu-tech-app/`. Esta entrega conecta el panel existente al contrato de `docs/BACKEND.md`; conserva el diseño, colores y componentes del proyecto. No hay cambios en el catálogo público ni en su arreglo de ejemplos. No se creó infraestructura, cuenta ni migración, no se enviaron correos de prueba y no se cambió ninguna contraseña real.

## Acceso y rutas

- `/admin/login`: correo/contraseña mediante `POST /api/auth/login`; solo una cuenta autorizada obtiene acceso. No hay registro público ni claves Supabase en componentes cliente.
- `/admin/recovery`: solicitud explícita mediante `POST /api/auth/recovery`. La respuesta es genérica; no confirma existencia de cuenta, aceptación del proveedor o entrega. Abrir el enlace en el mismo navegador que inició la solicitud para conservar PKCE.
- `/api/auth/callback` conserva su contrato y redirige a `/admin?recovery=1`; el panel presenta el formulario de contraseña con confirmación, longitud de 12 a 128 caracteres y errores de servidor. También se puede abrir desde «Cambiar contraseña».
- El proxy permite únicamente las páginas públicas exactas `/admin/login` y `/admin/recovery`. Las demás rutas administrativas comprueban sesión/membresía. Sin sesión redirigen con 303 a login; sin configuración o sin permisos permanecen cerradas. Las API mantienen 401/403 y autorización de servidor/RLS.
- Login y cambio de contraseña usan formularios POST explícitos y controles deshabilitados hasta que JavaScript está listo, evitando enviar credenciales por una navegación GET previa a la hidratación. No se guardan contraseñas en almacenamiento del navegador.
- «Cerrar sesión» termina la sesión del navegador actual y vuelve al acceso. No se trata como éxito un cierre que falla.

La expiración/revocación observada por una API muestra error y deshabilita las acciones generales. El formulario y las cargas fallidas ofrecen dentro del diálogo un enlace de acceso en otra pestaña: el borrador permanece abierto; al volver se comprueba sesión y se puede reintentar. No se promete recuperación del borrador después de cerrar/recargar la pestaña; no se persistieron datos privados en localStorage.

## Inventario y ajustes

- Carga de sesión, lista completa, cuatro métricas de servidor y ajustes. Hay estados de carga, vacío, error y botón Actualizar. Un fallo no se convierte en un inventario ficticiamente vacío ni en métricas cero.
- Tabla con imagen, título, marca, condición, categoría, precio MXN con centavos, vistas, visibilidad, agotado y acciones. En móvil la tabla desplaza internamente y los títulos largos se truncan con texto completo disponible en su título.
- Visibilidad y agotado son controles independientes. Los valores no cambian localmente como si se hubieran guardado hasta recibir confirmación del servidor. Las métricas se vuelven a leer de la operación autorizada.
- Crear/editar con título, marca libre, cinco categorías, dos condiciones, precio positivo de hasta dos decimales, descripción y especificaciones opcionales por categoría. Cambiar categoría elimina claves incompatibles; no inventa memoria, batería o desbloqueo. Un booleano falso se conserva.
- El número de WhatsApp se normaliza y valida con el validador compartido. Vacío permite deshabilitar contacto. Solo se muestra éxito tras persistencia del servidor.
- Eliminar requiere confirmación; se usa eliminación lógica del backend y se informa que los archivos se conservan. El diálogo permanece abierto si la operación falla.
- Los bloqueos síncronos y estados pendientes evitan dobles envíos y acciones incompatibles. El cambio de contraseña comparte el bloqueo general para impedir logout o ajustes simultáneos.

Cada alta reserva un UUID antes de las fotos. Si una respuesta de creación se pierde o devuelve conflicto, se consulta el inventario por ese UUID: cuando ya existe, se conserva el formulario y el siguiente guardado confirma una edición, sin generar un segundo producto. No hay reintentos automáticos de escrituras ambiguas.

## Fotos

`MAX_IMAGE_BYTES` del contrato fija 4 MiB por archivo. Se permite una portada y hasta tres secundarias JPEG/PNG/WebP. La selección rechaza formatos/tamaños/cantidades incompatibles; el servidor sigue siendo quien verifica contenido, permisos y salida WebP.

Los archivos se suben secuencialmente por `/api/admin/uploads/:productId`, con identidad del usuario. No hay URLs externas ni referencias blob guardadas como si fueran persistentes. Una carga parcial conserva las referencias exitosas y los archivos pendientes en memoria para reintentar. Se puede elegir portada y retirar referencias del formulario. No se borran objetos remotos al cancelar, reemplazar o retirar una foto; los objetos retenidos requieren la política futura de limpieza aprobada.

Las imágenes se muestran mediante la ruta autorizada del backend con `<img>` para conservar cookies y evitar optimización/caché que eluda permisos. Guardar producto no vuelve a cargar las fotos ya registradas.

## Archivos y responsabilidades

- `app/admin/page.tsx`, `app/admin/login/page.tsx`, `app/admin/recovery/page.tsx`: entradas del panel y sus metadatos.
- `components/admin/`: dashboard, acceso, contraseña, ajustes, tabla, métricas, formulario, fotos, confirmación, cliente de API y conversión de valores.
- `proxy.ts`: únicamente excepciones públicas exactas y redirección de ausencia de sesión; conserva cookies de renovación y fallos cerrados.
- `next.config.mjs`: flag fijo `BAMBU_ADMIN_TEST=1` aísla compilados del servidor de pruebas en `.test-artifacts/next-admin`. Sin ese flag, la app sigue usando `.next`.
- `tests/admin/`: cinco pruebas de conversión/cliente y suite de navegador con servicios falsos locales. Playwright es dependencia de desarrollo; usa Chrome instalado, sin descargar otro navegador.
- `tests/backend/supabase-live.mjs`: expectativa de `/admin` anónimo actualizada a 303/login, sin ejecutar nuevamente el runner remoto ni cambiar las expectativas 401 de API.

El catálogo público sigue pendiente del prompt 4. «Ver tienda» abre el prototipo actual; esta entrega no afirma que ya muestre cambios del panel.

## Verificación

Desde la raíz de la app:

```powershell
pnpm test:backend
pnpm test:admin
pnpm test:admin:browser
pnpm typecheck
node node_modules/next/dist/bin/next build --webpack
```

Si pnpm se detiene comprobando políticas de red, los equivalentes locales son:

```powershell
node --import tsx --test tests/backend/validation.test.ts tests/backend/images.test.ts tests/admin/forms.test.ts
node tests/admin/browser.mjs
node node_modules/typescript/bin/tsc --noEmit --incremental false
```

El runner de navegador requiere el puerto 3110 libre. Levanta un servidor Auth/RPC local con identidades sintéticas, inyecta configuración falsa en su servidor Next propio e intercepta la API del navegador. No carga `.env.local` en el proceso de prueba ni usa el proyecto Supabase real. El servidor Next lee su archivo habitual, pero las variables de conexión ya están sustituidas explícitamente por las del mock. No se recuperan sesiones ni cookies del Firefox del usuario.

El ejecutable predeterminado es `C:\Program Files\Google\Chrome\Application\chrome.exe`; `TEST_CHROME_PATH` permite indicar otro Chromium instalado. Las capturas sin datos reales se guardan en `.test-artifacts/admin/`, ignorada por Git. El runner detiene únicamente su proceso/árbol de Next y el servidor mock; no toca el servidor del usuario en 3000. Next puede generar imports/includes del directorio aislado en `next-env.d.ts`/`tsconfig.json`; tras la prueba deben conservarse las rutas normales en la entrega.

Resultados al cierre:

- 17 pruebas locales (12 backend + 5 panel): aprobadas.
- 13 grupos de navegador: aprobados, incluyendo controles antes de hidratación y ausencia de credenciales en query; login antidupe; especificaciones; fotos/tamaño/reintento; preservación de borrador y UUID tras fallo; persistencia simulada tras recarga; estados y ajustes; sesión expirada con reautenticación sin cerrar diálogo; creación ambigua/409 reconciliada; eliminación confirmada; contraseña con confirmación y exclusión de acciones; móvil; logout/recuperación genérica; no administrador denegado y ausencia de errores JS.
- Tipos: aprobados por separado, también después de restaurar únicamente los imports/includes autogenerados de pruebas a sus rutas normales. Compilación final `node node_modules/next/dist/bin/next build --webpack`: aprobada; rutas de acceso/recuperación estáticas, panel/API dinámicos y proxy incluidos. El build sigue omitiendo validación de tipos por la configuración heredada; por eso tsc se ejecutó aparte.
- El coordinador verificó anónimamente en el servidor real existente: login/recovery 200 y admin 303 a login. No equivale a un recorrido administrativo real.

Las pruebas del panel usan respuestas simuladas: no prueban una cuenta real no administradora, expiración real del proveedor, entrega de nuevos correos, cambio de contraseña real ni fallos parciales reales de Storage. Las 30 pruebas de backend con Supabase real y la recuperación real previa están documentadas en `BACKEND.md`, pero no reemplazan el recorrido manual de esta nueva interfaz. Sigue pendiente probar login del usuario y CRUD desde el panel con datos de prueba autorizados, además de integración de catálogo y revisión final del MVP. No se publicó ni desplegó nada.

## Ajuste puntual de hidratación — 7 de noviembre de 2026

El aviso del usuario tras F5 en Firefox señaló el botón «Actualizar» del dashboard: React esperaba `disabled=true` y el DOM tenía el atributo ausente. El código inicia `loading=true` tanto en SSR como en el primer render del navegador; no se encontró un estado inicial dependiente de ventana, fecha o datos externos. Firefox documenta la restauración del estado dinámico `disabled` entre cargas, por lo que esa es una causa probable, no una reproducción confirmada. [Referencia MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/disabled).

Se añadió únicamente `autocomplete="off"` a ese botón para optar por no restaurar su estado. No se extendió al componente global de botones, no se usó `suppressHydrationWarning`, no se desactivó SSR y no se alteraron permisos, validación ni operaciones del panel.

La suite `tests/admin/browser.mjs` ahora captura advertencias de hidratación en consola y errores de página. Comprueba HTML autenticado sin JavaScript y su recarga con «Actualizando…» deshabilitado y `autocomplete=off`; después realiza tres recargas de Chrome con datos simulados y verifica habilitación al terminar la carga, sin avisos. Pasaron los **15 grupos de navegador**, además de **22 pruebas locales**, tipos por separado y compilación Webpack. Se conserva el recorrido anterior completo de regresión del panel. Firefox del usuario no fue automatizado y debe confirmar manualmente que el aviso ya no reaparece.
