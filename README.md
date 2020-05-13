# node-auth-service
An Auth Service that uses OAuth2.0 protocols written in Node.js, with flexible data storage options

This is a WIP, the features that are currently available are:
* Authorization & Implicit Grants, and only implemented with MySQL

Backlog of features to be implemented:
* Support for Mongo DB, including refactoring how Models are handled
* Mongo DB Migrations
* Can toggle off unwanted grants/exchanges
* Permissions/Scopes
* * Users cannot authenticate with Clients for which they are not authorized to
* * Users are only allowed to perform allowed actions based on clients (user has many clients and vice-versa)
* * super-users, that can manage user's permissions (based on Client)