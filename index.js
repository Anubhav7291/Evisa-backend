import express from "express";
import mysql from "mysql";
import cors from "cors";
import cookieParser from "cookie-parser";

import jwt from "jsonwebtoken";
import path from "path";
import multer from "multer";
import nodemailer from  'nodemailer'

const app = express();

app.use(cookieParser());
app.use(express.json());
app.use(express.static("public"));

const con = mysql.createConnection({
  host: "sql6.freemysqlhosting.net",
  port:3306,
  user: "sql6642381",
  password: "kSnrwBN9IH",
  database: "sql6642381",
});

var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'anubh896@gmail.com',
    pass: 'jgyleylimjtvirqb'
  }
});

var mailOptions = {
  from: 'anubh896@gmail.com',
  to: 'anubh896@gmail.com',
  subject: 'Sending Email test',
  html: `<!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Continue you application</title>
  </head>
  <body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5;">
  
      <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 10px; box-shadow: 0px 3px 5px rgba(0,0,0,0.1);">
          <tr>
              <td align="center" bgcolor="#2c3e50" style="padding: 30px 0;">
                  <h1 style="color: #ffffff;">Continue your application</h1>
              </td>
          </tr>
          <tr>
              <td style="padding: 20px;">
                  <p>Dear [Recipient's Name],</p>
                  <p>
  You have incomplete eVisa application for India.
  Your temporary application reference is: TMP230817212818601
  Please click on the link below to resume your application:</p>
                  <p>To get started, simply click the button below:</p>
                  <p align="center">
                      <a href="Your_Link_Here" style="display: inline-block; padding: 10px 20px; background-color: #3498db; color: #ffffff; text-decoration: none; border-radius: 5px;">Resume Application</a>
                  </p>
                  <p>By clicking the button, you'll be directed to our your application</p>
                 
                  <p>Best regards,<br>E-visa support<br>123456789</p>
              </td>
          </tr>
      </table>
  
  </body>
  </html> 
`
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/images");
  },
  filename: (req, file, cb) => {
    cb(
      null,
      file.fieldname + "_" + Date.now() + path.extname(file.originalname)
    );
  },
});

const upload = multer({
  storage: storage,
});

con.connect(function (err) {
  if (err) {
    console.log("Error in Connection", err);
  } else {
    console.log("Connected");
  }
});

app.post("/login", (req, res) => {
  const sql = "SELECT * FROM users Where email = ? AND  password = ?";
  con.query(sql, [req.body.email, req.body.password], (err, result) => {
    if (err)
      return res.json({ Status: "Error", Error: "Error in runnig query" });
    if (result.length > 0) {
      const id = result[0].id;
      const token = jwt.sign({ role :'admin' }, "jwt-secret", { expiresIn: "1d" });
      res.cookie("token", token);

      return res.json({ Status: "Success" });
    } else {
      console.log(result, req.body.email, req.body.password);
      return res.json({ Status: "Error", Error: "Wrong Email or Password" });
    }
  });
});


app.get("/logout", (req, res) => {
  res.clearCookie("token");
  return res.json({ Status: "Success" });
});

app.get("/adminCount", (req, res) => {
  const sql = "Select count(id) as admin from users";
  con.query(sql, (err, result) => {
    if (err) return res.json({ Error: "Err" });
    return res.json(result);
  });
});

app.get("/employeeCount", (req, res) => {
  const sql = "Select count(id) as employee from employee";
  con.query(sql, (err, result) => {
    if (err) return res.json({ Error: "Err" });
    return res.json(result);
  });
});
app.get("/salarySum", (req, res) => {
  const sql = "Select sum(salary) sumOfSalary from employee";
  con.query(sql, (err, result) => {
    if (err) return res.json({ Error: "Err" });
    return res.json(result);
  });
});
const verifyUser = (req, res, next) => {
  const token = req.cookies.token;
  console.log(token);
  if (!token) {
    return res.json({ Error: " You are not Authenticated" });
  } else {
    jwt.verify(token, "jwt-secret", (err, decoded) => {
      if (err) return res.json({ Error: "Wrong token" });
      req.role = decoded.role;
      req.id = decoded.id
      next();
    });
  }
};

app.get("/dashboard", verifyUser, (req, res) => {
  return res.json({ Status: "Success", role: req.role, id: req.id});
});

app.get('/tempId/:id', (req,res) => {
  const sql = "SELECT * from customer where TempId = ?";
  const id = req.params.id;
  con.query(sql, [id],(err, result) => {
    if (err) return res.json({ Error: "Error!" });
    return res.json({ Status: "Success", Result: result });
  });
})

app.get("/getEmployees", (req, res) => {
  const sql = "SELECT * from employee";
  con.query(sql, (err, result) => {
    if (err) return res.json({ Error: err });
    return res.json({ Status: "Success", result: result });
  });
});

app.post("/create", (req, res) => {
  let tempId = 'TMP' + Math.floor(Math.random() * 1000000000);
  const sql =
    "INSERT INTO customer (`TempId`,`name`, `firstName`, `nationality`, `portOfArrival`, `dob`,`email`, `mobileCode`, `phoneNumber`, `edoa`, `visaService`, `visaOptions`) VALUES (?)";
    const values = [
      tempId,
      req.body.name,
      req.body.firstName,
      req.body.nationality,
      req.body.portOfArrival,
      req.body.dob,
      req.body.email,
      req.body.mobileCode,
      req.body.phoneNumber,
      req.body.EDOA,
      req.body.visaService,
      req.body.visaOptions,
    ];
    con.query(sql, [values], (err, result) => {
      if (err) return res.json({ Error: err });
      if(result){
        var mailOptions = {
          from: 'anubh896@gmail.com',
          to: req.body.email,
          subject: `eVisa India- Pending eVisa Application for ${req.body.firstName} ${req.body.name}`,
          html: `<!DOCTYPE html>
          <html lang="en">
          <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Continue you application</title>
          </head>
          <body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5;">
          
              <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 10px; box-shadow: 0px 3px 5px rgba(0,0,0,0.1);">
                  <tr>
                      <td align="center" bgcolor="#2c3e50" style="padding: 30px 0;">
                          <h1 style="color: #ffffff;">Continue your application</h1>
                      </td>
                  </tr>
                  <tr>
                      <td style="padding: 20px;">
                          <p>Dear ${req.body.firstName} ${req.body.name},</p>
                          <p>
          You have incomplete eVisa application for India.
          Your temporary application reference is: ${tempId}
          Please click on the link below to resume your application:</p>
                          <p>To get started, simply click the button below:</p>
                          <p align="center">
                              <a href="https://master--iridescent-fox-f31d24.netlify.app/register/${tempId}" style="display: inline-block; padding: 10px 20px; background-color: #3498db; color: #ffffff; text-decoration: none; border-radius: 5px;">Resume Application</a>
                          </p>
                          <p>By clicking the button, you'll be directed to our your application</p>
                         
                          <p>Best regards,<br>E-visa support<br>123456789</p>
                      </td>
                  </tr>
              </table>
          
          </body>
          </html> 
        `
        };
        


        transporter.sendMail(mailOptions, function(error, info){
          if (error) {
            console.log(error)
            return res.json({message:"Error sending mail"})
          } else {
            con.query('INSERT INTO passportdetails (id) VALUES (?)', [tempId], (err) => {
              if (err) throw err;
              console.log(tempId)
              return res.json({message: "Success", tempId: tempId})
            })
            
          }
        });
      }
    });
  });


app.put("/update/:id", (req, res) => {
  const id = req.params.id;
  console.log(id)
  const sql =
  "UPDATE customer SET name = ?, firstName = ?, nationality = ?, portOfArrival = ?, dob = ?,email = ? , mobileCode = ?, phoneNumber = ?, edoa = ?, visaService = ?, visaOptions = ? WHERE TempId = ?";
  const values = [
    req.body.name,
    req.body.firstName,
    req.body.nationality,
    req.body.portOfArrival,
    req.body.dob,
    req.body.email,
    req.body.mobileCode,
    req.body.phoneNumber,
    req.body.EDOA,
    req.body.visaService,
    req.body.visaOptions,
    id
  ];
  con.query(sql, values, (err, result) => {
    if (err) return res.json({ Error: err });
    if(result){
    const sql =
  "UPDATE passportdetails  SET citizenship = ?,city = ?,country = ?,expiryDate = ?,issueCountry = ?,issueDate = ?,mark = ?,otherDateOfIssue = ?,otherNationality = ?,otherPassportNumber = ?,otherPlaceIssue = ?,passportNumber = ?,qualification = ?,religion = ? WHERE id = ?"

  const values = [
    req.body.passportDetails.citizenship,
    req.body.passportDetails.city,
    req.body.passportDetails.country,
    req.body.passportDetails.expiryDate,
    req.body.passportDetails.issueCountry,
    req.body.passportDetails.issueDate,
    req.body.passportDetails.mark,
    req.body.passportDetails.otherDateOfIssue,
    req.body.passportDetails.otherNationality,
    req.body.passportDetails.otherPassportNumber,
    req.body.passportDetails.otherPlaceIssue,
    req.body.passportDetails.passportNumber,
    req.body.passportDetails.qualification,
    req.body.passportDetails.religion,
    id
  ];
  con.query(sql, values, (err, result) => {
    if (err) return res.json({ Error: err });
  
    return res.json({message:"Success"})
  })}
  });
});

app.listen(8081, () => {
  console.log("Running");
});
