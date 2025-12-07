const { Sequelize } = require('sequelize');


describe('Database Integration', () => {
  it('should connect to the database and run a simple query', async () => {
    const sequelize = new Sequelize('postgres://noteuser:notepassword@localhost:5433/notedb_test');
    await expect(sequelize.authenticate()).resolves.not.toThrow();

    const [result] = await sequelize.query('SELECT 1+1 AS result');
    expect(result[0].result).toBe(2);

    await sequelize.close();
  });

  it('should fail to connect with wrong credentials', async () => {
    const wrongSequelize = new Sequelize('postgres://wronguser:wrongpassword@localhost:5432/wrongdb');
    await expect(wrongSequelize.authenticate()).rejects.toThrow();

    await wrongSequelize.close();
  });
});
