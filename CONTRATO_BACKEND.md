# Contrato backend — prompt 2

Estado: contrato aprobado por el usuario el 6 de noviembre de 2026, backend implementado y probado en su proyecto Supabase expresamente autorizado. La app se ejecuta desde `bambu-tech-app/`. El usuario creó su administrador y aplicó SQL; también autorizó las pruebas y recuperación por correo. No hay autorización para otros proyectos, gastos, publicación o push. Firmas y rutas para los agentes de interfaz en `bambu-tech-app/docs/BACKEND.md`.

Entrega local revisada: `bambu-tech-app/docs/BACKEND.md` contiene las firmas, rutas, errores, especificaciones, configuración y evidencias. Tipos, 12 pruebas de entradas/imágenes y nueve comprobaciones HTTP aprobados; migración/RLS y 400 incrementos concurrentes aprobados en PostgreSQL aislado con Auth/Storage simulados. Build alternativo Webpack aprobado, Turbopack pendiente por fallos del entorno. No equivale a integración con Supabase real ni a interfaz conectada. El usuario aprobó posteriormente reducir el máximo de imágenes a 4 MiB (4,194,304 bytes), tanto para entrada como para archivo WebP de salida, para quedar por debajo del límite de 4.5 MB de Vercel Functions. Sustituye el acuerdo inicial de 5 MiB; no autoriza despliegue.

## Decisiones aprobadas

Actualización de alcance: el usuario creó el proyecto y la cuenta administrativa, aplicó migración/finalización en SQL Editor y guardó claves en `.env.local` ignorado por Git. Se verificaron dos sesiones, permisos, CRUD persistente, imágenes y métricas en 30 comprobaciones reales, además de 12 pruebas locales y tipos/build Webpack. Registro público desactivado. El usuario confirmó recepción y callback de recuperación con acceso autorizado; no se cambió contraseña. Renovación/expiración de sesión aún no forzada. Los archivos temporales de prueba y la contraseña temporal se retiraron.

- Supabase PostgreSQL/Auth/Storage y Next.js; sin registro público. Administradores mediante lista explícita de UUID de Auth, gestionada fuera del panel. Ningún usuario puede darse permisos a sí mismo. Sesión persistente, cierre de sesión y recuperación por correo sujetos a configuración real del servicio.
- `products`: UUID, título, cinco categorías y dos condiciones del MVP, marca editable, precio MXN positivo con hasta dos decimales, descripción, `specs` JSONB validado por categoría, portada y hasta tres secundarias, `is_active`, `is_sold`, vistas y fecha. Datos desconocidos ausentes; color opcional dentro de specs. Definir y publicar claves, tipos y límites concretos antes de conectar interfaces.
- Filtros de marca derivados del inventario público; intervalos de precio sin solapamientos.
- Eliminación lógica mediante un campo independiente de visibilidad y agotado. Excluir eliminados de catálogo, listado ordinario y métricas. Conservar archivos; no implementar purga definitiva.
- Imágenes JPEG/PNG/WebP, máximo 4 MiB cada una, incluida la salida WebP. Validar contenido, tipo, tamaño, referencias y propiedad en servidor; Storage restringe acceso y escritura. No aceptar URLs arbitrarias como archivos persistidos.
- Conservar los nueve ejemplos solo como semilla de desarrollo explícita, nunca como inventario real automático.
- `settings`, id único 1: WhatsApp internacional normalizado. Si falta, contacto deshabilitado; permitir consultas de agotados. No adoptar el número fijo actual sin confirmación.
- Administrador, WhatsApp y proyecto de prueba ya fueron indicados y configurados; las claves permanecen únicamente en configuración local ignorada. No solicitar secretos en chat.

## Operaciones y límites

- Público: listar y consultar únicamente productos activos y no eliminados, incluidos agotados; leer exclusivamente ajustes públicos necesarios; incrementar vistas por apertura de detalle.
- Vistas: operación atómica de incremento en uno, solo sobre producto activo no eliminado; no acepta valor/delta arbitrario ni concede UPDATE general. Restringir permisos de ejecución y funciones privilegiadas; documentar límite frente a visitas automatizadas, sin prometer analítica deduplicada. Fallo del contador no debe impedir navegar.
- Admin: verificar sesión y membresía en servidor para cada lectura privada y mutación; repetir restricciones mediante RLS y políticas de Storage. Listar activos, ocultos y agotados no eliminados; crear/editar, cambiar estados independientemente, eliminar lógicamente, gestionar WhatsApp y obtener cuatro métricas del MVP.
- Métricas sobre no eliminados: total; disponibles = activos y no agotados; agotados = todos los agotados; suma de vistas.
- Archivos privados por defecto. Entregar imágenes públicas solo cuando correspondan a productos activos no eliminados, con lecturas privadas autorizadas para admin. Documentar caducidad/caché y límites de revocación de URLs temporales; no dar SELECT público irrestricto al bucket. Evitar fugas de archivos ocultos por acceso directo.
- Carga y asociación con tratamiento explícito de fallos parciales. No sobrescribir objetos compartidos ni borrar automáticamente archivos remotos. Referencias nuevas deben corresponder a objetos autorizados y validados.
- Validación en servidor, errores comprensibles sin secretos, protección de mutaciones frente a solicitudes no autorizadas y rechazo de campos de sistema (vistas, permisos, fechas) en entradas editables.
- Entregar DTO públicos/admin, entradas, respuestas y errores estables para panel y catálogo; distinguir dato ausente de error de configuración. Sin servicio configurado, fallar de forma cerrada para administración.

## Responsabilidad y verificación

Un agente backend es dueño de migraciones, módulos backend/contrato compartido, rutas de servidor, dependencias y configuración estrictamente necesarias, documentación y pruebas de seguridad pertinentes. No modificar componentes de interfaz ni conectar las páginas del catálogo/panel en esta etapa. No rediseñar ni añadir funciones fuera del MVP.

El coordinador no escribe código: revisa cambios y evidencia; puede mantener documentación. Panel y catálogo esperan el contrato final. Preservar archivos ajenos, incluidos archivos sin seguimiento en la raíz del espacio.

Entregar comandos y resultados, variables sin valores, guía de aplicación local/remota pendiente, pruebas positivas y negativas de autorización, estados, validación e incremento concurrente cuando haya entorno disponible. Comprobar tipos y compilación por separado. Distinguir pruebas estáticas/unitarias de pruebas reales de PostgreSQL/Auth/Storage. No declarar MVP completo ni permisos verificados remotamente por una compilación.
