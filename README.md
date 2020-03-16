# node-auth-service
An Auth Service that uses OAuth2.0 protocols written in Node.js, with flexible data storage options

This is a WIP, the features that are currently available are:
* Authorization Grant, without Scopes, and only implemented with MySQL, without migrations

Backlog of features to be implemented:
* User Management (add users, archive users, edit users, reset passwords)
* Issue Refresh token and use it to refresh a token 
* Implicit Grant
* Password Grant
* Client Grant
* Scopes
* DB Migrations
* Support for Mongo DB