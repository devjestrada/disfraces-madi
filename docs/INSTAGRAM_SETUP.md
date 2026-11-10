# Instagram: configuración de la publicación de carruseles

Guía para dejar funcionando la sección **Instagram** del panel (spec `publicacion_carruseles_instagram`):
conexión de la cuenta, publicación programada y renovación automática del acceso.

Se hace una sola vez. Toma unos 30 minutos.

## 1. Requisitos

- La cuenta de Instagram de Disfraces Madi debe ser **profesional** (Empresa o Creador).
  En la app: Configuración → Cuenta → Cambiar a cuenta profesional. No hace falta página de Facebook.
- Un **portafolio empresarial** de Meta (business.facebook.com) con la cuenta de Instagram.
- Migración `supabase/015_instagram_publishing.sql` aplicada (tablas, RLS y bucket público `instagram-media`).
- Secretos de OpenAI ya configurados (`OPENAI_API_KEY`, `OPENAI_TEXT_MODEL`, ver `SUPABASE_SETUP.md` §8.2):
  se usan para escribir los textos de los carruseles.
- Supabase CLI con sesión iniciada (`supabase login`).

## 2. Crear la app en Meta for Developers

Desde octubre de 2026 Meta solo ofrece a las apps nuevas el **inicio de sesión unificado** (*Unified login*) para
la API de Instagram (el inicio de sesión de Instagram ya no está disponible y el de Facebook es *legacy*). El panel
usa ese.

1. Entra a [developers.facebook.com/apps](https://developers.facebook.com/apps) y crea una app con el caso de uso
   **Administrar mensajes y contenido en Instagram**. Asóciala al portafolio empresarial si lo pregunta.
2. En **Casos de uso → Personalizar**, en el menú izquierdo elige **API setup with Unified login** (no la
   configuración con inicio de sesión con Facebook).
3. En **1. Configurar tu app**:
   - **Crear nueva configuración**: token de acceso de usuario del sistema (SUAT), caducidad "Nunca", activo: la
     cuenta de Instagram de Disfraces Madi (la cuenta publicitaria es opcional). Permisos que usa el panel:
     `instagram_basic` e `instagram_content_publish` (los demás que agregue Meta no se usan).
   - Anota el **ID de configuración**.
   - **URL de redireccionamiento:**
     `https://<project-ref>.supabase.co/functions/v1/instagram-oauth-callback`
     (el `<project-ref>` es el subdominio de `VITE_SUPABASE_URL`). Debe coincidir exactamente, sin barra final.
   - La **URL de inicio de sesión** que muestra Meta sirve para comprobar los parámetros; el panel la arma solo.
4. **Webhooks** (paso 3 de esa pantalla): no se usan, déjalo vacío.
5. Anota el **ID de la app** (arriba en el panel de Meta) y la **clave secreta de la app**
   (**Configuración de la app → Básica → Clave secreta → Mostrar**).

### ¿Hace falta la revisión de Meta (App Review)?

**No.** La app solo publica en la cuenta propia del negocio, y para eso basta el acceso estándar: según la tabla de
escenarios de Meta, una app "solo para un negocio que tengo o administro" no requiere App Review. La revisión solo
aplica para conectar cuentas de terceros. No completes el paso 4 ("Completar la revisión de la app").

Mientras la app esté en **modo de desarrollo**, la cuenta de Instagram debe tener un rol en la app:

1. En la app de Meta: **Roles de la app → Roles → Agregar personas → Evaluador de Instagram**, con el usuario de
   Instagram de Disfraces Madi.
2. En Instagram (web o app): **Configuración → Apps y sitios web → Invitaciones de evaluador** y aceptar.
3. De vuelta en **API setup with Unified login → 2. Generar tokens de acceso → Agregar cuenta**. Si la cuenta
   aparece ahí, la asignación funciona. No copies ni guardes el token que muestre: el panel obtiene el suyo al conectar.

## 3. Secretos de Supabase

| Nombre | Valor |
|---|---|
| `META_APP_ID` | ID de la app de Meta (paso 2.5). |
| `META_APP_SECRET` | Clave secreta de la app de Meta. También firma el enlace de conexión. |
| `META_LOGIN_CONFIG_ID` | ID de configuración del inicio de sesión unificado (paso 2.3). |
| `SITE_URL` | URL pública del sitio, sin barra final (ej. `https://disfracesmadi.com`). A ella vuelve el panel tras conectar. |
| `CRON_SECRET` | Texto aleatorio largo para la tarea programada (ej. `openssl rand -hex 32`). |
| `INSTAGRAM_API_VERSION` | Opcional. Versión de la Graph API (`v25.0` por defecto). |
| `INSTAGRAM_RENDERS_PER_RUN` | Opcional. Imágenes 4:5 que se preparan por pasada (2 por defecto). |

Igual que en `SUPABASE_SETUP.md` §8.2: por el Dashboard (**Edge Functions → Secrets**) o con
`supabase secrets set --env-file <archivo fuera del repo> --project-ref <project-ref>`.

## 4. Desplegar las funciones

```bash
supabase functions deploy instagram-auth --project-ref <project-ref>
supabase functions deploy instagram-caption --project-ref <project-ref>
supabase functions deploy instagram-oauth-callback --no-verify-jwt --project-ref <project-ref>
supabase functions deploy instagram-scheduler --no-verify-jwt --project-ref <project-ref>
```

- `instagram-oauth-callback` es pública porque la llama Meta al volver del inicio de sesión; la valida el
  `state` firmado.
- `instagram-scheduler` valida por sí misma: acepta el encabezado `x-cron-secret` (tarea programada) o una sesión de
  admin ("Publicar ahora" desde el panel). Cualquier otra llamada recibe 401.

| Función | Qué hace |
|---|---|
| `instagram-auth` | Inicia la conexión (diálogo del inicio de sesión unificado de Meta) y desconecta la cuenta. Solo admins. |
| `instagram-oauth-callback` | Recibe el código, obtiene el token de usuario del sistema (no vence), busca la cuenta asignada (`/me/assigned_instagram_accounts`) y guarda el token solo en el servidor. |
| `instagram-caption` | Escribe el texto de un carrusel con IA. Solo admins, 120 por hora. |
| `instagram-scheduler` | Cada 5 min: revisa la conexión (cada hora), genera carruseles de reglas, suma disfraces nuevos a campañas, prepara imágenes 4:5 y publica lo que llegó a su hora. |

## 5. Tarea programada (pg_cron)

En el **SQL Editor** de Supabase. Activa las extensiones (o desde **Database → Extensions**: `pg_cron` y `pg_net`):

```sql
create extension if not exists pg_cron;
create extension if not exists pg_net;
```

Guarda la URL del proyecto y el `CRON_SECRET` en Vault (no quedan en texto plano en la definición del cron):

```sql
select vault.create_secret('https://<project-ref>.supabase.co', 'project_url');
select vault.create_secret('<el mismo valor de CRON_SECRET>', 'instagram_cron_secret');
```

Programa la tarea cada 5 minutos:

```sql
select cron.schedule(
  'instagram-scheduler',
  '*/5 * * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url')
           || '/functions/v1/instagram-scheduler',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'instagram_cron_secret')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
  $$
);
```

Para pausar o quitar la tarea: `select cron.unschedule('instagram-scheduler');`

Orden recomendado: migración `015` → app de Meta → secretos → funciones → cron → frontend.

## 6. Verificación

1. Panel → **Instagram → Conexión → Conectar Instagram**. Inicia sesión (con Instagram o Facebook), elige la
   cuenta de Disfraces Madi y acepta. Al volver debe verse `@usuario` y "Funcionando".
   - Si vuelve con "Meta no asignó ninguna cuenta de Instagram a la app": en business.facebook.com →
     **Configuración → Cuentas → Cuentas de Instagram**, revisa que la cuenta esté en el portafolio y que la app
     tenga acceso a ella (**Apps conectadas**); luego conecta de nuevo.
2. **Nuevo carrusel** con 2 disfraces, texto con IA y "Publicar ahora". Debe quedar **Publicado** con enlace al post.
3. Revisa que el cron corre:
   ```sql
   select status, return_message, start_time from cron.job_run_details
   where jobid = (select jobid from cron.job where jobname = 'instagram-scheduler')
   order by start_time desc limit 5;

   select status_code, content::text, created from net._http_response order by created desc limit 5;
   ```
4. Errores de publicación: el calendario muestra el motivo de cada carrusel fallido; el detalle está en
   `instagram_publish_log` y en los logs de `instagram-scheduler` (Dashboard → Edge Functions).

## 7. Cómo funciona (resumen)

- **Imágenes:** Meta descarga cada imagen desde una URL pública al publicar y solo acepta JPEG. La tarea programada
  convierte cada foto del catálogo (3:4) a JPEG 4:5 de 1080 × 1350 px extendiendo el fondo gris de estudio, sin
  recortar el disfraz, y la guarda en `instagram-media/variants/` (se reutiliza entre carruseles). Se preparan desde
  3 días antes de la publicación, pocas por pasada.
- **Aprobación:** lo que generan reglas y campañas queda **pendiente de aprobación** salvo que se desactive. Un
  carrusel pendiente nunca se publica.
- **Reglas:** su carrusel se genera 3 días antes de cada fecha. "Novedades" no publica si hay menos de 2 disfraces
  nuevos. "Los más alquilados" usa el histórico de alquileres vinculado del mes anterior.
- **Campañas:** al pasar su fecha de fin quedan como terminadas. En pausa, sus carruseles esperan. Con "Sumar los
  disfraces nuevos", cada disfraz nuevo que cumpla los filtros se agrega al próximo carrusel no aprobado con espacio
  (a 2 h o más de su hora) y el texto se reescribe con IA.
- **Límites:** máximo 3 publicaciones por pasada, reintentos automáticos (5, 15 y 45 min) ante errores temporales y
  consulta del límite de 100 publicaciones por día de Instagram. Un bloqueo por registro evita publicar dos veces.
- **Token:** el del inicio de sesión unificado es de usuario del sistema y no vence. Cada hora se comprueba que siga
  sirviendo; si Meta lo rechaza (revocado o cambiado), la conexión queda con error, no se publica nada y aparece un
  aviso en **Resumen**. Los carruseles afectados quedan programados y salen al reconectar.
