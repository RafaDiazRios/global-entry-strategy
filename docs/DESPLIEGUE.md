# Despliegue

La aplicación ya no depende de ninguna plataforma concreta. Es un servidor Express con
una base de datos MySQL, y se despliega en cualquier sitio que acepte un contenedor o un
proyecto Node: Railway, Render, Fly.io o un VPS propio.

Necesita cuatro servicios externos, todos sustituibles:

| Servicio | Para qué | Alternativas |
|---|---|---|
| MySQL | Escenarios, casos, evidencias y gates | Cualquier MySQL 8 o TiDB gestionado |
| Google OAuth | Acceso | Se cambia reescribiendo `server/_core/auth.ts`, unas 180 líneas |
| API compatible con OpenAI | Copiloto de caso | Cualquier proveedor con `/chat/completions` |
| S3 o compatible | Documentos de caso en PDF | Cloudflare R2, Backblaze B2, MinIO |

Sin las claves del modelo o del almacenamiento la aplicación arranca igual: la evaluación
de países y el caso económico funcionan, y solo fallan las funciones que las necesitan.

---

## 1. Credenciales de Google

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
la causa habitual del error `redirect_uri_mismatch`.

---

## 2. Base de datos

Cualquier MySQL 8 gestionado sirve. En Railway y en Render se añade desde el propio panel
y le dan una cadena de conexión, que es el valor de `DATABASE_URL`.

Con la base creada, aplique las migraciones desde su máquina:

```bash
DATABASE_URL="mysql://..." pnpm drizzle-kit migrate
```

Son cuatro migraciones acumuladas y todas son aditivas.

---

## 3. Almacenamiento de documentos

Solo hace falta si va a subir PDF de casos. Con Cloudflare R2:

1. Cree un bucket.
2. Cree un token de API con permiso de lectura y escritura sobre ese bucket.
3. Rellene `S3_ENDPOINT` con `https://<cuenta>.r2.cloudflarestorage.com`, `S3_BUCKET`,
   `S3_ACCESS_KEY_ID` y `S3_SECRET_ACCESS_KEY`, y deje `S3_REGION=auto`.

Con S3 nativo, deje `S3_ENDPOINT` vacío y ponga la región real.

Los ficheros no se sirven públicamente: `/files/<clave>` exige sesión y redirige a una URL
firmada que caduca en quince minutos.

---

## 4. Variables de entorno

Copie `.env.example` y rellénelo. El secreto de sesión se genera así:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

`ALLOWED_EMAILS` es la lista blanca de acceso. **Si está vacía no entra nadie**, incluido
usted: es deliberado, para que una instalación a medio configurar quede cerrada y no
abierta. El primer correo de la lista recibe rol de administrador.

---

## 5. Desplegar

### Railway

1. *New Project › Deploy from GitHub repo* y elija el repositorio.
2. Añada un servicio **MySQL** desde el mismo proyecto.
3. En *Variables*, pegue el contenido de su `.env`. `DATABASE_URL` puede referenciar la del
   servicio MySQL.
4. Railway detecta el `Dockerfile` y construye con él.
5. En *Settings › Networking*, genere el dominio y póngalo en `PUBLIC_URL`. Añada ese mismo
   dominio al URI de redirección en Google.

### Render

1. *New › Web Service*, conecte el repositorio y elija *Docker* como entorno.
2. Añada una base de datos MySQL, propia o externa.
3. Pegue las variables en *Environment*.
4. El dominio que le asigna Render va en `PUBLIC_URL` y en Google.

### En local

```bash
pnpm install
cp .env.example .env   # y rellénelo
pnpm drizzle-kit migrate
pnpm dev
```

---

## 6. Refresco programado de datos públicos

`POST /api/scheduled/refresh-scenarios` actualiza los indicadores públicos de todos los
escenarios guardados y los reevalúa. Está protegido por un secreto compartido: hay que
enviar la cabecera `X-Cron-Secret` con el valor de `CRON_SECRET`. Sin esa variable el
endpoint queda cerrado.

Programarlo con el cron de Railway o Render, o con una acción de GitHub:

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

## 7. Comprobaciones tras el primer despliegue

1. `GET /` carga la aplicación.
2. Pulsar *Iniciar sesión* lleva a Google y vuelve a la aplicación con sesión.
3. Un correo fuera de `ALLOWED_EMAILS` recibe una página de acceso denegado, no un error.
4. Añadir un país descarga indicadores del Banco Mundial.
5. Crear un caso, pegar texto y extraer evidencias devuelve citas verificadas.
6. Subir un PDF avisa de si se pudo extraer el texto. Si no se pudo, las citas de ese
   documento no se podrán verificar y la herramienta lo dice.

---

## Qué se cambió al salir de la plataforma anterior

| Antes | Ahora |
|---|---|
| OAuth de la plataforma con verificación remota de sesión | Google OAuth y sesión propia firmada con `JWT_SECRET` |
| Pasarela de modelo de la plataforma | Cualquier API compatible con OpenAI vía `LLM_BASE_URL` |
| Almacenamiento con URLs prefirmadas de la plataforma | S3 o compatible con el SDK de AWS, que ya era dependencia |
| Endpoint de refresco autenticado como tarea de la plataforma | Secreto compartido en cabecera |
| Plugin de compilación y recolector de logs propietarios | Retirados |
| Seis servicios de plataforma sin uso, ~1.100 líneas | Borrados |

Y una mejora que vino de regalo: como el PDF ya no se pasa al modelo como URL sino que se
le extrae el texto en el servidor, ahora **también se pueden verificar las citas de un PDF**
contra su original, cosa que antes solo era posible con texto pegado.
