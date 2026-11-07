# Plan de trabajo y prompts para agentes

## Seguimiento — 6 de noviembre de 2026

El prompt 5 pasó un flujo automatizado panel→catálogo con datos simulados, además de 22 pruebas locales y tipos. El usuario comunicó que comprobó visibilidad/ocultación del producto real y después canceló la prueba con ese producto: no reanudarla ni modificar sus datos sin nueva indicación. La evidencia y sus límites están en `ESTADO_ACTUAL.md` y `bambu-tech-app/docs/INTEGRACION.md`. No autoriza publicación.

Posteriormente el usuario informó inicio de sesión en computadora y celular, catálogo móvil, comprobación del mensaje WhatsApp y verificaciones con datos reales de edición, agotado, galería, métricas y persistencia tras recarga/cambio de sesión. Se registran como confirmaciones del usuario, sin observación independiente ni atribución de pruebas nuevas a la auditoría en curso. No revocan la cancelación anterior ni autorizan cambios sobre ese producto. Continúan pendientes renovación/expiración real, el resto de API administrativas con cuenta sin rol, errores parciales reales y HTTPS para credenciales en LAN.

Comprobación real informada por el agente de pruebas: cuenta Auth temporal sin rol creada bajo autorización; `admin_session=false` y 403 en `/admin`, `/api/admin/session` y login de la app. Se eliminó únicamente esa cuenta por su UUID exacto y su ausencia se confirmó con 404, sin tocar productos ni enviar correos. No se extiende esta evidencia a API que no fueron probadas ni se da por verificada renovación real de sesión.

El usuario aprobó mantener el contador actual, aceptando que los fallos de red pueden dejar vistas sin registrar. No hay reintentos automáticos ante escrituras ambiguas y no se garantiza un conteo completo de todas las aperturas. Este límite se considera conocido y aceptado, no bloqueante; no se planifica un cambio de código por este punto ni se declara una prueba nueva.

El prompt 4 está implementado y revisado: catálogo conectado a API real, filtros, agotados, detalle/galería/specs, WhatsApp y vistas. Guía `bambu-tech-app/docs/CATALOGO.md`. Aprobadas 22 pruebas locales, nueve grupos de catálogo, trece de regresión del panel, tipos, Webpack y revisión visual. Lecturas anónimas reales aprobadas con catálogo vacío y contacto configurado; recorridos con productos simulados. No se modificaron datos remotos, panel, permisos ni esquema. La publicación sigue sin autorización; el prompt 5 requiere el recorrido integrado real y los límites documentados.

El usuario solicitó comenzar por el prompt 2, aprobó el contrato, autorizó un agente backend y posteriormente la configuración y pruebas de su proyecto Supabase. Administrador y WhatsApp ya están configurados; hubo un permiso específico para probar recuperación por correo. Acuerdos en `CONTRATO_BACKEND.md`. No hay autorización de publicación. El coordinador revisa y mantiene documentación, sin implementar código.

El prompt 3 está implementado y revisado: acceso/recuperación, inventario persistente, métricas, WhatsApp, estados y fotos. Guía `bambu-tech-app/docs/PANEL.md`; sus 13 grupos de navegador simulado se volvieron a aprobar tras conectar el catálogo. Las comprobaciones reales posteriores de interfaz que comunicó el usuario se registran en el seguimiento del prompt 5, sin presentarlas como observación independiente de los agentes. No hubo nuevos correos, cambios de contraseña real ni mutaciones remotas por parte de los agentes en los prompts 3 y 4.

El prompt 2 tiene entrega backend revisada en `bambu-tech-app/docs/BACKEND.md`, incluyendo pruebas con Supabase real. Resultados y límites en `ESTADO_ACTUAL.md`. El usuario aprobó imágenes de 4 MiB; el panel futuro debe consumir ese máximo compartido y sustituir su validación original. No iniciar otros agentes sin autorización del usuario para esa siguiente tarea.

Verificado: proyecto Supabase configurado, registro público desactivado, 30 comprobaciones reales de API aprobadas y recuperación por correo/callback confirmada por el usuario en su navegador. Fixture de recuperación y contraseña temporal retirados. La cuenta real sin rol se comprobó posteriormente en los puntos enumerados arriba; renovación/expiración y cobertura de otras API con esa clase de identidad siguen pendientes, junto con los demás límites documentados. No se cambió contraseña. El usuario autorizó commits locales de reorganización y backend; no push ni despliegue.

## Cómo usar este plan

La aplicación está en `bambu-tech-app/`. Cada agente debe leer `AGENTS.md`, `MVP.md` y `ESTADO_ACTUAL.md` en la raíz de este espacio. Estos prompts son propuestas para que el usuario los asigne: no implican que los agentes ya hayan trabajado ni autorizan crear recursos externos. Antes de implementar, resolver las decisiones de `MVP.md` que afecten el contrato. Si faltan credenciales, preparar y probar lo posible localmente y reportar con precisión los bloqueos.

## Dependencias y coordinación

1. **Contrato y arquitectura**: definir primero modelo, seguridad y acuerdos de integración. Pedir al usuario decisiones de negocio pendientes; no generar cuentas ni tocar servicios.
2. **Datos y seguridad**: implementar tras acordar el contrato. Debe entregar migraciones, acceso a datos, políticas y una guía de entorno sin secretos. El contador requiere una operación atómica protegida contra escrituras arbitrarias.
3. **Panel** y **catálogo**: pueden avanzar en paralelo únicamente con el contrato estable y responsables de archivos definidos. Panel trabaja en `components/admin/` y rutas administrativas; catálogo en `components/catalog*`, `components/product*` y ruta pública. El contrato y archivos compartidos (`lib/`, dependencias, configuración y esquema) tienen un solo responsable acordado; el integrador aplica cambios comunes.
4. **Integración y verificación**: una vez disponibles ambas partes, comprobar recorridos completos y corregir incompatibilidades; no declarar terminado sin evidencia de una configuración real de prueba.

Entregables de cada agente: cambios precisos, comandos y resultados, qué quedó sin probar, variables requeridas sin valores, decisiones y riesgos. Si no hay Git operativo, no asumir ramas ni crear un repositorio sin instrucción. Al coordinar trabajo simultáneo, evita ediciones concurrentes en los mismos archivos y no mezcles cambios ajenos.

## Prompt 1 - Contrato y arquitectura

```text
Actúa como arquitecto técnico para Bambu Tech. Lee AGENTS.md, MVP.md y ESTADO_ACTUAL.md y revisa el código existente. No programes ni crees recursos remotos en esta tarea. Diseña un contrato concreto y mínimo de datos, operaciones, autenticación, autorización, Storage y contador de vistas alineado con el PDF y señala cómo adaptar el modelo actual sin inventar datos. Distingue explícitamente decisiones ya exigidas por el PDF de propuestas y preguntas para el usuario. Define interfaces para agentes de panel y catálogo, responsables de archivos y orden de integración. Incluye medidas para garantizar que solo productos activos sean públicos, que un agotado activo permanezca visible y que el contador no admita asignación arbitraria. Analiza opciones y limitaciones sin afirmar que un plan gratuito garantiza costo cero. Entrega el plan y las decisiones bloqueantes antes de cualquier implementación.
```

## Prompt 2 - Datos, autenticación y almacenamiento

```text
Actúa como agente de backend para Bambu Tech. Lee AGENTS.md, MVP.md, ESTADO_ACTUAL.md y el contrato acordado; inspecciona primero el estado actual. Implementa solo la base de datos, acceso a datos, autenticación y autorización de servidor, configuración y almacenamiento definidos por el contrato. Prepara migraciones reproducibles para Supabase, políticas de acceso para datos y archivos y un incremento atómico de vistas que no permita escrituras arbitrarias; protege todas las mutaciones. Mantén is_active e is_sold independientes; aplica validaciones de entrada e imágenes y no expongas claves privilegiadas. Documenta variables y puesta en marcha sin secretos. No crees proyectos, usuarios, buckets remotos ni despliegues sin autorización expresa. Comprueba lo que sea posible y distingue verificaciones locales de pruebas reales con Supabase; entrega contratos y archivos para los agentes de interfaz.
```

## Prompt 3 - Panel de administración

```text
Actúa como agente del panel de Bambu Tech. Lee AGENTS.md, MVP.md, ESTADO_ACTUAL.md y el contrato aprobado. Inspecciona el panel actual y conserva su diseño donde sea compatible. Implementa el acceso privado y la interfaz de gestión usando exclusivamente las operaciones autorizadas del contrato: ajustes WhatsApp, cuatro métricas, tabla completa, controles independientes de visibilidad y agotado, alta, edición y eliminación confirmada, descripción y especificaciones por categoría, portada y hasta tres fotos secundarias. Incluye validación, errores, estados de carga y persistencia; no consideres seguro solo ocultar controles. Coordina cualquier cambio de archivos compartidos con el integrador. No crees servicios externos ni uses credenciales reales sin autorización. Prueba los flujos posibles, explica limitaciones y entrega instrucciones para integrarlos.
```

## Prompt 4 - Catálogo público

```text
Actúa como agente del catálogo público de Bambu Tech. Lee AGENTS.md, MVP.md, ESTADO_ACTUAL.md y el contrato aprobado. Adapta la interfaz actual para obtener productos y configuración reales mediante el contrato, sin asumir que la copia del panel es la fuente de verdad. Implementa búsqueda dinámica, categorías, marca y precio combinables, tarjetas y detalle apropiados a cada categoría, galería, precios MXN, enlace WhatsApp con nombre y precio y contador por apertura mediante la operación autorizada. Solo productos activos se muestran; los activos agotados permanecen visibles con su distintivo. Maneja datos ausentes, errores y vacíos sin inventar especificaciones. Mantén accesibilidad y diseño adaptable. Coordina cambios compartidos y prueba los comportamientos con evidencia, indicando cualquier dependencia de servicios sin configurar.
```

## Prompt 5 - Integración y verificación

```text
Actúa como agente integrador y de calidad de Bambu Tech. Lee AGENTS.md, MVP.md, ESTADO_ACTUAL.md, el contrato acordado y los informes de los demás agentes. Inspecciona los cambios reales y resuelve incompatibilidades dentro del alcance autorizado. Verifica que las lecturas públicas, autorizaciones de servidor y políticas de base/Storage coincidan. Comprueba crear, editar, publicar, ocultar, agotar y eliminar; recarga y cambia de sesión para verificar persistencia; revisa imágenes y configuración de WhatsApp; filtros, categorías, detalle, incremento concurrente de vistas y métricas. Ejecuta comprobación de tipos y compilación por separado, además de pruebas pertinentes y revisión móvil/escritorio. Identifica pruebas no ejecutadas, dependencia de servicios y riesgos; no afirmes que el MVP está terminado sin cubrir sus criterios. No despliegues ni crees recursos externos sin autorización.
```

## Prompt para iniciar una sesión de coordinación

```text
Quiero avanzar Bambu Tech hacia el MVP. Lee AGENTS.md, MVP.md, ESTADO_ACTUAL.md y PLAN_AGENTES.md en la raíz del espacio y revisa el estado real de la app. Actúa como coordinador: no escribas código directamente; propón y delega tareas delimitadas solo si te autorizo agentes de implementación, identifica dependencias y contratos y revisa sus entregas. Comienza por el prompt 1 y presenta las decisiones que requieren mi respuesta. No publiques ni crees recursos externos sin mi autorización. Informa qué está verificado y qué sigue pendiente.
```
