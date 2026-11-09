const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function loadModel(queryHandler, environment = {}) {
    let poolConfig;
    const code = fs.readFileSync(path.join(__dirname, '../models/userDB.js'), 'utf8');
    const module = { exports: {} };
    const context = {
        module,
        exports: module.exports,
        process: { env: environment },
        require(name) {
            assert.equal(name, 'mysql2');
            return {
                createPool(config) {
                    poolConfig = config;
                    return { query: queryHandler };
                }
            };
        }
    };
    vm.runInNewContext(code, context, { filename: 'models/userDB.js' });
    return { db: module.exports, poolConfig };
}

test('model config matches provided assignDB.sql', () => {
    const { poolConfig } = loadModel(() => {});
    assert.equal(poolConfig.host, 'localhost');
    assert.equal(poolConfig.user, 'assignDBuser');
    assert.equal(poolConfig.password, 'assignDBpass');
    assert.equal(poolConfig.database, 'assignDB');
});

test('model can use environment variables for alternate VM credentials', () => {
    const { poolConfig } = loadModel(() => {}, {
        DB_HOST: '127.0.0.1', DB_USER: 'testing', DB_PASSWORD: 'pw', DB_NAME: 'testingDB'
    });
    assert.equal(poolConfig.host, '127.0.0.1');
    assert.equal(poolConfig.user, 'testing');
    assert.equal(poolConfig.password, 'pw');
    assert.equal(poolConfig.database, 'testingDB');
});

test('getUsers selects all five columns and calls back with rows', () => {
    const rows = [{ userID: 1, fname: 'Jane', lname: 'Smith', username: 'jsmith', passwd: 'pw' }];
    const { db } = loadModel((sql, callback) => {
        assert.match(sql, /^SELECT userID, fname, lname, username, passwd FROM users ORDER BY userID$/);
        callback(null, rows);
    });
    db.getUsers((err, users) => {
        assert.equal(err, null);
        assert.equal(users, rows);
    });
});

test('getUsers passes database errors to caller', () => {
    const issue = new Error('cannot connect');
    const { db } = loadModel((_sql, callback) => callback(issue));
    db.getUsers((err) => assert.equal(err, issue));
});

test('addUser uses a parameterized INSERT and returns new ID', () => {
    const user = { fname: 'Jane', lname: 'Smith', username: "xx' OR 1=1 --", passwd: 'secret' };
    const { db } = loadModel((sql, values, callback) => {
        assert.equal(sql, 'INSERT INTO users (fname, lname, username, passwd) VALUES (?, ?, ?, ?)');
        assert.deepEqual(Array.from(values), ['Jane', 'Smith', "xx' OR 1=1 --", 'secret']);
        callback(null, { insertId: 42 });
    });
    db.addUser(user, (err, result) => {
        assert.equal(err, null);
        assert.equal(result.userID, 42);
    });
});

test('addUser propagates SQL errors', () => {
    const issue = Object.assign(new Error('duplicate username'), { code: 'ER_DUP_ENTRY' });
    const { db } = loadModel((_sql, _values, callback) => callback(issue));
    db.addUser({ fname: 'A', lname: 'B', username: 'a', passwd: 'pw' }, (err) => {
        assert.equal(err, issue);
    });
});

test('deleteUser uses the selected userID in a parameterized DELETE', () => {
    const { db } = loadModel((sql, values, callback) => {
        assert.equal(sql, 'DELETE FROM users WHERE userID = ?');
        assert.deepEqual(Array.from(values), [12]);
        callback(null, { affectedRows: 1 });
    });
    db.deleteUser(12, (err, affectedRows) => {
        assert.equal(err, null);
        assert.equal(affectedRows, 1);
    });
});

test('deleteUser reports zero rows for a missing record', () => {
    const { db } = loadModel((_sql, _values, callback) => callback(null, { affectedRows: 0 }));
    db.deleteUser(999, (err, count) => {
        assert.equal(err, null);
        assert.equal(count, 0);
    });
});

test('deleteUser propagates SQL errors', () => {
    const issue = new Error('permission denied');
    const { db } = loadModel((_sql, _values, callback) => callback(issue));
    db.deleteUser(5, (err) => assert.equal(err, issue));
});
