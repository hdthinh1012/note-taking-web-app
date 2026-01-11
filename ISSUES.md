# Notes for issues I met while coding this project
## Name mismatch between Sequelize table initialization and query mapping
In the model User.js in db-migration, I set the table name as User, this model is used to map ORM code into SQL queries, for example sso.create(data) -> INSERT INTO "Users" (...)

The table name is treated by Sequelized as delimited identifier not normal one, meaning it will be always wrapped by double quote \" 

But in the migration files, I created the table with the code line `await queryInterface.createTable('users', {` with a lower cased name. Since table name is treated as delimited identifer, the correct way to reference the table must be "users", using "Users" will get the ERROR table does not exist.

So the fix was rename the model name to 'user'

## Not able to connect to redis://localhost:6379
The localhost in FEDORA 43 was by default map to ::1 IPV6 address, while the redis container is listening to 127.0.0.1:6379.

Why IPv4 and IPv6 loopback addr are treated as 2 seperated entities in FEDORA is still a mystery to me, but the fix is changing to redis://127.0.0.1:6379