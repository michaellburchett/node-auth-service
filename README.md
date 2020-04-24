# node-auth-service
An Auth Service that uses OAuth2.0 protocols written in Node.js, with flexible data storage options

This is a WIP, the features that are currently available are:
* Authorization & Implicit Grants, and only implemented with MySQL, without migrations

Backlog of features to be implemented:
* Password Grant
* Client Grant
* DB Migrations
* Support for Mongo DB, including refactoring how Models are handles