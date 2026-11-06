# Diagnóstico inicial de la aplicación

Revisión estática del código disponible el 6 de noviembre de 2026. No se arrancó la aplicación, no se ejecutaron compilación ni pruebas y no se verificaron servicios remotos. Las afirmaciones describen el código inspeccionado, no un despliegue.

## Ubicación y stack

Raíz de la app: `drive-download-20261102T005900Z-1-001/bambu-tech-e-commerce-app_latest/`. El directorio superior también contiene el ZIP original y un DOCX de requisitos. El paquete incluye `node_modules`, `.next` y lockfile; su presencia no demuestra que la app compile o funcione. No se ha confirmado un repositorio Git operativo.

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
