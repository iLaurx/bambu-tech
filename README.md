# Bambu Tech

Catálogo de electrónica con panel privado, desarrollado con Next.js y Supabase. La aplicación está en `bambu-tech-app/`.

## Demostración local

La demostración muestra ocho productos y precios de ejemplo con imágenes locales. Es independiente de Supabase: el panel y WhatsApp están deshabilitados y los datos no se guardan. Está disponible solo en desarrollo; no crea productos en una base ni los publica. Consulta [la guía de demostración](bambu-tech-app/docs/DEMOSTRACION.md).

## Instalación

Se necesita Node.js compatible con la versión de Next.js del proyecto y pnpm 12.3.4. Desde `bambu-tech-app/`:

```powershell
pnpm install --frozen-lockfile
```

Para conectar una base propia, sigue primero la configuración de Supabase y las variables de entorno descritas abajo.

## Base de datos y administrador

### Crear el proyecto en Supabase

Al crear un proyecto nuevo en el [panel de Supabase](https://supabase.com/dashboard), revisa la sección **Security** y selecciona:

| Opción | Selección | Para qué sirve |
| --- | --- | --- |
| **Enable Data API** | Activada | Permite que la aplicación se comunique con la base de datos mediante la API de Supabase. |
| **Automatically expose new tables** | Desactivada | Evita conceder automáticamente acceso mediante la Data API a las tablas nuevas. |
| **Enable automatic RLS** | Activada | Activa automáticamente la seguridad por filas en tablas nuevas del esquema público. |

La migración del siguiente paso activa RLS y define permisos y políticas para las tablas de Bambu Tech. No configura estas opciones generales del proyecto; la protección automática sirve además para tablas que se creen después. Consulta [cómo proteger la Data API](https://supabase.com/docs/guides/api/securing-your-api).

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

### 4. Obtener las claves y configurar el entorno local

1. En tu proyecto de Supabase, abre **Connect** para consultar la **Project URL** y la clave publicable. Copia la URL del proyecto sin agregar `/rest/v1`.
2. En **Settings → API Keys**, consulta las claves **Publishable** y **Secret**. También se admiten las claves antiguas `anon` y `service_role`, respectivamente. La clave secreta tiene acceso privilegiado: úsala solo en el servidor y no la compartas. Consulta [las claves de API de Supabase](https://supabase.com/docs/guides/getting-started/api-keys).
3. Dentro de `bambu-tech-app`, copia `.env.example` con el nombre `.env.local`. Edita el archivo y completa las siguientes variables con los datos de **tu propio proyecto**, sin espacios alrededor de `=`:

| Variable | Valor para desarrollo local |
| --- | --- |
| `APP_ORIGIN` | `http://localhost:3000`, sin `/` al final. |
| `SUPABASE_URL` | **Project URL** de Supabase. |
| `SUPABASE_PUBLISHABLE_KEY` | Clave **Publishable** (`sb_publishable_...`) o la antigua `anon`. |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave **Secret** (`sb_secret_...`) o la antigua `service_role`; solo para el servidor. |

No subas `.env.local` ni incluyas claves en el código, capturas o mensajes. El archivo local está ignorado por Git y no se copia automáticamente a Vercel.

### 5. Configurar las direcciones de acceso y recuperación

En **Authentication → URL Configuration** configura primero el acceso local. Si todavía no conoces la dirección de Vercel, vuelve a esta sección para agregar la dirección publicada después del paso 6:

- En **Site URL**, escribe el origen principal. Para desarrollo local puede ser `http://localhost:3000`; para la página publicada usa su dirección HTTPS, por ejemplo `https://tu-proyecto.vercel.app`.
- En **Redirect URLs**, agrega la dirección completa de retorno. Para el ejemplo local es `http://localhost:3000/api/auth/callback`; para la página publicada sería `https://tu-proyecto.vercel.app/api/auth/callback`. Conserva ambas si usarás ambos entornos y guarda los cambios.

En cada entorno, `APP_ORIGIN` debe coincidir exactamente con su propia dirección, sin `/` final; el callback se forma añadiendo `/api/auth/callback`. Comprueba la recuperación abriendo el correo en el mismo navegador que inició la solicitud. El correo predeterminado de Supabase tiene restricciones de destinatarios y frecuencia; consulta [su documentación de SMTP](https://supabase.com/docs/guides/auth/auth-smtp) antes de depender de él.

### 6. Configurar las variables en Vercel

Si vas a publicar la aplicación, crea o selecciona tu proyecto en Vercel e importa el repositorio. En la configuración del proyecto, selecciona **`bambu-tech-app`** como **Root Directory**. Antes de publicar, identifica en **Settings → Domains** cuál será la dirección HTTPS principal; Vercel también puede asignar un dominio `.vercel.app`.

1. Abre **Settings → Environment Variables**. No es necesario crear un entorno nuevo: elige **Production** en el selector de cada variable.
2. Agrega `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` y `SUPABASE_SERVICE_ROLE_KEY` con los valores de tu propio proyecto Supabase. Márcala como sensible si Vercel ofrece esa opción, especialmente la clave privilegiada.
3. Agrega `APP_ORIGIN` con la dirección HTTPS principal exacta, por ejemplo `https://tu-proyecto.vercel.app`, sin `/` final. Debe coincidir con la dirección configurada en el paso 5; agrega también su callback exacto a **Redirect URLs** en Supabase.
4. Guarda las variables e inicia el despliegue cuando hayas revisado la configuración. Los cambios en variables se aplican a nuevos despliegues; si ya desplegaste, crea un nuevo despliegue para aplicarlos. Consulta [variables de entorno en Vercel](https://vercel.com/docs/environment-variables).

**Importante:** `APP_ORIGIN` no debe terminar en `/`. Por ejemplo, `https://tu-proyecto.vercel.app` es correcto y `https://tu-proyecto.vercel.app/` es incorrecto. Una barra final hace que la aplicación considere inválida la configuración y puede mostrar «El servicio todavía no está configurado» al intentar iniciar sesión. Si la corriges en Vercel, haz un redeploy para aplicar el cambio; puedes seguir usando el mismo dominio principal asignado.

**Alternativa: importar varias variables a la vez.** En el formulario de variables de Vercel puedes pegar el contenido de un archivo `.env` para rellenar los campos; si la interfaz ofrece importar un archivo, también puedes seleccionarlo. Puedes partir de `bambu-tech-app/.env.example`, que contiene los nombres de las cuatro variables, pero **sus claves están vacías**: reemplázalas con los valores de tu propio proyecto Supabase. También puedes usar tu `.env.local` ya completado. En ambos casos, revisa las variables importadas antes de guardar: cambia `APP_ORIGIN` de `http://localhost:3000` a la dirección HTTPS principal de Vercel, selecciona **Production** y comprueba que las tres variables de Supabase tengan sus valores correctos. Nunca pegues este contenido en GitHub, capturas ni mensajes.

Estas variables solo deben asignarse a los entornos que las necesiten. Un **Preview** conectado a la misma base comparte productos y ajustes con producción; no añadas claves privilegiadas a vistas previas sin revisar sus permisos y su dirección.

### 7. Configurar WhatsApp y cargar productos

Para probar localmente, ejecuta `pnpm dev` desde `bambu-tech-app` y abre `http://localhost:3000/admin`. En la versión publicada, abre `/admin` en la dirección HTTPS principal. Entra con la cuenta autorizada; en el panel, busca **Contacto de la tienda**, escribe el **Número de WhatsApp** con `+` y código de país, y pulsa **Guardar WhatsApp**. Sin número configurado, el contacto permanece deshabilitado. Agrega los productos reales desde el panel: la demostración no los importa.

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
