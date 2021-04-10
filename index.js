const express = require("express");
const mysql = require("mysql");
const cors = require("cors");
const bodyparser = require("body-parser");
const sqlparser = require("node-sql-parser");

const app = express();

app.use(cors());
app.use(bodyparser.json());

app.listen("3001", () => {
  console.log("server is running");
});

// Mysql database connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "bank_database",
});

//checking database connection
db.connect((error) => {
  if (error) throw error;
  else {
    console.log("database connected....");
  }
});

//REST api to deposite money
app.post("/api/deposite", (req, res) => {
  const reference_number = req.body.reference_number;
  var deposite = req.body.deposite;
  var withdraw = 0;
  var timestamp = new Date();
  var myResult = [];
  var referenceNumberResult = [];
  var current_balance = deposite - withdraw;
  var sumDeposite = [];

  db.query("SELECT reference_number from customer", (err, results) => {
    if (err) console.log(err);
    else {
      results = JSON.stringify(results);
      results = JSON.parse(results);
    }
    myResult = results;
    console.log(myResult);

    if (deposite < 1) {
      return res.send({
        status: "FAIL",
        message: "Enter Amount Greater than 1",
      });
    }

    if (myResult.find((it) => it.reference_number == reference_number)) {
      db.query(
        `SELECT SUM(deposite) AS deposite FROM transaction
            WHERE   timestamp >= CURDATE() - INTERVAL 1 DAY
            AND reference_number='${reference_number}'`,
        (err, results) => {
          if (err) console.log(err);
          else {
            //console.log(results);
            results = JSON.stringify(results);
            // console.log(results);
            results = JSON.parse(results);
            console.log(results);

            if (results[0].deposite < 50000) {
              db.query(
                "INSERT INTO transaction(reference_number, deposite, withdraw, current_balance, timestamp) VALUES(?,?,?,?,?)",
                [
                  reference_number,
                  deposite,
                  withdraw,
                  current_balance,
                  timestamp,
                ],
                (err, result) => {
                  if (err) console.log(err);
                  else {
                    db.query(
                      `SELECT SUM(deposite) as deposite FROM transaction WHERE reference_number='${reference_number}'`,
                      (err, results) => {
                        if (err) console.log(err);
                        else {
                          //console.log(results);
                          results = JSON.stringify(results);
                          // console.log(results);
                          results = JSON.parse(results);
                          console.log(results);
                          res.send({
                            status: "SUCCESS",
                            message: "Deposited successful.",
                            balance: `Your updated balance is:${results[0].deposite}`,
                          });
                        }
                      }
                    );
                  }
                }
              );
            } else {
              res.send({
                status: "FAIL",
                message: "Limit Exceed...",
              });
            }
          }
        }
      );
    } else {
      res.send({
        status: "FAIL",
        message: "Reference Number Not Matched..",
      });
    }
  });
});

//REST api for withdraw money
app.post("/api/withdraw", (req, res) => {
  const reference_number = req.body.reference_number;
  var withdraw = req.body.withdraw;
  var deposite = 0;
  var timestamp = new Date();
  var myResult = [];
  var current_balance = 0;
  var updatedBalance = 0;

  db.query("SELECT reference_number from customer", (err, results) => {
    if (err) console.log(err);
    else {
      results = JSON.stringify(results);
      results = JSON.parse(results);
    }
    myResult = results;

    if (withdraw < 1) {
      return res.send({
        status: "FAIL",
        message: "Enter Amount Greater than 1",
      });
    }

    if (myResult.find((it) => it.reference_number == reference_number)) {
      db.query(
        `SELECT SUM(deposite) - SUM(withdraw) deposite FROM transaction WHERE reference_number='${reference_number}'`,
        (err, results) => {
          if (err) console.log(err);
          else {
            results = JSON.stringify(results);
            results = JSON.parse(results);

            current_balance = results;
            updatedBalance = current_balance[0].deposite - withdraw;

            if (results[0].deposite >= withdraw) {
              db.query(
                `SELECT SUM(withdraw) AS withdraw FROM transaction
                            WHERE   timestamp >= CURDATE() - INTERVAL 1 DAY
                            AND reference_number='${reference_number}'`,
                (err, results) => {
                  if (err) console.log(err);
                  else {
                    results = JSON.stringify(results);
                    results = JSON.parse(results);

                    if (results[0].withdraw < 10000) {
                      db.query(
                        "INSERT INTO transaction(reference_number, deposite, withdraw, current_balance, timestamp) VALUES(?,?,?,?,?)",
                        [
                          reference_number,
                          deposite,
                          withdraw,
                          updatedBalance,
                          timestamp,
                        ],
                        (err, result) => {
                          if (err) console.log(err);
                          else {
                            db.query(
                              `SELECT SUM(deposite) - sum(withdraw) as withdraw FROM transaction WHERE reference_number='${reference_number}'`,
                              (err, results) => {
                                if (err) console.log(err);
                                else {
                                  results = JSON.stringify(results);
                                  results = JSON.parse(results);
                                  res.send({
                                    status: "SUCCESS",
                                    message: "Withdraw successful.",
                                    balance: `Your updated balance is:${results[0].withdraw}`,
                                  });
                                }
                              }
                            );
                          }
                        }
                      );
                    } else {
                      res.send({
                        status: "FAIL",
                        message: "Withdrawal Limit Exceed...",
                      });
                    }
                  }
                }
              );
            } else {
              res.send({
                status: "FAIL",
                message: "Insufficient Funds....",
              });
            }
          }
        }
      );
    } else {
      res.send({
        status: "FAIL",
        message: "Reference Number Not Matched..",
      });
    }
  });
});

//REST API to check account balance
app.get("/api/balance/:reference_number", (req, res) => {
  //console.log(req.params.reference_number);
  var myResult = [];

  db.query("SELECT reference_number from customer", (err, results) => {
    if (err) console.log(err);
    else {
      //console.log(results);
      results = JSON.stringify(results);
      // console.log(results);
      results = JSON.parse(results);
    }
    myResult = results;
    // console.log(myResult);

    if (
      myResult.find((it) => it.reference_number == req.params.reference_number)
    ) {
      db.query(
        `SELECT SUM(deposite) - SUM(withdraw) as Balance FROM transaction WHERE reference_number='${req.params.reference_number}'`,
        (err, result) => {
          if (err) console.log(err);
          else {
            res.send(result);
          }
        }
      );
    } else {
      res.send({
        status: "FAIL",
        message: "Please Enter Correct Reference Number",
      });
    }
  });
});

// REST api for adding customer details in database
app.post("/api/register", (req, res) => {
  const reference_number = req.body.reference_number;
  const first_name = req.body.first_name;
  const last_name = req.body.last_name;
  const email_id = req.body.email_id;
  const address = req.body.address;

  db.query(
    "INSERT INTO customer(reference_number, first_name, last_name, email_id, address) VALUES(?,?,?,?,?)",
    [reference_number, first_name, last_name, email_id, address],
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.send({
          status: "SUCCESS",
          message: "Customer added...",
        });
      }
    }
  );
});

//getting customers data from database
app.get("/api/customers", (req, res) => {
  db.query("SELECT * FROM customer", (err, result) => {
    if (err) {
      console.log(err);
    } else {
      res.send(result);
    }
  });
});
