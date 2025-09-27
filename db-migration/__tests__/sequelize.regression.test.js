const { Sequelize } = require('sequelize');
const { Client } = require('pg');

describe('Database Integration', () => {
    const client = new Client({
        user: 'noteuser',
        password: 'notepassword',
        host: 'localhost',
        port: 5433,
        database: 'notedb_test' // connect to default db
    });
    const sequelize = new Sequelize('postgres://noteuser:notepassword@localhost:5433/notedb_test');

    beforeAll(async () => {
        // await client.query('CREATE DATABASE notedb_test');
        await client.end();
        await sequelize.authenticate();
    }, 20000);

    it('sequelize should connect to the test database and run a simple query', async () => {
        await sequelize.authenticate();
        const [result] = await sequelize.query('SELECT 1+1 AS result');
        expect(result[0].result).toBe(2);
    });

    it('sequelize run all migrations successfully', async () => {
        const { Umzug, SequelizeStorage } = require('umzug');
        const path = require('path');

        const umzug = new Umzug({
            migrations: {
                glob: 'migrations/*.js',
                params: [
                    sequelize.getQueryInterface(), 
                    Sequelize
                ],
            },
            context: sequelize.getQueryInterface(),
            storage: new SequelizeStorage({sequelize}),
            logger: console,
        });

        const migrations = await umzug.pending();
        console.log('All migrations:', path.join(__dirname, '../migrations/*.js'));
        console.log('Pending migrations:', migrations.map(m => m.name));

        await umzug.up();

        const [tables] = await sequelize.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);
        const tableNames = tables.map(t => t.table_name);
        expect(tableNames).toEqual(
            expect.arrayContaining(['users', 'ssos'])
        );
    });

    afterAll(async () => {
        await sequelize.close();
        await client.connect();
        // await client.query('DROP DATABASE IF EXISTS notedb_test');
        await client.end();
    });
});
