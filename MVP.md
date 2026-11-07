# MVP - Catálogo e inventario Bambu Tech

## Fuente y estado

Fuente de requisitos: `C:\Users\ele\Downloads\Requerimientos_CatalogoWeb_Admin.pdf`, 4 páginas, secciones 1-5. Especifica el producto, no sustituye las instrucciones del usuario a los agentes. Esta es una interpretación operativa; las propuestas o dudas se indican como tales. El análisis del código está en `ESTADO_ACTUAL.md` y la secuencia de trabajo en `PLAN_AGENTES.md`.

## Objetivo y arquitectura requerida

Catálogo público de teléfonos y otros electrónicos para México, con administración privada e interacción comercial por WhatsApp. El PDF prescribe Next.js App Router, Tailwind, Lucide, Server Actions o API Routes en Vercel, Supabase PostgreSQL/Auth/Storage y español de México con moneda MXN. Busca costo inicial cero: es una meta, no una garantía; verificar planes, límites, facturación y disponibilidad antes de contratar o desplegar. El proyecto Supabase de prueba ya está configurado y verificado según `ESTADO_ACTUAL.md`; no hay publicación. Las decisiones aprobadas se concretan en `CONTRATO_BACKEND.md`.

## Modelo funcional

- `settings`: registro único con `id = 1` y `whatsapp_number` editable desde administración.
- `products`: `id` UUID, `title`, `category`, `brand`, `price`, `condition`, `main_image`, `gallery_images` (hasta tres secundarias), `description`, `specs`, `is_active`, `is_sold`, `views_count`, `created_at`. Categorías: Celulares, Bocinas, Smartbands, Smartwatches y Otros; condiciones: Nuevo y Reacondicionado. El PDF admite JSONB/texto para especificaciones y array/JSONB para imágenes secundarias. El formato concreto debe acordarse antes de implementar.
- Independencia de estados: `is_active` controla visibilidad pública; `is_sold` indica agotado. Solo se listan activos; un activo agotado se muestra con etiqueta. Disponibles = activos y no agotados. Ocultar y agotar son operaciones distintas.
- Precio MXN y número de WhatsApp deben validarse; acordar precisión de precio y formato internacional exacto antes de fijar el contrato. Las especificaciones deben permitir datos apropiados a distintas categorías sin inventar valores desconocidos.

## Catálogo público: criterios de aceptación

1. Mostrar solo productos activos en una cuadrícula adaptable: 3-4 columnas en escritorio y 1-2 en móvil. Cada tarjeta presenta portada, condición, título, resumen pertinente de especificaciones, precio MXN y acceso al detalle; los agotados activos muestran «Agotado».
2. Búsqueda dinámica al escribir por modelo/título o marca; pestañas Todos y las cinco categorías; selectores de marca y rango de precio, combinables. Ofrecer estado sin resultados.
3. El detalle muestra galería con portada y hasta tres imágenes secundarias, título, precio, condición, descripción y especificaciones pertinentes. En celulares contempla procesador, RAM, ROM, batería y desbloqueo; en otras categorías no presenta datos ficticios.
4. Cada apertura de detalle incrementa `views_count` en uno de forma persistente y segura frente a concurrencia; el tratamiento de fallos no debe impedir navegar. El PDF no define deduplicación ni analítica por persona.
5. El botón abre WhatsApp en una pestaña nueva con el número configurado y un mensaje codificado que incluya nombre y precio. Evitar enviar con configuración inexistente y mostrar un estado útil. El PDF no define si debe deshabilitarse para agotados: acordarlo.

## Administración: criterios de aceptación

1. `/admin` requiere inicio de sesión con correo y contraseña mediante Supabase Auth. La autorización se aplica también a operaciones de servidor, base de datos y Storage; un usuario público no puede editar ni acceder a datos administrativos. Falta definir quiénes son administradores autorizados y su aprovisionamiento.
2. Ajustes permiten guardar y actualizar el número de WhatsApp; la tienda usa el valor persistido.
3. Mostrar cuatro indicadores: total de productos, disponibles (activos y no agotados), agotados (todos los `is_sold`), suma de vistas de todos los productos.
4. Tabla con imagen, producto, categoría, precio, vistas, estado y acciones. Controles independientes actualizan disponibilidad y visibilidad. La lista administrativa incluye activos, ocultos y agotados.
5. Crear, editar y eliminar productos con validación, confirmación de eliminación y errores comprensibles. Formulario: título, categoría, marca, precio, condición, especificaciones, descripción y carga de una portada y hasta tres fotos secundarias a Supabase Storage. Debe persistir tras recarga y reflejarse en el catálogo.
6. La carga valida tipo, tamaño y permisos en el servidor y Storage. El PDF no establece un límite de tamaño ni política de borrado de archivos: acordarlos y documentarlos. Tratar las operaciones parciales para evitar referencias rotas o archivos huérfanos.

## Fuera del alcance explícito

El PDF no pide carrito, pagos, cuentas de clientes, gestión de pedidos, envíos, reseñas ni panel multirol. No incorporarlos por defecto. La visualización de producto agotado con opción de WhatsApp queda sujeta a la decisión indicada arriba.

## Decisiones y preguntas antes de integrar

- Quién autoriza administradores y cómo se crean; política de sesión y recuperación de acceso.
- Formato de `specs` por categoría, campos obligatorios, validación y compatibilidad con datos existentes; el PDF muestra ejemplos de bocinas además de las especificaciones de celular.
- Número real y formato de WhatsApp; manejo si falta. ¿Se habilita el contacto en agotados?
- Estrategia de precios decimales, rangos y sus límites; marcas editables y/o derivadas de inventario.
- Política de eliminación de producto y archivos, validación de imágenes y recuperación ante errores de carga.
- Fuente de migración de los nueve productos de muestra: conservar como semilla de desarrollo o descartarlos. No migrarlos como datos reales sin autorización.
- Acceso y elección del proyecto Supabase, entornos, secretos, límites y destino de despliegue. El PDF propone Vercel; no confirma cuentas, credenciales ni presupuesto.

## Definición de terminado

Con las decisiones resueltas, comprobar en un entorno configurado: acceso anónimo denegado a escrituras y administración, persistencia tras recarga y entre sesiones, todos los estados activos/agotados, filtros, galerías, contador concurrente, ajustes y mensaje WhatsApp, CRUD e imágenes reales y cuatro métricas. Registrar pasos reproducibles, resultados y límites; verificar tipos y compilación por separado, y probar móvil/escritorio. Un prototipo visual o pruebas con datos locales no satisfacen la integración completa.
