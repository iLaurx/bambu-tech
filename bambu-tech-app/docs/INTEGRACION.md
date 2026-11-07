# Integración — prompt 5

## Acceso local desde la red

`pnpm dev:lan` inicia Next enlazado a `192.168.1.4`; muestra esa dirección en Network y permite probar desde el teléfono en la misma red. En este modo `localhost` no escucha: usa `http://192.168.1.4:3000` también en la computadora. El comando normal `pnpm dev` se conserva. La dirección depende de la red Wi-Fi: si cambia, hay que actualizar el script y las direcciones autorizadas para desarrollo. No ejecutes ambas modalidades simultáneamente en el puerto 3000.

La conexión HTTP en Wi-Fi no cifra contraseñas ni cookies. Para credenciales se necesita HTTPS. Este modo no es un despliegue ni cambia la configuración de producción.

## Recorrido automatizado local

`node tests/integration/browser.mjs` ejecuta un navegador Chrome con servidor Next y Auth falsos en `127.0.0.1:3112`, con datos sintéticos en memoria y las operaciones de la app interceptadas. Requiere Chrome instalado y puerto 3112 libre. Reutiliza `BAMBU_ADMIN_TEST=1` y `.test-artifacts/next-admin`; no ejecutar a la vez con otras suites de navegador que usan ese directorio. El proceso de prueba sustituye las variables de conexión por valores ficticios. No utiliza contraseñas, tokens o cookies del usuario, no navega a WhatsApp y no escribe en Supabase. Al finalizar detiene solamente los procesos de prueba.

Resultado de esta revisión: aprobado el recorrido crear producto oculto, comprobar que no se lista, publicar, abrir detalle y comprobar enlace WhatsApp y una vista, editar precio, agotar y conservar visibilidad, ocultar y eliminar lógicamente conservando la imagen simulada. El primer intento falló por un selector de botón en inglés que no coincidía con la etiqueta «Cerrar» y se corrigió únicamente la prueba.

También aprobaron 22 pruebas locales de backend/panel/catálogo y la comprobación de tipos. Este entorno simulado no verifica por sí mismo JWT reales, persistencia remota o RLS. Las 30 comprobaciones reales previas del backend están en `BACKEND.md`, pero no sustituyen el recorrido de interfaz con el usuario.

## Verificación real interrumpida por el usuario

El usuario comunicó que creó un producto de prueba y comprobó personalmente que la visibilidad y ocultación se reflejaban en la tienda. El coordinador hizo lecturas públicas sin modificar datos y observó cero coincidencias tanto cuando se indicó oculto como en una lectura posterior al aviso de publicación; no se determinó la causa de esta diferencia. El usuario canceló expresamente esa prueba y pidió no modificar más el producto. No reanudar ni cambiar sus datos sin una nueva indicación.

Las comprobaciones reales restantes, el móvil físico y otros límites deben registrarse si el usuario decide retomarlos. No afirmar MVP terminado únicamente por las comprobaciones simuladas o por la verificación comunicada de visibilidad.
