const express = require('express');
const userDB = require('./models/userDB');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: false }));
app.set('view engine', 'ejs');

// List the users from the database on the main page.
app.get('/', function (req, res) {
    userDB.getUsers(function (error, users) {
        if (error) {
            console.error('Unable to retrieve users:', error);
            return res.status(500).send('Unable to load users from the database.');
        }
        res.render('manageUsers', { users: users });
    });
});

// Assignment 8: show the Add User form on its own page.
app.get('/users/new', function (req, res) {
    res.render('addUser', { error: null, values: {} });
});

// Insert a new user and return to the list.
app.post('/users', function (req, res) {
    const body = req.body || {};
    const user = {
        fname: typeof body.fname === 'string' ? body.fname.trim() : '',
        lname: typeof body.lname === 'string' ? body.lname.trim() : '',
        username: typeof body.username === 'string' ? body.username.trim() : '',
        passwd: typeof body.passwd === 'string' ? body.passwd : ''
    };
    const values = { fname: user.fname, lname: user.lname, username: user.username };

    if (!user.fname || !user.lname || !user.username || !user.passwd) {
        return res.status(400).render('addUser', {
            error: 'Please complete all four fields.', values: values
        });
    }
    if (user.fname.length > 50 || user.lname.length > 50 || user.username.length > 50 || user.passwd.length > 255) {
        return res.status(400).render('addUser', {
            error: 'A field exceeds its maximum allowed length.', values: values
        });
    }

    userDB.addUser(user, function (error) {
        if (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(409).render('addUser', {
                    error: 'That username already exists.', values: values
                });
            }
            console.error('Unable to add user:', error);
            return res.status(500).render('addUser', {
                error: 'Unable to add user. Please check the database connection.', values: values
            });
        }
        res.redirect('/');
    });
});

// Assignment 8: only POST requests may delete records.
app.post('/users/:id/delete', function (req, res) {
    const id = String(req.params.id);
    if (!/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id))) {
        return res.status(400).send('Invalid user ID.');
    }

    userDB.deleteUser(Number(id), function (error, affectedRows) {
        if (error) {
            console.error('Unable to delete user:', error);
            return res.status(500).send('Unable to delete the user from the database.');
        }
        if (affectedRows === 0) return res.status(404).send('User not found.');
        res.redirect('/');
    });
});

app.listen(PORT, function () {
    console.log(`Listening on Port: ${PORT}`);
});
