const express = require('express');
const router = express.Router();
const mysql = require('mysql');
const bcrypt = require('bcrypt');
const saltRounds = 10;


const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

//establish the connection to the database
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'huskytech'
});
//log whether the connection is successful
connection.connect(function (err) {
    if (err) {
        console.error('Error connecting to database server: ' + err.stack);
        return;
    }
    console.log('Connected to database server as id ' + connection.threadId);
});

router.get('/signup', function (req,res,next) {
    res.send("hello");
})

//check if username exists, if not add it to database, adding a salted and hashed password
router.post('/signup', function (req, res, next) {
    console.log("got here");
    let firstName = req.body.firstName;
    let lastName = req.body.lastName;
    let username = req.body.username;
    let password = req.body.password;
    console.log("asd");
    
    //get all users for customers and employees, if it matches, send response with error
    connection.query('SELECT User.username FROM USERS UNION SELECT Employee.username FROM Employee', function (error, results, fields) {
        if (error) {
            console.log("1" + error);
            res.json({
                status: 'failure',
                body: "Something went wrong with the server's database."
            })
        } else {
            let returnArr = [];
            results.forEach(element => {
                returnArr.push(element.username);
            })
            console.log(returnArr);
            if (returnArr.includes(username)) {
                res.json({
                    status: 'failure',
                    body: "Please choose a non-existing username."
                })
            } else { //if original username, add it to database 
                let sqlString;
                bcrypt.genSalt(saltRounds, function (err, salt) { //generate salt and hash
                    bcrypt.hash(password, salt, function (err, hash) {

                        // Store hash into database
                        sqlString = 'INSERT INTO Customers (registrationid, firstName, lastName, userName, passKey, salt) VALUES'
                            + ' ' + connection.escape(username) + ', ' + connection.escape(firstName) + ', ' +
                            connection.escape(lastName) + ', ' + hash + ', ' + salt + ')';
                        connection.query(sqlString, function (error, results, fields) {
                            if (error) {
                                console.log("2" + error);
                                res.json({
                                    status: 'failure',
                                    body: "Something went wrong with the server's database."
                                })
                            } else {
                                
                            }
                        });
                    });
                });
            }
        }
    });
});

//login in requests
router.post('/login', function (req, res, next) {
    connection.query('SELECT Customer.username FROM Customer', function (error, results, fields) {
        let username = req.body.username;
        let password = req.body.password;
        if (error) {
            res.json({
                status: 'failure',
                body: "Something went wrong with the server's database."
            })
        } else { //get all the usernames of customers, if its a match then compare the passwords
            let userArr = [];
            results.forEach(element => {
                userArr.push(element.username);
            })
            console.log(returnArr);
            if (userArr.includes(username)) { //if in usernames of customers
                connection.query('SELECT Customer.password FROM Customer ' +
                    'WHERE Customer.username = ' + connection.escape(username), function (error, results, fields) {
                        let myhash = results[0].password;
                        bcrypt.compare(password, myhash, function (err, result) {
                            if (result) {
                                res.redirect('/u-home');
                            } else {
                                res.json({
                                    status: 'failure',
                                    body: "Invalid username and/or password. Try again."
                                })
                            }
                        });
                    });
            } else { //else get all the usernames of employees, if its a match compare the passwords in employee table
                connection.query('SELECT Employee.username FROM Employee', function (error, results, fields) {
                    if (error) {
                        res.json({
                            status: 'failure',
                            body: "Something went wrong with the server's database."
                        })
                    } else {
                        let employeeArr = [];
                        results.forEach(element => {
                            employeeArr.push(element.username);
                        })
                        console.log(returnArr);
                        if (employeeArr.includes(username)) {
                            connection.query('SELECT Employee.password FROM Employee ' +
                                'WHERE Employee.username = ' + connection.escape(username), function (error, results, fields) {
                                    let myhash = results[0].password;
                                    bcrypt.compare(password, myhash, function (err, result) {
                                        if (result) {
                                            res.redirect('/e-home');
                                        } else {
                                            res.json({
                                                status: 'failure',
                                                body: "Invalid username and/or password. Try again."
                                            })
                                        }
                                    });
                                });
                        } else {
                            res.json({
                                status: 'failure',
                                body: "Invalid username and/or password. Try again."
                            })
                        }
                    }
                })
            }
        }
    });
});

//task queries entry point for employees
router.post('/employee', function (req, res, next) {
    let request = req.body.taskQueryNum;
    switch (request) {
        case 1:
            break;
        case 2:
            break;
        default:
            res.json({
                status: "failure",
                body: "Invalid query."
            })
    }
    connection.query('SELECT FROM EMPLOYEE', function (error, results, fields) {
        if (error) throw error;
        console.log('The solution is: ', results[0].solution);
    });
});

//for users carts 
router.post('/users', function (req, res, next) {
    let user = req.body.username;
    let cartNumber = req.body.orderNumber;
    connection.query('SELECT * FROM ORDER' +
        " WHERE Order.CustomerId = " + connection.escape(user) + " AND Order.OrderNum = " + connection.escape(cartNumber),
        function (error, result, fields) {
            if (error) throw error;
            let returnArr = [];
            result.forEach(element => {
                let obj = {};
                for (const key in element) {
                    obj[key] = element[key];
                }
                returnArr.push(obj);
            })
            res.json({
                status: 'success',
                response: returnArr
            });
            res.end();
        });
});

router.post('/search-bar', function (req, res, next) {
    let body = req.body;
    let city = body[0];
    let state = body[1];
    let zip = body[2];
    let sortBy = body[3];
    let filter = body[4];

    finalList = [];

    if (sortBy === "DESC") {
        sortBy = "MerchandiseType.price DESC";
    } else {
        sortBy = "MerchandiseType.price";
    }

    if (filter.length === 0) {
        'UPDATE users SET foo = ?, bar = ?, baz = ? WHERE id = ?'
        connection.query('SELECT MerchandiseType.brand, MerchandiseType.model, MerchandiseType.price ' +
            'FROM Merchandise ' +
            'INNER JOIN Store ON (Store.City = Merchandise.shelfCity AND Store.State = Merchandise.shelfState AND Store.Zip = Merchandise.shelfZip) ' +
            'INNER JOIN MerchandiseType ON (MerchandiseType.brand = Merchandise.brandType AND MerchandiseType.model = Merchandise.modelType) ' +
            'WHERE Store.City = ? AND Store.State = ? AND Store.Zip = ? ' +
            'ORDER BY ?', [city, state, zip, sortBy], function (error, results, fields) {
                if (error) throw error;
                let returnArr = [];
                results.forEach(element => {
                    let obj = {};
                    for (const key in element) {
                        obj[key] = element[key];
                    }
                    returnArr.push(obj);
                })
                res.json({
                    status: 'success',
                    body: returnArr
                })
            });
    } else {
        filter.forEach(merchType => {
            connection.query('SELECT merchandiseType.brand, merchandiseType.model, merchandiseType.price ' +
                'FROM Merchandise ' +
                'INNER JOIN Store ON (Store.City = Merchandise.shelfCity AND Store.State = Merchandise.shelfState AND Store.Zip = Merchandise.shelfZip) ' +
                'INNER JOIN merchandiseType ON (MerchandiseType.brand = Merchandise.brandType AND MerchandiseType.model = Merchandise.modelType) ' +
                'INNER JOIN ? ON (?.brand = merchandiseType.brand AND ?.model = merchandise.model) ' +
                'WHERE Store.City = ? AND Store.State = ? AND Store.Zip = ? ' +
                'ORDER BY ?', [city, state, zip, merchType, merchType, merchType, sortBy], function (error, results, fields) {
                    if (error) throw error;
                    let returnArr = [];
                    results.forEach(element => {
                        let obj = {};
                        for (const key in element) {
                            obj[key] = element[key];
                        }
                        returnArr.push(obj);
                    })
                   finalList.concat(returnArr);
                });
        })
        res.json({
            status: 'success',
            body: finalList
        })
        res.end();
    }
})

module.exports = router;
