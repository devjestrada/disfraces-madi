# Documento de Especificación de Requerimientos (DER)
## Módulo de Administración — Disfraces Madi

**Versión:** 1.1
**Fecha:** 14 de julio de 2026
**Autor:** Equipo de Producto / Análisis de Sistemas
**Base de datos:** Supabase (PostgreSQL)

---

## 1. Introducción

### 1.1 Propósito
Este documento especifica los requerimientos funcionales y no funcionales para el desarrollo de un **módulo de administración web** (panel/backoffice) que permita gestionar la información contenida en la base de datos Supabase del sitio "Disfraces Madi", incluyendo la **carga, gestión y organización de imágenes** de cada disfraz.

### 1.2 Alcance
El módulo permitirá a usuarios administradores autenticados realizar operaciones CRUD (Crear, Leer, Actualizar, Eliminar) sobre todas las entidades del negocio: categorías, diseñadores, disfraces, detalles, telas, accesorios, tallas, imágenes, reseñas, estadísticas del sitio, información de contacto, horarios de atención y activos del sitio (site assets). No incluye el sitio público de cara al cliente (frontend de catálogo), que se asume ya existe o se desarrolla por separado.

### 1.3 Definiciones y Referencias
| Término | Descripción |
|---|---|
| RLS | Row Level Security de PostgreSQL/Supabase |
| Storage Bucket | Almacenamiento de archivos binarios de Supabase |
| Costume | Disfraz (entidad central del dominio) |
| Anon role | Rol público sin autenticación en Supabase |
| Service/Admin role | Rol con privilegios elevados usado por el backend administrativo |

### 1.4 Fuentes
Este documento se basa en el análisis de los scripts SQL: `001_init.sql` (esquema), `002_seed.sql` (datos de ejemplo), `003_views.sql` (vistas y triggers) y `004_rls.sql` (políticas de seguridad).

---

## 2. Descripción General

### 2.1 Contexto del sistema
Disfraces Madi es un negocio de alquiler/venta de disfraces de carnaval. La base de datos actual soporta un catálogo público de solo lectura (RLS habilitado, políticas `select` abiertas para `anon`). Actualmente **no existe ningún mecanismo de escritura administrado**: las políticas de INSERT/UPDATE/DELETE solo bloquean al rol `anon`, pero no hay una interfaz para que el personal del negocio gestione la información. Este módulo cubre ese vacío.

### 2.2 Usuarios del sistema
| Rol | Descripción |
|---|---|
| **Administrador** | Acceso total: gestión de catálogo, imágenes, reseñas, contenido del sitio y configuración |
| **Editor de contenido** *(opcional, futuro)* | Puede editar disfraces y subir imágenes, sin acceso a configuración sensible |

### 2.3 Entidades gestionables (según esquema)
- Categorías (`categories`)
- Diseñadores (`designers`)
- Disfraces (`costumes`) — entidad central
- Detalles del disfraz (`costume_details`)
- Telas (`fabrics`) y su relación con disfraces (`costume_fabrics`)
- Accesorios (`accessories`) y su relación con disfraces (`costume_accessories`)
- Tallas disponibles (`costume_sizes`)
- **Imágenes de disfraces (`costume_images`)** ⭐ foco especial de este documento
- Reseñas (`reviews`)
- Estadísticas del sitio (`site_stats`) — registro único
- Información de contacto (`contact_info`) — registro único
- Horarios de atención (`working_hours`)
- Activos generales del sitio (`site_assets`) — banner, imágenes institucionales

---

## 3. Requerimientos Funcionales

### RF-01 Autenticación y autorización
- RF-01.1: El sistema debe requerir inicio de sesión (Supabase Auth) para acceder a cualquier pantalla del módulo administrativo.
- RF-01.2: Solo usuarios con rol `admin` (definido vía `custom claims`, tabla `profiles`/`app_users`, o Supabase Auth roles) podrán realizar operaciones de escritura.
- RF-01.3: El sistema debe cerrar sesión automáticamente tras un período de inactividad configurable.

### RF-02 Gestión de Categorías
- RF-02.1: Listar, crear, editar y eliminar categorías (`name`, `slug`, `sort_order`).
- RF-02.2: Validar que `name` y `slug` sean únicos (restricción de BD existente).
- RF-02.3: Generar automáticamente el `slug` a partir del `name` (editable).
- RF-02.4: Impedir eliminar una categoría referenciada por disfraces existentes, o solicitar reasignación.

### RF-03 Gestión de Diseñadores
- RF-03.1: CRUD completo de diseñadores (`name`, `bio`).
- RF-03.2: Mostrar cantidad de disfraces asociados a cada diseñador.

### RF-04 Gestión de Disfraces (Costumes)
- RF-04.1: Listado paginado y filtrable (por categoría, disponibilidad, destacado, diseñador).
- RF-04.2: Formulario de creación/edición con los campos: `slug`, `name`, `category_id`, `description`, `designer_id`, `rental_price`, `sale_price`, `is_available`, `featured`, `size`.
- RF-04.3: El campo `rating` y `reviews_count` son de **solo lectura** en el panel, ya que se calculan automáticamente vía trigger (`recalc_costume_rating`).
- RF-04.4: Autogeneración de `slug` único a partir de `name`, editable manualmente.
- RF-04.5: Gestión de **detalles del disfraz** (lista ordenable de textos, tabla `costume_details`), con alta/edición/eliminación/reordenamiento (`sort_order`).
- RF-04.6: Selección múltiple de **telas** asociadas (tabla `fabrics` / `costume_fabrics`), con opción de crear una tela nueva "al vuelo".
- RF-04.7: Selección múltiple de **accesorios** asociados (tabla `accessories` / `costume_accessories`), con opción de crear uno nuevo "al vuelo".
- RF-04.8: Selección múltiple de **tallas disponibles** (`costume_sizes`), limitada al enum `costume_size_enum` (XS, S, M, L, XL, XXL).
- RF-04.9: Activar/desactivar `is_available` y `featured` desde el listado (toggle rápido) y desde el formulario.
- RF-04.10: Eliminación de disfraz con confirmación, considerando el borrado en cascada de detalles, imágenes y relaciones (`on delete cascade` ya definido en BD).
- RF-04.11: Vista previa del disfraz tal como se vería en el sitio público (usando la vista `costumes_full`).

### RF-05 Gestión de Imágenes de Disfraces ⭐
- RF-05.1: Cada disfraz debe permitir **subir una o varias imágenes** desde el formulario de edición.
- RF-05.2: Las imágenes se almacenan en un **Supabase Storage Bucket** (p. ej. `costume-images`), y el campo `storage_path` en la tabla `costume_images` guarda la ruta/clave del archivo (no la imagen en sí).
- RF-05.3: El sistema debe permitir **marcar una imagen como principal** (`is_primary = true`). Dado que existe un índice único parcial (`one_primary_per_costume`) que garantiza una sola imagen principal por disfraz, la interfaz debe:
  - Al marcar una nueva imagen como principal, desmarcar automáticamente la anterior (transacción atómica).
- RF-05.4: Permitir **reordenar** las imágenes de la galería (`sort_order`) mediante arrastrar y soltar o controles de orden.
- RF-05.5: Permitir editar el **texto alternativo** (`alt_text`) de cada imagen (accesibilidad/SEO).
- RF-05.6: Permitir **eliminar** una imagen individual, incluyendo el archivo físico del bucket y el registro en BD.
  - Si se elimina la imagen marcada como principal, el sistema debe solicitar al usuario elegir una nueva imagen principal, o asignarla automáticamente a la primera disponible.
- RF-05.7: Validaciones de carga:
  - Formatos permitidos: JPG, PNG, WEBP.
  - Tamaño máximo por archivo (configurable, sugerido 5 MB).
  - Redimensionamiento/compresión automática opcional antes de subir (optimización).
- RF-05.8: Mostrar una vista de **galería tipo grid** con miniaturas, indicador visual de cuál es la principal, y barra de progreso durante la carga.
- RF-05.9: Soportar carga múltiple (drag & drop de varios archivos a la vez).
- RF-05.10: Generar nombres de archivo únicos en el bucket (evitar colisiones), p. ej. `{costume_id}/{uuid}.{ext}`.

### RF-06 Gestión de Reseñas (Reviews)
- RF-06.1: Listado de reseñas con filtro por disfraz, calificación y estado de publicación.
- RF-06.2: Aprobar/despublicar reseñas (`is_published`), lo que dispara automáticamente el recálculo de `rating`/`reviews_count` vía trigger existente — el panel no debe recalcular manualmente estos campos.
- RF-06.3: CRUD de reseñas: `author_name`, `author_role`, `rating` (1-5), `comment`, `review_date`, avatar (subida de imagen, análoga a RF-05).
- RF-06.4: Confirmación antes de eliminar (advertir que recalculará el rating del disfraz).

### RF-07 Configuración del Sitio
- RF-07.1: Formulario único para editar `site_stats` (`years_of_tradition`, `carnivals_lived`, `costumes_rented`, `happy_hearts`) — registro singleton (`id boolean primary key`).
- RF-07.2: Formulario único para editar `contact_info` (`address`, `city`, `phone`, `whatsapp`, `email`) — registro singleton.
- RF-07.3: CRUD de `working_hours` (días, horas, orden).
- RF-07.4: Gestión de `site_assets`: permitir subir/reemplazar imágenes institucionales (hero banner, atelier, etc.) identificadas por `key`, reutilizando el mismo mecanismo de carga de RF-05.

### RF-08 Auditoría y trazabilidad *(recomendado)*
- RF-08.1: Registrar quién y cuándo modificó cada disfraz (aprovechar/extender `updated_at`).
- RF-08.2: Historial de cambios opcional (tabla de auditoría) para trazabilidad ante disputas.

### RF-09 Entregable: Documento README de configuración en Supabase ⭐
- RF-09.1: El equipo de desarrollo debe entregar, junto con el módulo, un **archivo `README.md`** que documente **paso a paso todas las acciones manuales que deben ejecutarse en el panel de Supabase** (Dashboard) o vía SQL/CLI para que el módulo de administración funcione correctamente en un entorno nuevo (desarrollo, staging o producción).
- RF-09.2: El README debe incluir, como mínimo:
  - **Creación del proyecto Supabase** y variables de entorno requeridas (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`), indicando cuáles son públicas y cuáles deben mantenerse secretas.
  - **Orden de ejecución de las migraciones SQL** existentes (`001_init.sql` → `002_seed.sql` → `003_views.sql` → `004_rls.sql`) y de las nuevas migraciones que se generen para este módulo (roles admin, políticas RLS adicionales, etc.).
  - **Creación del bucket de Storage** `costume-images` (y cualquier otro bucket necesario, p. ej. `review-avatars`, `site-assets`): nombre exacto, si es público o privado, y límites de tamaño/tipo de archivo configurados en el Dashboard.
  - **Políticas de Storage** a crear (quién puede `SELECT`, `INSERT`, `UPDATE`, `DELETE` sobre cada bucket).
  - **Configuración de autenticación**: método(s) habilitados (email/password, magic link, etc.), creación del primer usuario administrador y cómo asignarle el rol `admin` (claim, tabla, o metadata de usuario).
  - **Políticas RLS nuevas o modificadas** necesarias para el panel admin (ver sección 5 de este documento), incluyendo el script SQL exacto a ejecutar.
  - **Variables/Secrets** a configurar si se usan Edge Functions (p. ej. para operaciones con `service_role`).
  - **Pasos de verificación**: cómo confirmar que la configuración quedó correcta (ej. probar login admin, subir una imagen de prueba, confirmar que un usuario `anon` no puede escribir).
  - **Procedimiento de rollback** básico en caso de error en la configuración.
- RF-09.3: El README debe redactarse en formato Markdown, ubicarse en la raíz del repositorio del proyecto (o carpeta `/docs`), y mantenerse actualizado cada vez que se agregue una nueva migración, bucket o política relacionada con Supabase.
- RF-09.4: El README debe estar escrito de forma que una persona sin conocimiento previo del proyecto pueda replicar la configuración completa de Supabase desde cero siguiendo únicamente esos pasos.

---

## 4. Requerimientos No Funcionales

| Código | Requerimiento |
|---|---|
| RNF-01 | El panel debe ser responsive (uso desde tablet/escritorio en el taller). |
| RNF-02 | Tiempo de carga de listado de disfraces < 2 segundos con paginación de 20-50 registros. |
| RNF-03 | Las imágenes deben servirse optimizadas (CDN de Supabase Storage / transformaciones). |
| RNF-04 | Toda escritura debe ejecutarse con el **rol de servicio** (`service_role`) desde el backend/edge functions, nunca exponiendo la `service_role key` en el cliente. |
| RNF-05 | El módulo debe operar bajo las políticas RLS ya definidas; cualquier nueva política de escritura debe restringirse a roles autenticados con permiso admin, no a `anon`. |
| RNF-06 | Disponibilidad objetivo 99% (uso interno, no crítico 24/7). |
| RNF-07 | Copias de seguridad periódicas de la base de datos y del bucket de imágenes (gestionado por Supabase). |
| RNF-08 | Toda la documentación de configuración (README de Supabase) debe versionarse junto con el código fuente en el mismo repositorio Git. |

---

## 5. Requerimientos de Seguridad (ajustes necesarios a RLS)

El script `004_rls.sql` actual **solo bloquea explícitamente al rol `anon`** para escritura en `costumes`, `reviews`, `contact_info` y `site_stats`. Para soportar el módulo de administración de forma segura se requiere:

- RS-01: Definir un rol/claim `admin` verificable en las políticas (p. ej. `auth.jwt() ->> 'role' = 'admin'` o tabla `admin_users`).
- RS-02: Añadir políticas de INSERT/UPDATE/DELETE explícitas para el rol admin en **todas** las tablas administrables (actualmente faltan en: `categories`, `designers`, `costume_details`, `fabrics`, `costume_fabrics`, `accessories`, `costume_accessories`, `costume_sizes`, `costume_images`, `working_hours`, `site_assets`).
- RS-03: Configurar políticas de Storage (bucket `costume-images`) para permitir `upload`/`update`/`delete` solo a usuarios autenticados con rol admin, y `select` público para lectura.
- RS-04: Considerar operar el backend administrativo con `service_role` a través de una capa de API propia (Edge Functions o backend intermedio), evitando exponer políticas RLS complejas directamente al cliente admin.
- RS-05: Todas las políticas y pasos manuales descritos en RS-01 a RS-04 deben quedar documentados literalmente (con el script SQL correspondiente) en el README de Supabase requerido en RF-09.

---

## 6. Diseño de Almacenamiento de Imágenes (Supabase Storage)

| Aspecto | Definición propuesta |
|---|---|
| Bucket | `costume-images` (público para lectura, privado para escritura) |
| Estructura de rutas | `costumes/{costume_id}/{uuid}.{ext}` |
| Relación con BD | `costume_images.storage_path` almacena la ruta relativa dentro del bucket (no la URL completa), reconstruyendo la URL pública en el frontend |
| Imagen principal | Un único registro con `is_primary = true` por `costume_id` (garantizado por índice único parcial existente) |
| Límite sugerido | Máx. 8 imágenes por disfraz (configurable) |
| Compatibilidad con seed | Los datos de ejemplo actuales mezclan nombres de archivo simples (`marimonda.jpg`) y URLs externas de Unsplash; el módulo debe soportar mostrar ambos formatos, pero toda **nueva** carga debe usar el bucket propio |

---

## 7. Casos de Uso Principales

1. **CU-01: Crear un nuevo disfraz con imágenes** — Admin completa formulario, sube 3 imágenes, marca una como principal, publica.
2. **CU-02: Actualizar disponibilidad rápida** — Admin desactiva `is_available` de un disfraz agotado desde el listado.
3. **CU-03: Reemplazar imagen principal** — Admin sube nueva foto y la marca como principal; sistema desmarca la anterior automáticamente.
4. **CU-04: Moderar reseña** — Admin publica una reseña pendiente; el `rating` del disfraz se recalcula automáticamente.
5. **CU-05: Actualizar información de contacto** — Admin edita teléfono/WhatsApp desde formulario singleton.
6. **CU-06: Onboarding de nuevo entorno** — Un desarrollador nuevo sigue el README de Supabase para configurar un proyecto desde cero (bucket, políticas, usuario admin) sin asistencia adicional.

---

## 8. Restricciones Técnicas Identificadas en el Esquema

- El campo `id` de `site_stats` y `contact_info` es `boolean primary key default true check (id)`, lo que garantiza **una sola fila**: el panel debe implementarse como formulario de edición único (UPSERT), no como lista CRUD tradicional.
- `costumes.rating` y `reviews_count` **no deben ser editables manualmente** en el panel (son derivados por trigger).
- El enum `costume_size_enum` está fijo en BD; agregar una nueva talla requiere migración (`ALTER TYPE`), no es editable desde el panel salvo que se planee esa funcionalidad avanzada.
- Las relaciones N:N (`costume_fabrics`, `costume_accessories`) requieren componentes tipo "multi-select con creación rápida" en la UI.

---

## 9. Entregables del Proyecto

| # | Entregable | Descripción |
|---|---|---|
| E-01 | Código fuente del módulo de administración | Repositorio Git con el panel completo (frontend + backend/Edge Functions si aplica) |
| E-02 | Migraciones SQL adicionales | Scripts para roles admin, nuevas políticas RLS, buckets, etc. |
| E-03 | **README de configuración de Supabase** | Documento Markdown descrito en RF-09, con todos los pasos manuales/CLI necesarios para replicar el entorno |
| E-04 | Manual de usuario del panel *(opcional)* | Guía breve para el personal de Disfraces Madi sobre el uso del módulo |
| E-05 | Credenciales/checklist de despliegue | Lista de variables de entorno y secretos requeridos (sin valores reales) |

---

## 10. Alcance Fuera de este Documento
- Diseño visual/UI detallado (wireframes) — a definir en fase de diseño.
- Selección de stack tecnológico del frontend admin (React/Next.js, Vue, etc.) — a definir según preferencia del equipo.
- Definición exacta del mecanismo de roles admin (tabla propia vs. claims de Supabase Auth) — a decidir en diseño técnico.