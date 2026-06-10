# Gazella Notifications Service #

Este es el servicio de notificaciones de Gazella, tiene el proposito de mostrar notificaciones a los usuarios de Gazella mediante dos mecanismos:

* Server-Sent Events
* Consulta del buzón

## Stack Tecnologico ##

* Entorno de Ejecución: **NodeJS**
* Persistencia: **Postgresql 18** + **DrizzleORM**
* Caching: **Redis**

## Requisitos de instalación ##

* Node 24
* Docker y Docker-Compose

## Instalando el proyecto ##

Para desarrollar, instale las dependencias:

```bash
npm install
```

Para ejecutar el proyecto, primero cree tres archivos .txt:

```bash
touch pg_password.txt
touch redis_admin_pass.txt
touch redis_user_pass.txt
```

Escriba contraseñas fuertes en la primera linea de cada uno de los archivos. Cree su archivo .env tomando *example.env* como referencia.

Levante el servicio:

```bash
docker compose up --build
```

Puede consultar la documentación **Open API 3** del servicio visitando http://[host]/[puerto]/docs

## Interfaz de Notificaciones ##

Los esquemas de notificaciones emitidos por el cliente pueden encontrarse en la carpeta public_schemas dentro de src.

* Exchange: **notifications_events**
* Queue: **notifications_service_queue**

### Recibir eventos del servicio ###

Para recibir notificaciones mediante Server-Side Events, conectese al servicio mediante el endpoint stream.
A continuación se detalla la estructura que tienen las notificaciones de este servicio:

#### Sociales ####

Nuevo seguidor:

```json
{
    "id":"857f65a5-96b5-4dff-8d8e-10c799526e3d",
    "type":"socials",
    "addresseeId":"438620bf-0884-483b-9cd2-a965caaae1f5",
    "messageBody": {
        "eventKey":"NEW_FOLLOWER",
        "followedId":"438620bf-0884-483b-9cd2-a965caaae1f5",
        "newFollowerId":"d5b998c7-76fe-41fe-98b3-430d4c76bc77",
        "newFollowerName":"new follower"
    },
    "markedAsRead":false,
    "receivedAt":"2026-06-10T03:27:16.679Z"
}
```

#### Articulos ####

Like recibido en un articulo:

```json
{
    "id": "e62a1f21-44dd-4743-8f3b-68ad605f2c63",
    "type": "articles",
    "addresseeId": "438620bf-0884-483b-9cd2-a965caaae1f5",
    "messageBody": {
        "eventKey": "ARTICLE_LIKED",
        "articleId": "d5b998c7-76fe-41fe-98b3-430d4c76bc77",
        "authorId": "438620bf-0884-483b-9cd2-a965caaae1f5",
        "likeId":"a227a27e-ebcc-4a2f-b0ea-e4d39ae918d5",
        "likeAuthorId":"0f21a04a-a66a-44a0-8479-da93329f0728"
    },
    "markedAsRead": false,
    "receivedAt": "2026-06-10T03:07:21.890Z"
}
```

Articulo comentado:

```json
{
    "id":"072fd177-3e95-46a2-b7a7-8e5f9cc5c457",
    "type":"articles",
    "addresseeId":"438620bf-0884-483b-9cd2-a965caaae1f5",
    "messageBody": {
        "eventKey": "ARTICLE_COMMENTED",
        "articleId":"d5b998c7-76fe-41fe-98b3-430d4c76bc77",
        "authorId":"438620bf-0884-483b-9cd2-a965caaae1f5",
        "commentId":"1aba5d19-89c4-49e3-addb-582866c90e7d",
        "commentAuthorId":"0f21a04a-a66a-44a0-8479-da93329f0728",
        "content":"Great article! I think..."
    },
    "markedAsRead":false,
    "receivedAt":"2026-06-10T03:07:21.950Z"
}
```

#### Proyectos ####

Voluntario se unio:

```json
{
    "id":"8d8b7b4b-f362-4ad8-a814-3f7309368581",
    "type":"projects",
    "addresseeId":"438620bf-0884-483b-9cd2-a965caaae1f5",
    "messageBody": {
        "eventKey":"NEW_ENROLLMENT",
        "projectId":"a227a27e-ebcc-4a2f-b0ea-e4d39ae918d5",
        "organizerId":"438620bf-0884-483b-9cd2-a965caaae1f5",
        "projectTitle":"Campaña de Reforestación",
        "volunteerId":"0f21a04a-a66a-44a0-8479-da93329f0728",
        "volunteerName":"John Doe"
    },
    "markedAsRead":false,
    "receivedAt":"2026-06-10T03:16:45.204Z"
}
```

Voluntario cancelo:

```json
{
    "id":"3e29f6dd-83dc-4c7e-9d03-e3222ccbc5c6",
    "type":"projects",
    "addresseeId":"438620bf-0884-483b-9cd2-a965caaae1f5",
    "messageBody": {
        "eventKey":"ENROLLMENT_CANCELLED",
        "projectId":"a227a27e-ebcc-4a2f-b0ea-e4d39ae918d5",
        "organizerId":"438620bf-0884-483b-9cd2-a965caaae1f5",
        "projectTitle":"Campaña de Reforestación",
        "volunteerId":"0f21a04a-a66a-44a0-8479-da93329f0728",
        "volunteerName":"John Doe"
    },
    "markedAsRead":false,
    "receivedAt":"2026-06-10T03:16:45.263Z"
}
```

Proyecto proximo a comenzar:

```json
{
    "id":"c8bab20a-eaa8-4b4a-9b4d-9eedb82b1663",
    "type":"projects",
    "addresseeId":"438620bf-0884-483b-9cd2-a965caaae1f5",
    "messageBody": {
        "eventKey":"PROJECT_START_NEAR",
        "projectId":"a227a27e-ebcc-4a2f-b0ea-e4d39ae918d5",
        "organizerId":"0f21a04a-a66a-44a0-8479-da93329f0728",
        "projectTitle":"Campaña de Reforestación",
        "startDate":"2026-06-11T03:16:45.281Z",
        "volunteerId":"438620bf-0884-483b-9cd2-a965caaae1f5"
    },"markedAsRead":false,
    "receivedAt":"2026-06-10T03:16:45.315Z"
}
```

Proyecto lleno:

```json
{
    "id":"b4007b01-f282-4d93-bf69-741b06f163cc",
    "type":"projects",
    "addresseeId":"438620bf-0884-483b-9cd2-a965caaae1f5",
    "messageBody": {
        "eventKey":"PROJECT_FULL",
        "projectId":"a227a27e-ebcc-4a2f-b0ea-e4d39ae918d5",
        "organizerId":"438620bf-0884-483b-9cd2-a965caaae1f5",
        "projectTitle":"Campaña de Reforestación"
    },
    "markedAsRead":false,
    "receivedAt":"2026-06-10T03:16:45.367Z"
}
```

### Publicar eventos para el Servicio ###

#### Sociales ####

Para publicar un mensaje de nuevo seguidor:

* Routing Key: **new.follower**

Estructura del mensaje:

```text
followedId: uuidv4
newFollowerId: uuidv4
newFollowerName: string,
newFollowerPfpUri: url (opcional, si no esta definida, puede proveer una cadena vacia)
```

#### Articulos ####

Para publicar un mensaje de articulo recibio un like:

* Routing Key: **article.liked**

Estructura del mensaje:

```text
articleId: uuidv4,
authorId: uuidv4,
likeId: uuidv4,
likeAuthorId: uuidv4
```

Para publicar un mensaje de articulo tiene un nuevo comentario:

* Routing Key: **article.commented**

Estructura del mensaje:

```text
articleId: uuidv4,
authorId: uuidv4,
commentId: uuidv4,
commentAuthorId: uuidv4,
content: uuidv4
```

#### Proyectos ####

Para publicar un mensaje de nuevo voluntario para el proyecto:

* Routing Key: **project.enrollment.new**

Estructura del mensaje:

```text
projectId: uuidv4,
organizerId: uuidv4,
projectTitle: string,
volunteerId: uuidv4,
volunteerName: string
```

Para publicar un mensaje de voluntario abandono el proyecto:

* Routing Key: **project.enrollment.cancelled**

Estructura del mensaje:

```text
projectId: uuidv4,
organizerId: uuidv4,
projectTitle: string,
volunteerId: uuidv4,
volunteerName: string
```

Para publicar un mensaje de proyecto proximo a empezar:

* Routing Key: **project.start.near**

Estructura del mensaje:

```text
projectId: uuidv4,
organizerId: uuidv4,
projectTitle: string,
startDate: date (proveealo como un string en un formato de fecha compatible para JavaScript),
volunteerId: uuidv4,
```

Para publicar un mensaje de proyecto lleno:

* Routing Key: **project.full**

Estructura del mensaje:

```text
projectId: uuidv4,
organizerId: uuidv4,
projectTitle: uuidv4,
```
