DROP DATABASE IF EXISTS assignDB;
DROP USER IF EXISTS 'assignDBuser'@'localhost';
CREATE DATABASE assignDB;
USE assignDB;

CREATE USER 'assignDBuser'@'localhost' IDENTIFIED BY 'assignDBpass';
GRANT ALL ON assignDB.* TO 'assignDBuser'@'localhost';

-- Create the users table
CREATE TABLE users (
    userID INT AUTO_INCREMENT PRIMARY KEY,
    fname VARCHAR(50),
    lname VARCHAR(50),
    username VARCHAR(50) NOT NULL UNIQUE,
    passwd VARCHAR(255) NOT NULL
);

-- Insert sample users into users table
INSERT INTO users (fname, lname, username, passwd) VALUES
('John', 'Doe', 'jdoe', 'Password123!'),
('Jane', 'Smith', 'jsmith', 'SecurePass#99'),
('Michael', 'Johnson', 'mjohnson', 'monkey2026'),
('Emily', 'Davis', 'edavis', 'sunshine!'),
('James', 'Brown', 'jbrown', 'correct'),
('Sarah', 'Wilson', 'swilson', 'letmein123'),
('David', 'Martinez', 'dmartinez', 'password.1'),
('Jessica', 'Anderson', 'janderson', 'qwerty789'),
('Daniel', 'Taylor', 'dtaylor', 'ilovecats!'),
('Laura', 'Thomas', 'lthomas', 'football22'),
('Robert', 'Jackson', 'rjackson', 'admin12345'),
('Linda', 'White', 'lwhite', 'summer$2026'),
('William', 'Harris', 'wharris', 'dragonfly99'),
('Elizabeth', 'Martin', 'emartin', 'starwars01'),
('Joseph', 'Clark', 'jclark', 'hello_world'),
('Megan', 'Rodriguez', 'mrodriguez', 'secretpass!'),
('Charles', 'Lewis', 'clewis', 'baseball1'),
('Ashley', 'Lee', 'alee', 'butter#'),
('Thomas', 'Walker', 'twalker', 'p@ssword!99'),
('Amanda', 'Hall', 'ahall', 'coffeelover');
