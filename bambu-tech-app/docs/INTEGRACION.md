# Integración — prompt 5

## Confirmaciones reales informadas por el usuario

El usuario comunicó que inició sesión en computadora y celular, revisó el catálogo desde el teléfono y comprobó el mensaje de WhatsApp. Además confirmó verificaciones con datos reales de edición de productos, agotado, galería, métricas y persistencia al recargar y cambiar de sesión, junto con la visibilidad y ocultación ya comunicadas anteriormente.

Estos resultados proceden del reporte del usuario. No fueron observados ni repetidos de forma independiente por el coordinador o el agente y no se atribuyen como pruebas nuevas a la auditoría en curso. No se afirma envío o entrega de mensajes WhatsApp a partir de la comprobación de su texto. Esta actualización solo registra la información; no ejecuta pruebas ni modifica aplicación, datos o servicios.

La prueba cancelada con el producto anterior sigue cancelada: no reanudarla ni cambiar sus datos sin una nueva indicación. Las confirmaciones posteriores no cambian ese límite.

## Comprobaciones automatizadas posteriores

Aprobaron tipos, compilación Webpack aislada y **15 grupos de navegador con servicios simulados**. La cobertura incluye rechazo 401 y reautenticación sin perder el borrador, fallo y reintento de carga, y rechazo del proxy a una identidad sin rol usando Auth falso.

La cobertura de la identidad sin rol corresponde al proxy simulado, no a las API administrativas con un usuario real no administrador. La carga fallida fue una respuesta simulada y no una avería de Storage real; tampoco se verificó expiración o renovación real de sesión. Estos resultados no cierran los pendientes siguientes.

## Comprobación posterior con una cuenta real sin rol

El agente de pruebas informó que creó bajo autorización una cuenta temporal de Supabase Auth sin rol administrativo y comprobó `admin_session=false`. Con esa identidad, `/admin`, `/api/admin/session` y el login de la app devolvieron 403. No se tocaron productos ni se enviaron correos.

La cuenta temporal se eliminó por su UUID exacto; una consulta posterior confirmó su ausencia con 404. No se afirma haber probado las demás API administrativas con esa identidad, ni se considera verificada la renovación o expiración real de sesión. Esta evidencia real se registra por separado de la suite con Auth falso.

## Decisión aprobada sobre el contador

El usuario decidió conservar el contador actual y aceptar la posible pérdida de vistas cuando falla la red. El cliente intenta incrementar una vez por apertura válida y no reintenta automáticamente una escritura cuyo resultado es ambiguo. Por ello algunas aperturas pueden no registrarse y el total puede ser inferior al real; si se pierde la respuesta, tampoco puede asegurarse desde el cliente si ese incremento quedó guardado.

Esta es una limitación conocida y aceptada, no un pendiente bloqueante. La decisión no modifica la implementación ni equivale a una prueba nueva de fallos de red.

## Pendientes de comprobación explícita

- Renovación y expiración real de sesiones.
- Cobertura del resto de API administrativas con una cuenta real sin rol; las comprobaciones anteriores solo cubrieron los puntos enumerados.
- Fallos parciales reales de carga de imágenes, asociación de referencias o guardado.
- HTTPS para el acceso con credenciales desde la red local; el modo HTTP de desarrollo no verifica esa protección.

Las verificaciones funcionales comunicadas no cierran estos puntos ni prueban por sí solas todos los criterios del MVP. No hay autorización de publicación derivada de este reporte.

## Acceso local desde la red

`pnpm dev:lan` inicia Next enlazado a `192.168.1.4`; muestra esa dirección en Network y permite probar desde el teléfono en la misma red. En este modo `localhost` no escucha: usa `http://192.168.1.4:3000` también en la computadora. El comando normal `pnpm dev` se conserva. La dirección depende de la red Wi-Fi: si cambia, hay que actualizar el script y las direcciones autorizadas para desarrollo. No ejecutes ambas modalidades simultáneamente en el puerto 3000.

La conexión HTTP en Wi-Fi no cifra contraseñas ni cookies. Para credenciales se necesita HTTPS. Este modo no es un despliegue ni cambia la configuración de producción.

## Recorrido automatizado local

`node tests/integration/browser.mjs` ejecuta un navegador Chrome con servidor Next y Auth falsos en `127.0.0.1:3112`, con datos sintéticos en memoria y las operaciones de la app interceptadas. Requiere Chrome instalado y puerto 3112 libre. Reutiliza `BAMBU_ADMIN_TEST=1` y `.test-artifacts/next-admin`; no ejecutar a la vez con otras suites de navegador que usan ese directorio. El proceso de prueba sustituye las variables de conexión por valores ficticios. No utiliza contraseñas, tokens o cookies del usuario, no navega a WhatsApp y no escribe en Supabase. Al finalizar detiene solamente los procesos de prueba.

Resultado de esta revisión: aprobado el recorrido crear producto oculto, comprobar que no se lista, publicar, abrir detalle y comprobar enlace WhatsApp y una vista, editar precio, agotar y conservar visibilidad, ocultar y eliminar lógicamente conservando la imagen simulada. El primer intento falló por un selector de botón en inglés que no coincidía con la etiqueta «Cerrar» y se corrigió únicamente la prueba.

También aprobaron 22 pruebas locales de backend/panel/catálogo y la comprobación de tipos. Este entorno simulado no verifica por sí mismo JWT reales, persistencia remota o RLS. Las 30 comprobaciones reales previas del backend están en `BACKEND.md`, pero no sustituyen el recorrido de interfaz con el usuario.

## Antecedente: verificación real interrumpida por el usuario

El usuario comunicó que creó un producto de prueba y comprobó personalmente que la visibilidad y ocultación se reflejaban en la tienda. El coordinador hizo lecturas públicas sin modificar datos y observó cero coincidencias tanto cuando se indicó oculto como en una lectura posterior al aviso de publicación; no se determinó la causa de esta diferencia. El usuario canceló expresamente esa prueba y pidió no modificar más el producto. No reanudar ni cambiar sus datos sin una nueva indicación.

En el momento de esa cancelación quedaban sin registrar las demás comprobaciones reales y el móvil físico. Las confirmaciones posteriores se incorporaron al inicio de este documento, con su procedencia y límites; no revocan la cancelación ni equivalen a una nueva prueba independiente. Los pendientes vigentes se enumeran arriba.
