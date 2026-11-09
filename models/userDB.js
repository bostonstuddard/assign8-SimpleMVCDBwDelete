const mysql = require('mysql2');

// Assignment 8 keeps the same MySQL database and callback style as Assignment 7.
const db = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'assignDBuser',
    password: process.env.DB_PASSWORD || 'assignDBpass',
    database: process.env.DB_NAME || 'assignDB'
});

// SELECT: return the users to the management page.
function getUsers(callback) {
    const sql = 'SELECT userID, fname, lname, username, passwd FROM users ORDER BY userID';
    db.query(sql, function (error, rows) {
        callback(error, rows);
    });
}

// INSERT: values are sent separately from SQL to prevent injection.
function addUser(user, callback) {
    const sql = 'INSERT INTO users (fname, lname, username, passwd) VALUES (?, ?, ?, ?)';
    const values = [user.fname, user.lname, user.username, user.passwd];
    db.query(sql, values, function (error, result) {
        if (error) return callback(error);
        callback(null, { userID: result.insertId });
    });
}

// DELETE: delete exactly the selected user by primary key, never by name.
function deleteUser(userID, callback) {
    const sql = 'DELETE FROM users WHERE userID = ?';
    db.query(sql, [userID], function (error, result) {
        if (error) return callback(error);
        callback(null, result.affectedRows);
    });
}

module.exports = { getUsers, addUser, deleteUser };
