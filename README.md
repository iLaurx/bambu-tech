# Bambu Tech

Catálogo de electrónica con panel privado, desarrollado con Next.js y Supabase. La aplicación está en `bambu-tech-app/`.

## Demostración local

La demostración muestra ocho productos y precios de ejemplo con imágenes locales. Es independiente de Supabase: el panel y WhatsApp están deshabilitados y los datos no se guardan. Está disponible solo en desarrollo; no crea productos en una base ni los publica. Consulta [la guía de demostración](bambu-tech-app/docs/DEMOSTRACION.md).

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

En el panel de tu proyecto Supabase, abre **Connect** para consultar la **Project URL** y la clave publicable, o entra a **Settings → API Keys** para ver las claves disponibles. Copia la URL sin añadir `/rest/v1`. La clave `sb_secret_...` (o la antigua `service_role`) corresponde a `SUPABASE_SERVICE_ROLE_KEY`: es privada y solo debe estar en el servidor. La clave `sb_publishable_...` (o la antigua `anon`) corresponde a `SUPABASE_PUBLISHABLE_KEY`.

No subas `.env.local` ni incluyas credenciales en el código, capturas o mensajes. Las variables de producción se configuran en el alojamiento; las variables locales no se copian automáticamente. Cada persona debe utilizar sus propias credenciales y su propio proyecto. Consulta [las claves de API de Supabase](https://supabase.com/docs/guides/getting-started/api-keys).

## Base de datos y administrador

### 1. Aplicar la migración

1. Abre tu proyecto en el [panel de Supabase](https://supabase.com/dashboard) y selecciona **SQL Editor → New query**.
2. En tu copia del proyecto, abre `bambu-tech-app/supabase/migrations/202611060001_backend.sql`, copia su contenido completo y pégalo en el editor SQL.
3. Confirma que elegiste el proyecto correcto y pulsa **Run**. El resultado debe indicar que la consulta se ejecutó correctamente.

Ejecuta esta migración **una sola vez** en una base nueva. Si ya la aplicaste o la base contiene datos, no la repitas sin revisar primero su compatibilidad. La migración crea las tablas, funciones, políticas y el bucket privado `bambu-products`; también deja el número de WhatsApp sin configurar.

### 2. Revisar Storage y desactivar el registro público

1. En el menú lateral, abre **Storage** y localiza el bucket **bambu-products**. Comprueba que sea **Private**, no público. No lo crees otra vez si la migración ya lo creó.
2. Abre **Authentication → Sign In / Providers**. En la configuración de usuarios, desactiva **Allow new users to sign up** y guarda. Así solo podrán iniciar sesión cuentas existentes; el administrador se crea desde el panel de Supabase, como se indica abajo.

La migración configura un límite de **4 MiB por imagen** para el bucket y acepta WebP; la aplicación valida las imágenes de entrada y las convierte antes de guardarlas. Cada producto admite una portada y hasta tres imágenes secundarias.

### 3. Crear la cuenta administradora

1. Ve a **Authentication → Users → Add user**. Elige la opción para crear un usuario, introduce el correo y la contraseña del administrador y confirma el correo de la cuenta según las opciones que muestre Supabase. No escribas la contraseña en el SQL ni la compartas.
2. En **Authentication → Users**, localiza la cuenta que acabas de crear y copia su **User UID / ID**. Confirma que corresponde al correo autorizado.
3. Vuelve a **SQL Editor → New query**. Pega la siguiente sentencia y sustituye únicamente `UUID-DE-LA-CUENTA-AUTORIZADA` por el UUID copiado; conserva las comillas. Después pulsa **Run**:

```sql
insert into private.admin_users (user_id)
values ('UUID-DE-LA-CUENTA-AUTORIZADA'::uuid)
on conflict (user_id) do nothing;
```

La sentencia agrega esa cuenta a `private.admin_users`. No crea la cuenta de Auth ni cambia contraseñas. Sin esta asignación, una cuenta válida no tiene acceso administrativo.

### 4. Configurar las direcciones de acceso y recuperación

En **Authentication → URL Configuration**:

- En **Site URL**, escribe el origen principal. Para desarrollo local puede ser `http://localhost:3000`; para la página publicada usa su dirección HTTPS, por ejemplo `https://tu-proyecto.vercel.app`.
- En **Redirect URLs**, agrega la dirección completa de retorno. Para el ejemplo local es `http://localhost:3000/api/auth/callback`; para la página publicada sería `https://tu-proyecto.vercel.app/api/auth/callback`. Conserva ambas si usarás ambos entornos y guarda los cambios.

En cada entorno, `APP_ORIGIN` debe coincidir exactamente con su propia dirección, sin `/` final; el callback se forma añadiendo `/api/auth/callback`. Comprueba la recuperación abriendo el correo en el mismo navegador que inició la solicitud. El correo predeterminado de Supabase tiene restricciones de destinatarios y frecuencia; consulta [su documentación de SMTP](https://supabase.com/docs/guides/auth/auth-smtp) antes de depender de él.

### 5. Configurar WhatsApp y cargar productos

Inicia la aplicación, abre `/admin` y entra con la cuenta autorizada. En el panel, busca **Contacto de la tienda**, escribe el **Número de WhatsApp** con `+` y código de país, y pulsa **Guardar WhatsApp**. Sin número configurado, el contacto permanece deshabilitado. Agrega los productos reales desde el panel: la demostración no los importa.

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
