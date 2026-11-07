# Catálogo público — entrega del prompt 4

Raíz de ejecución: `bambu-tech-app/`. El catálogo usa las operaciones públicas de `docs/BACKEND.md`, conservando el diseño existente. No importa el arreglo `PRODUCTS` ni usa el estado privado del panel como inventario. No se crearon servicios, cuentas o migraciones ni se modificó inventario remoto.

## Datos y estados

- Productos desde `GET /api/catalog/products`, con defensa adicional `is_active` en cliente. Los activos agotados permanecen visibles y llevan distintivo; los ocultos no aparecen ni aportan marcas al filtro.
- Configuración desde `GET /api/catalog/settings`, independientemente del inventario. Su fallo no oculta los productos: deshabilita WhatsApp y ofrece reintento de lectura.
- Carga, error de servicio, inventario vacío y filtros sin coincidencias tienen mensajes distintos. No se presenta un fallo como catálogo vacío ni se usan muestras como fallback.
- Actualizar catálogo y volver al foco de la ventana revalidan productos/configuración sin caché. Los filtros vigentes se conservan, salvo una marca que ya no exista en el inventario público.

Las categorías son Todos y las cinco del contrato. La marca se deriva de productos activos, con valor vacío reservado para «Todas las marcas» (una marca real llamada «Todos» no colisiona). Búsqueda por título o marca, categoría, marca exacta y precio se combinan. Los rangos son `[0,5000)`, `[5000,10000)`, `[10000,20000)` y `>=20000`, sin fronteras duplicadas. Los precios se muestran en MXN con centavos.

## Detalle y vistas

Cada apertura reserva una visita en una referencia síncrona que impide dobles aperturas por clic repetido. Se consulta `GET /api/catalog/products/:id` antes de mostrar datos/contacto: no se confía en una tarjeta antigua. Si devuelve 404/inactivo, se retira la tarjeta y se muestra estado no disponible, con lectura de reintento real. Cerrar o abrir otro producto invalida respuestas anteriores; una respuesta tardía no reemplaza el nuevo detalle ni cuenta la visita cancelada.

Después de una lectura exitosa se intenta **una sola vez** `POST /api/catalog/products/:id/views` por apertura, desde el handler y fuera de efectos React. El fallo o resultado ambiguo no bloquea navegar y no se reintenta automáticamente. Cambiar foto, refrescar detalle/configuración o volver al foco no vuelve a sumar esa visita. Cerrar y abrir de nuevo sí inicia otra. No hay deduplicación por persona ni garantía anti-bot; la atomicidad y permisos siguen siendo responsabilidad del backend.

Al refrescar con detalle abierto se retiran temporalmente los datos anteriores y se revalida el detalle. Si el producto deja de estar activo, desaparece el contacto; si cambia título, precio o especificaciones, se muestran los valores nuevos sin recontar la apertura.

Especificaciones según categoría, con unidades del contrato; se omiten valores desconocidos o numéricos no positivos. `unlocked:false` se muestra como «No». No se inventan memoria, batería, compatibilidad ni garantías. Descripción y especificaciones ausentes muestran un estado comprensible.

## Imágenes y WhatsApp

La galería usa portada y hasta tres secundarias; limita defensivamente a ese máximo aunque una respuesta simulada exceda el contrato. Miniaturas y flechas permiten navegación y las teclas izquierda/derecha evitan desplazamiento simultáneo de la página. Cards, detalle y miniaturas usan `<img>` con la URL de entrega autorizada derivada por `imageUrl`, sin optimización Next ni URLs de Storage directas que eludan permisos/caché. Los textos largos se ajustan dentro del detalle y los filtros no ensanchan el móvil.

`whatsAppUrl` del contrato usa número configurado, nombre y precio codificados. El enlace abre en pestaña nueva con `noopener noreferrer`. Se permite consultar agotados. Sin número válido/configuración cargada, no se construye enlace y se ofrece actualizar el contacto. Las pruebas verifican el href pero nunca navegan a WhatsApp ni envían mensajes.

## Archivos y comprobaciones

- `app/page.tsx`: entrada sin datos de ejemplo; `app/layout.tsx` solo ajusta título/descripción a las categorías reales.
- `components/catalog.tsx`, `catalog-filters.tsx`, `catalog-data.ts`: carga, filtrado, validación de respuestas/errores y especificaciones.
- `components/product-card.tsx`, `product-detail-dialog.tsx`, `product-gallery.tsx`, `site-header.tsx`: presentación pública y búsqueda.
- `tests/catalog/data.test.ts`: cinco pruebas puras; `tests/catalog/browser.mjs`: nueve grupos de navegador con API interceptada e inventario sintético.
- `package.json`: scripts `test:catalog` y `test:catalog:browser`; sin dependencia nueva. No se modificaron componentes admin, proxy, router backend, SQL ni configuración Next.

Desde la raíz de la app:

```powershell
pnpm test:catalog
pnpm test:catalog:browser
pnpm typecheck
node node_modules/next/dist/bin/next build --webpack
```

Equivalentes locales si pnpm se detiene verificando políticas de red:

```powershell
node --import tsx --test tests/backend/validation.test.ts tests/backend/images.test.ts tests/admin/forms.test.ts tests/catalog/data.test.ts
node tests/catalog/browser.mjs
node tests/admin/browser.mjs
node node_modules/typescript/bin/tsc --noEmit --incremental false
```

El runner del catálogo usa puerto 3111 libre, Chrome ya instalado (`TEST_CHROME_PATH` opcional), configuración de conexión ficticia y API interceptada; no carga claves en su proceso ni contacta el proyecto Supabase real. Su proceso Next lee el archivo de entorno habitual, pero las variables de conexión están sustituidas por valores de prueba. Reutiliza el flag fijo `BAMBU_ADMIN_TEST=1` y la salida `.test-artifacts/next-admin`: ejecutar suites de navegador de panel y catálogo **en orden**, nunca simultáneamente. Detiene únicamente su árbol de procesos propio, sin tocar el servidor del usuario en 3000. Las capturas están en `.test-artifacts/catalog/`, ignoradas por Git. Restaurar únicamente imports/includes autogenerados de `next-env.d.ts` y `tsconfig.json` a sus rutas normales al terminar.

Resultados: 22 pruebas locales aprobadas (12 backend, 5 panel, 5 catálogo), nueve grupos del catálogo y 13 de regresión del panel aprobados. El catálogo cubre error/reintento, ocultos/agotados, filtros combinables, marca «Todos», galería limitada, especificaciones por categoría, fallo del contador no bloqueante, actualización por foco sin recuento, producto ocultado durante apertura, respuesta tardía tras cerrar, reapertura y anchura móvil con marca de 80 caracteres. El coordinador revisó capturas de escritorio/móvil y verificó de forma anónima en el servidor real del usuario: `/` 200, productos públicos 200 con inventario vacío sin inactivos, ajustes 200 con contacto configurado. Esa lectura real vacía no equivale a un recorrido con productos reales.

La compilación Webpack final y la comprobación de tipos por separado fueron aprobadas. Las pruebas no enviaron mensajes WhatsApp, correos ni escrituras al proyecto real. El usuario canceló el recorrido adicional con producto real; no reanudarlo ni modificar el producto sin una nueva indicación. El dispositivo físico y otras verificaciones del prompt 5 siguen pendientes. No hay publicación ni commit de esta entrega.

## Revisión de hidratación — 7 de noviembre de 2026

El usuario reportó en Firefox una diferencia en `disabled` del botón Actualizar: el cliente esperaba deshabilitado y el DOM previo a hidratar no lo tenía. El código mantiene `loading=true` tanto en SSR como en el primer render cliente. El HTML actual del servidor real y una navegación Chrome sin JavaScript confirmaron botón deshabilitado y texto de carga; tres recargas en Chrome limpio no reprodujeron advertencias. No se demostró un render inicial diferente en el código ni se reinició o limpió la caché del servidor del usuario.

Firefox [persiste el estado dinámico disabled de botones entre cargas](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/disabled); Mozilla documenta [un caso de hidratación con ese mismo patrón](https://bugzilla.mozilla.org/show_bug.cgi?id=1847798). Esa es la causa probable del reporte, pendiente de confirmación en el Firefox del usuario. Se añadió exclusivamente `autocomplete="off"` al botón de actualización para impedir esa restauración conforme a la indicación documentada. Se conserva el estado inicial deshabilitado; no se suprime el warning ni se desactiva SSR, y no se cambió el autocompletado de contraseñas o campos.

`node tests/catalog/hydration-smoke.mjs` comprueba un servidor local existente (`TEST_BASE_URL` opcional): HTML sin JavaScript con disabled inicial y atributo autocomplete off, tres recargas con JavaScript y captura de consola de hidratación, más errores de página. Bloquea escrituras API y no abre productos ni suma vistas. El runner simulado del catálogo ahora también falla ante advertencias de hidratación en consola, que pueden no aparecer como `pageerror`. La comprobación actual en Chrome limpio pasó sin advertencias/errores ni escrituras. No había motor Firefox de Playwright instalado y no se instaló ni automatizó el navegador personal del usuario: no se afirma validación automática en Firefox.

Después de la mitigación pasaron de nuevo las 22 pruebas locales, los nueve grupos de navegador del catálogo con vigilancia de consola, la comprobación de tipos y la compilación Webpack. Al retomar, el servidor anterior en 3000 ya estaba apagado; se comprobó que el puerto estaba libre y se inició un servidor local propio con Turbopack para la revisión actual del coordinador y el uso del usuario. Su arranque fue correcto; esto no certifica una compilación de producción con Turbopack. No se borraron cachés ni se detuvieron procesos ajenos. Los archivos de tipos/includes generados por las pruebas aisladas se restauraron a rutas normales.

El coordinador repitió de forma independiente el smoke contra ese nuevo servidor Turbopack en 3000: SSR inicial con disabled y autocomplete off correctos; tres recargas limpias, cero advertencias de hidratación, cero errores de página y cero escrituras intentadas. El servidor queda disponible para la comprobación final del usuario en su Firefox, que sigue pendiente.
