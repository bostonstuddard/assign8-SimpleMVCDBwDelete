const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const list = fs.readFileSync(path.join(__dirname, '../views/manageUsers.ejs'), 'utf8');
const add = fs.readFileSync(path.join(__dirname, '../views/addUser.ejs'), 'utf8');

test('user list links to new user page instead of embedding add form', () => {
    assert.match(list, /href="\/users\/new"/);
    assert.doesNotMatch(list, /action="\/users"\s+method="post"/);
});

test('list has per-user POST delete form guarded by JS confirmation', () => {
    assert.match(list, /action="\/users\/<%= user\.userID %>\/delete" method="post"/);
    assert.match(list, /onsubmit="return confirm\('/);
    assert.match(list, /type="submit">Delete<\/button>/);
    assert.doesNotMatch(list, /href="\/users\/.+\/delete"/);
});

test('list displays all five database columns', () => {
    for (const name of ['userID', 'fname', 'lname', 'username', 'passwd']) {
        assert.ok(list.includes(`<%= user.${name} %>`), `Missing ${name} column`);
    }
});

test('add user form is its own page and posts the four fields', () => {
    assert.match(add, /action="\/users" method="post"/);
    for (const name of ['fname', 'lname', 'username', 'passwd']) {
        assert.match(add, new RegExp(`name="${name}"`));
    }
    assert.match(add, /type="password"/);
    assert.match(add, /href="\/">Cancel<\/a>/);
});

test('EJS uses escaped output for displayed data', () => {
    assert.doesNotMatch(list, /<%-\s*user\./);
    assert.doesNotMatch(add, /<%-\s*values\./);
});
