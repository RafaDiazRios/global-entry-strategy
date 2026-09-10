# Despliegue

La aplicación no depende de ninguna plataforma concreta: es un servidor Express con una
base de datos PostgreSQL, y se despliega en cualquier sitio que acepte un contenedor.
Esta guía usa **Supabase** para la base y **Railway** para el servidor, que es la
combinación instalada, pero ninguna de las dos es obligatoria.

Necesita cuatro servicios externos, todos sustituibles:

| Servicio | Para qué | Alternativas |
|---|---|---|
| PostgreSQL | Escenarios, casos, evidencias y gates | Supabase, Neon, Railway, un VPS |
| Google OAuth | Acceso | Se cambia reescribiendo `server/_core/auth.ts`, unas 180 líneas |
| API compatible con OpenAI | Copiloto de caso | Cualquier proveedor con `/chat/completions` |
| S3 o compatible | Documentos de caso en PDF | Cloudflare R2, Backblaze B2, MinIO |

Sin las claves del modelo o del almacenamiento la aplicación arranca igual: la evaluación
de países y el caso económico funcionan, y solo fallan las funciones que las necesitan.

**Ninguna credencial de las que aparecen aquí debe pegarse en un chat, en un issue ni en
el repositorio.** Van al panel del proveedor y a las variables de entorno, y a ningún otro
sitio.

---

## 0. Estado actual

Las tablas ya están creadas en el proyecto Supabase **writeflow**, dentro de un esquema
propio llamado `entry_strategy`, separado del `public` donde viven las tablas `cso_*` y
las de escritura. Son siete tablas: `users`, `strategyScenarios`, `strategyApprovals`,
`strategyApprovalMilestones`, `strategyCases`, `strategyCaseDocuments` y
`strategyEvidence`.

Quedan cerradas a la API pública de Supabase: el esquema no concede ningún permiso a los
roles `anon` y `authenticated`, y las siete tablas tienen RLS activo sin políticas. En
PostgreSQL eso significa "nadie salvo el propietario de la tabla". El servidor se conecta
como propietario con su cadena de conexión, así que no le afecta.

El aviso *RLS Enabled No Policy* que muestra el panel de Supabase sobre estas tablas es
por tanto el comportamiento buscado, no un fallo pendiente.

---

## 1. Cadena de conexión a la base

1. En el panel de Supabase, proyecto **writeflow**, entre en *Project Settings › Database*.
2. Si no recuerda la contraseña de la base, use *Reset database password* y guárdela en su
   gestor de contraseñas. Es el único momento en que se muestra.
3. En *Connection string* elija **Session pooler** y copie la URI. Tiene esta forma:

   ```
   postgresql://postgres.rlnetaknsjzmsplbjmow:CONTRASENA@aws-N-eu-west-3.pooler.supabase.com:5432/postgres
   ```

4. Sustituya `CONTRASENA` por la suya. Ese texto completo es el valor de `DATABASE_URL`.

Por qué el *pooler* y no la conexión directa: `db.<proyecto>.supabase.co` solo resuelve por
IPv6, y Railway y Render salen por IPv4. La conexión directa falla con un `ENETUNREACH`
que no dice nada. El pooler de sesión resuelve por IPv4 y se comporta igual que una
conexión normal.

Si prefiere el pooler de transacción (puerto 6543), también funciona: el cliente ya se
crea con `prepare: false`, que es lo que ese modo exige.

---

## 2. Credenciales de Google

1. Entre en Google Cloud Console y cree un proyecto, o use uno existente.
2. **APIs y servicios › Pantalla de consentimiento de OAuth**: tipo *Externo*, complete
   nombre de la aplicación y correo de soporte. No hace falta verificación mientras la
   aplicación siga en modo de prueba y los usuarios estén en la lista de prueba.
3. **APIs y servicios › Credenciales › Crear credenciales › ID de cliente de OAuth**, tipo
   *Aplicación web*.
4. En **URI de redirección autorizados** añada exactamente:
   - `https://su-dominio/api/auth/callback`
   - `http://localhost:3000/api/auth/callback` si va a trabajar en local.
5. Guarde el **ID de cliente** y el **secreto**.

El URI tiene que coincidir carácter a carácter con `PUBLIC_URL` + `/api/auth/callback`. Es
la causa habitual del error `redirect_uri_mismatch`. Como el dominio lo asigna Railway, lo
normal es desplegar primero (paso 4), copiar el dominio y volver aquí.

---

## 3. Variables de entorno

Copie `.env.example` y rellénelo. El secreto de sesión se genera así:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

`ALLOWED_EMAILS` es la lista blanca de acceso. **Si está vacía no entra nadie**, incluido
usted: es deliberado, para que una instalación a medio configurar quede cerrada y no
abierta. El primer correo de la lista recibe rol de administrador.

Lo mínimo para que la aplicación arranque y se pueda entrar es `PUBLIC_URL`,
`DATABASE_URL`, `JWT_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` y
`ALLOWED_EMAILS`. Las claves del modelo y del almacenamiento pueden esperar.

---

## 4. Desplegar en Railway

1. *New Project › Deploy from GitHub repo* y elija `RafaDiazRios/global-entry-strategy`.
   Railway detecta el `Dockerfile` y construye con él; no hay que configurar el comando.
2. **No** añada un servicio de base de datos: la base es Supabase.
3. En *Variables*, pegue el contenido de su `.env`. Railway acepta pegar varias líneas de
   golpe con *Raw editor*.
4. En *Settings › Networking › Public Networking*, genere el dominio.
5. Ponga ese dominio, con `https://` y sin barra final, en `PUBLIC_URL`, y añádalo también
   al URI de redirección de Google (paso 2). Railway vuelve a desplegar solo.

### En local

```bash
pnpm install
cp .env.example .env   # y rellénelo
pnpm dev
```

Con `PUBLIC_URL=http://localhost:3000` y ese mismo URI de redirección dado de alta en
Google.

---

## 5. Migraciones

Las tablas ya están aplicadas, así que **no hace falta ejecutar nada ahora**. Cuando una
fase futura añada tablas o columnas:

```bash
pnpm drizzle-kit generate    # genera el fichero SQL a partir de drizzle/schema.ts
DATABASE_URL="postgresql://..." pnpm drizzle-kit migrate
```

En Windows PowerShell, la primera línea del comando se escribe
`$env:DATABASE_URL="postgresql://..."` en una sentencia aparte.

La migración inicial (`0000_inicial_postgres.sql`) está escrita para poder aplicarse sobre
una base donde las tablas ya existen sin romper nada, así que ejecutar `migrate` de más es
inofensivo.

---

## 6. Almacenamiento de documentos

Solo hace falta si va a subir PDF de casos. Con Cloudflare R2:

1. Cree un bucket.
2. Cree un token de API con permiso de lectura y escritura sobre ese bucket.
3. Rellene `S3_ENDPOINT` con `https://<cuenta>.r2.cloudflarestorage.com`, `S3_BUCKET`,
   `S3_ACCESS_KEY_ID` y `S3_SECRET_ACCESS_KEY`, y deje `S3_REGION=auto`.

Con S3 nativo, deje `S3_ENDPOINT` vacío y ponga la región real.

Los ficheros no se sirven públicamente: `/files/<clave>` exige sesión y redirige a una URL
firmada que caduca en quince minutos.

---

## 7. Refresco programado de datos públicos

`POST /api/scheduled/refresh-scenarios` actualiza los indicadores públicos de todos los
escenarios guardados y los reevalúa. Está protegido por un secreto compartido: hay que
enviar la cabecera `X-Cron-Secret` con el valor de `CRON_SECRET`. Sin esa variable el
endpoint queda cerrado.

Programarlo con el cron de Railway o con una acción de GitHub:

```yaml
# .github/workflows/refresh.yml
name: Refrescar datos públicos
on:
  schedule:
    - cron: "0 4 1 * *" # el día 1 de cada mes
  workflow_dispatch:
jobs:
  refresh:
    runs-on: ubuntu-latest
    steps:
      - run: |
          curl -fsS -X POST "$URL/api/scheduled/refresh-scenarios" \
            -H "X-Cron-Secret: $SECRET"
        env:
          URL: ${{ secrets.APP_URL }}
          SECRET: ${{ secrets.CRON_SECRET }}
```

Para indicadores macroeconómicos y de gobernanza, una vez al mes es suficiente.

---

## 8. Comprobaciones tras el primer despliegue

1. `GET /` carga la aplicación.
2. Pulsar *Iniciar sesión* lleva a Google y vuelve a la aplicación con sesión.
3. Un correo fuera de `ALLOWED_EMAILS` recibe una página de acceso denegado, no un error.
4. Añadir un país descarga indicadores del Banco Mundial.
5. Guardar un escenario y volver a cargarlo: confirma que la base escribe y lee.
6. Crear un caso, pegar texto y extraer evidencias devuelve citas verificadas.
7. Subir un PDF avisa de si se pudo extraer el texto. Si no se pudo, las citas de ese
   documento no se podrán verificar y la herramienta lo dice.

---

## Qué se cambió al salir de la plataforma anterior

| Antes | Ahora |
|---|---|
| OAuth de la plataforma con verificación remota de sesión | Google OAuth y sesión propia firmada con `JWT_SECRET` |
| Pasarela de modelo de la plataforma | Cualquier API compatible con OpenAI vía `LLM_BASE_URL` |
| Almacenamiento con URLs prefirmadas de la plataforma | S3 o compatible con el SDK de AWS, que ya era dependencia |
| Endpoint de refresco autenticado como tarea de la plataforma | Secreto compartido en cabecera |
| MySQL de la plataforma | PostgreSQL en Supabase, esquema propio y sin acceso público |
| Plugin de compilación y recolector de logs propietarios | Retirados |
| Seis servicios de plataforma sin uso, ~1.100 líneas | Borrados |

Y una mejora que vino de regalo: como el PDF ya no se pasa al modelo como URL sino que se
le extrae el texto en el servidor, ahora **también se pueden verificar las citas de un PDF**
contra su original, cosa que antes solo era posible con texto pegado.
