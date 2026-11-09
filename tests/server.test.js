const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function loadRoutes(model) {
    const routes = {};
    const app = {
        use() {},
        set() {},
        get(url, handler) { routes[`GET ${url}`] = handler; },
        post(url, handler) { routes[`POST ${url}`] = handler; },
        listen(port, callback) { assert.equal(port, 3000); callback(); }
    };
    function express() { return app; }
    express.urlencoded = () => () => {};

    const code = fs.readFileSync(path.join(__dirname, '../server.js'), 'utf8');
    vm.runInNewContext(code, {
        process: { env: {} },
        require(name) {
            if (name === 'express') return express;
            if (name === './models/userDB') return model;
            throw new Error(`Unexpected dependency: ${name}`);
        },
        console: { log() {}, error() {} }
    }, { filename: 'server.js' });
    return routes;
}

function response() {
    return {
        statusCode: 200,
        status(code) { this.statusCode = code; return this; },
        send(message) { this.message = message; return this; },
        render(view, values) { this.view = view; this.values = values; return this; },
        redirect(url) { this.location = url; return this; }
    };
}

test('GET / lists database users', () => {
    const users = [{ userID: 3, fname: 'A', lname: 'B', username: 'a', passwd: 'pw' }];
    const routes = loadRoutes({ getUsers(callback) { callback(null, users); } });
    const res = response();
    routes['GET /']({}, res);
    assert.equal(res.view, 'manageUsers');
    assert.equal(res.values.users, users);
});

test('GET / reports database failure instead of rendering an invalid view', () => {
    const routes = loadRoutes({ getUsers(callback) { callback(new Error('down')); } });
    const res = response();
    routes['GET /']({}, res);
    assert.equal(res.statusCode, 500);
    assert.equal(res.view, undefined);
    assert.match(res.message, /Unable to load users/);
});

test('GET /users/new renders the separate Add User form', () => {
    const routes = loadRoutes({});
    const res = response();
    routes['GET /users/new']({}, res);
    assert.equal(res.view, 'addUser');
    assert.equal(res.values.error, null);
});

test('POST /users inserts the form data and redirects to the list', () => {
    let inserted;
    const routes = loadRoutes({
        addUser(user, callback) { inserted = user; callback(null, { userID: 20 }); }
    });
    const res = response();
    routes['POST /users']({ body: { fname: ' Jane ', lname: ' Doe ', username: ' jdoe ', passwd: 'pw' } }, res);
    assert.equal(inserted.fname, 'Jane');
    assert.equal(inserted.lname, 'Doe');
    assert.equal(inserted.username, 'jdoe');
    assert.equal(inserted.passwd, 'pw');
    assert.equal(res.location, '/');
});

test('POST /users rejects incomplete form without inserting', () => {
    const routes = loadRoutes({ addUser() { assert.fail('must not insert'); } });
    const res = response();
    routes['POST /users']({ body: { fname: 'Jane', lname: 'Doe', username: 'jdoe' } }, res);
    assert.equal(res.statusCode, 400);
    assert.equal(res.view, 'addUser');
    assert.match(res.values.error, /complete all four fields/i);
    assert.equal(res.values.values.username, 'jdoe');
    assert.equal(res.values.values.passwd, undefined);
});

test('POST /users rejects fields longer than SQL limits', () => {
    const routes = loadRoutes({ addUser() { assert.fail('must not insert'); } });
    const res = response();
    routes['POST /users']({ body: { fname: 'x'.repeat(51), lname: 'Doe', username: 'jdoe', passwd: 'pw' } }, res);
    assert.equal(res.statusCode, 400);
    assert.equal(res.view, 'addUser');
    assert.match(res.values.error, /maximum/i);
});

test('POST /users handles a duplicate username without crashing', () => {
    const routes = loadRoutes({ addUser(_user, callback) { callback(Object.assign(new Error('dup'), { code: 'ER_DUP_ENTRY' })); } });
    const res = response();
    routes['POST /users']({ body: { fname: 'Jane', lname: 'Doe', username: 'jdoe', passwd: 'pw' } }, res);
    assert.equal(res.statusCode, 409);
    assert.equal(res.view, 'addUser');
    assert.match(res.values.error, /already exists/);
});

test('POST /users handles unexpected database errors', () => {
    const routes = loadRoutes({ addUser(_user, callback) { callback(new Error('down')); } });
    const res = response();
    routes['POST /users']({ body: { fname: 'Jane', lname: 'Doe', username: 'jdoe', passwd: 'pw' } }, res);
    assert.equal(res.statusCode, 500);
    assert.equal(res.view, 'addUser');
});

test('POST /users/:id/delete deletes only the chosen user and redirects', () => {
    let chosenId;
    const routes = loadRoutes({ deleteUser(id, callback) { chosenId = id; callback(null, 1); } });
    const res = response();
    routes['POST /users/:id/delete']({ params: { id: '12' } }, res);
    assert.equal(chosenId, 12);
    assert.equal(res.location, '/');
});

test('POST delete rejects invalid IDs without touching the database', () => {
    const routes = loadRoutes({ deleteUser() { assert.fail('must not delete'); } });
    for (const id of ['0', '-1', 'abc', '1 OR 1=1', '9007199254740993']) {
        const res = response();
        routes['POST /users/:id/delete']({ params: { id } }, res);
        assert.equal(res.statusCode, 400, `Invalid ID ${id} must return 400`);
    }
});

test('POST delete responds 404 when record already does not exist', () => {
    const routes = loadRoutes({ deleteUser(_id, callback) { callback(null, 0); } });
    const res = response();
    routes['POST /users/:id/delete']({ params: { id: '8' } }, res);
    assert.equal(res.statusCode, 404);
    assert.equal(res.location, undefined);
});

test('POST delete handles database failure without redirecting', () => {
    const routes = loadRoutes({ deleteUser(_id, callback) { callback(new Error('down')); } });
    const res = response();
    routes['POST /users/:id/delete']({ params: { id: '8' } }, res);
    assert.equal(res.statusCode, 500);
    assert.equal(res.location, undefined);
});

test('no GET delete route is registered, preventing link-based deletions', () => {
    const routes = loadRoutes({});
    assert.equal(routes['GET /users/:id/delete'], undefined);
    assert.equal(typeof routes['POST /users/:id/delete'], 'function');
});
