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
