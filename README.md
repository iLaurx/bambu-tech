# Bambu Tech

Catálogo de electrónica con panel privado, desarrollado con Next.js y Supabase. La aplicación está en `bambu-tech-app/`.

## Demostración local

La demostración muestra tres productos y precios de ejemplo con imágenes locales. Es independiente de Supabase: el panel y WhatsApp están deshabilitados y los datos no se guardan. Está disponible solo en desarrollo; no crea productos en una base ni los publica. Consulta [la guía de demostración](bambu-tech-app/docs/DEMOSTRACION.md).

## Instalación

Se necesita Node.js compatible con la versión de Next.js del proyecto y pnpm 12.3.4. Desde `bambu-tech-app/`:

```powershell
pnpm install --frozen-lockfile
```

Para iniciar con un proyecto Supabase propio, copia `.env.example` como `.env.local` en esa carpeta y configura las variables indicadas abajo. Luego ejecuta `pnpm dev` y abre `http://localhost:3000`.

## Configuración privada

| Variable | Contenido |
| --- | --- |
| `APP_ORIGIN` | Origen exacto de la aplicación sin barra final; en producción debe usar HTTPS. |
| `SUPABASE_URL` | URL del proyecto Supabase propio. |
| `SUPABASE_PUBLISHABLE_KEY` | Clave publicable o clave `anon` del proyecto. |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave privilegiada solo para el servidor. Nunca exponerla al navegador ni compartirla. |

No subas `.env.local` ni incluyas credenciales en el código, capturas o mensajes. Las variables de producción se configuran en el alojamiento; las variables locales no se copian automáticamente. Cada persona debe utilizar sus propias credenciales y su propio proyecto.

## Base de datos y administrador

1. En un proyecto Supabase propio y autorizado, revisa y aplica una sola vez la migración `bambu-tech-app/supabase/migrations/202611060001_backend.sql`. No la ejecutes sobre datos existentes sin revisar compatibilidad; no es una migración repetible.
2. Mantén privado el bucket `bambu-products` y desactiva el registro público de Auth. Crea la cuenta administradora en Supabase Auth y registra únicamente su UUID existente en `private.admin_users` mediante un operador autorizado. La tabla privada no permite que el usuario se otorgue permisos desde la aplicación.
3. Configura en Supabase Auth la dirección del sitio y permite exactamente la dirección de retorno formada por `APP_ORIGIN` seguido de `/api/auth/callback`. En producción usa una dirección HTTPS. Comprueba la entrega de correos de recuperación con el proveedor configurado y abre el enlace en el mismo navegador que inició la solicitud.
4. Inicia sesión en `/admin` y configura el número de WhatsApp desde el panel. Sin número configurado, el contacto permanece deshabilitado. Los productos reales se agregan desde el panel; la demostración no los importa.

Para el paso 2, copia el UUID de la cuenta que creaste en Auth y, en el editor SQL del proyecto propio, sustituye el marcador antes de ejecutar:

```sql
insert into private.admin_users (user_id)
values ('UUID-DE-LA-CUENTA-AUTORIZADA'::uuid)
on conflict (user_id) do nothing;
```

Confirma que el UUID pertenece a la persona autorizada antes de ejecutar. La sentencia no crea la cuenta Auth ni asigna permisos a otros usuarios.

El almacenamiento usa hasta 4 MiB por imagen y hasta una portada con tres imágenes secundarias. Los productos agotados activos siguen visibles; ocultar y agotar son acciones distintas.

## Despliegue

Para Vercel, selecciona `bambu-tech-app` como directorio raíz y configura las cuatro variables en el servidor. `APP_ORIGIN` debe coincidir exactamente con la dirección HTTPS principal; otras direcciones o previews requieren configuración propia y no deben compartir claves privilegiadas sin revisar su acceso. Comprueba tipos y compilación por separado, y verifica acceso, recuperación, catálogo e imágenes en el entorno de destino antes de compartirlo. La configuración de producción no activa la demostración.

## Comprobaciones

Desde `bambu-tech-app/`:

```powershell
pnpm typecheck
pnpm test:backend
pnpm test:admin
pnpm test:catalog
pnpm build
```

Las pruebas de navegador del panel (`pnpm test:admin:browser`) y catálogo (`pnpm test:catalog:browser`) usan servicios simulados y requieren Chrome instalado; consulta sus archivos antes de ejecutarlas. No ejecutarlas simultáneamente cuando comparten recursos. La compilación ignora errores de TypeScript en su configuración, por lo que `pnpm typecheck` es obligatorio por separado. Las pruebas reales de Supabase necesitan configuración y autorización expresas.
