import express from "express";
import mysql from "mysql";
import cors from "cors";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import path from "path";
import multer from "multer";
import nodemailer from "nodemailer";

const app = express();
app.use(express.urlencoded({ extended: true }));

const storage = multer.memoryStorage(); // Store files in memory
const upload = multer({ storage: storage,limits: { fileSize: 5 * 1024 * 1024 }
 });
// app.use(
//   cors({
//     allowedHeaders:["*"],
//     allowedOrigins :['*'],
//     methods: ["POST", "GET", "PUT"],
//     credentials: true,
//   })
// );
app.use(cors());
app.use(cookieParser());
app.use(express.json());

app.use(express.static("public"));
const con = mysql.createConnection({
  host: "sql12.freemysqlhosting.net",
  port: 3306,
  user: "sql12648426",
  password: "F2bbAMrWMF",
  database: "sql12648426",
});

// const con = mysql.createConnection({
//   host: "localhost",
//   port: 3306,
//   user: "root",
//   password: "",
//   database: "test",
// });

var transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "anubh896@gmail.com",
    pass: "jgyleylimjtvirqb",
  },
});

var mailOptions = {
  from: "anubh896@gmail.com",
  to: "anubh896@gmail.com",
  subject: "Sending Email test",
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
`,
};

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
      const token = jwt.sign({ role: "admin" }, "jwt-secret", {
        expiresIn: "1d",
      });
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

app.get('/getip', (req, res) => {
  const ipAddress = req.ip; // Client's IP address
  res.json({ ip: ipAddress });
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
      req.id = decoded.id;
      next();
    });
  }
};

app.get("/dashboard", verifyUser, (req, res) => {
  return res.json({ Status: "Success", role: req.role, id: req.id });
});

app.get("/tempId/:id", (req, res) => {
  const sql = "SELECT * from customer where TempId = ?";
  const id = req.params.id;
  con.query(sql, [id], (err, result) => {
    if (err) return res.json({ Error: "Error!" });
    return res.json({ Status: "Success", Result: result });
  });
});

app.get("/getLeads", (req, res) => {
  const sql =
    "SELECT customer.*, passportdetails.*, otherdetails.*, paymentdetails.* FROM customer INNER JOIN passportdetails ON customer.TempId = passportdetails.id INNER JOIN otherdetails ON customer.TempId = otherdetails.id  INNER JOIN paymentdetails ON customer.TempId = paymentdetails.id";
  con.query(sql, (err, result) => {
    console.log("call")
    if (err) return res.json({ Error: err });
    console.log("result")
    return res.json({ Status: "Success", result: result });
  });
});

app.post("/create", (req, res) => {
  let tempId ="IVS" + Math.floor(Math.random() * 1000000000);
  const sql =
    "INSERT INTO customer (`TempId`,`name`, `firstName`, `nationality`, `portOfArrival`, `dob`,`email`, `mobileCode`, `phoneNumber`, `edoa`, `visaService`, `visaOptions`, `ip`) VALUES (?)";
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
    req.body.ip
  ];
  con.query(sql, [values], (err, result) => {
    if (err) return res.json({ Error: err });
    if (result) {
      var mailOptions = {
        from: "anubh896@gmail.com",
        to: req.body.email,
        subject: `eVisa India- Pending eVisa Application for ${req.body.firstName} ${req.body.name}`,
        html: `<!DOCTYPE html>
         <html>
         <head>
             <meta name="viewport" content="width=device-width, initial-scale=0.9">
             <style>
                 @media only screen and (max-width: 600px) {
                     .container {
                         width: 80% !important;
                     }
                 }
             </style>
         </head>
         <body style="font-family: Arial, sans-serif; margin: 0; padding: 0;">
         
         <div class="container" style="max-width: 600px; margin: 0 auto;color: black; padding: 20px; border: 1px solid #ededde; border-top: 3px solid #ff8c1a; ">
         
             <p style="text-align: left; font-size: 90%;">
                 Dear ${req.body.firstName} ${req.body.name},
                 <br><br>
                 You have an incomplete eVisa application for India.
                 <br><br>
                 Your temporary application reference is: <strong>${tempId}</strong>
             </p>
         <br>
             <p style="text-align: center;">
                 <a href="https://master--iridescent-fox-f31d24.netlify.app/register/${tempId}" style="display: inline-block; padding: 15px 60px; background-color:#990000; color: white; text-decoration: none; border-radius: 5px;">Resume Application</a>
             </p>
         <br>
             <p style="text-align: left;font-size: 90%;">
                 Let us know if you require any assistance.
                 <br><br>
                 Click the links to learn more about <a href="https://indiaevisaservices.org/">India eVisa</a> or <a href="https://indiaevisaservices.org/">Frequently Asked Questions</a>.
                 <br><br>
                 Please apply at least four (4) days prior to your travel to India to allow time for the eVisa to be issued.
                 <br><br>
                 Regards,<br>
                 Customer Service Dept.<br>
                 <a href="https://indiaevisaservices.org/" style="color: black;">www.india-visa-online.org</a>
             </p>
         <br>
             <p style="font-size: 80%; color: #888;">
                 Confidentiality Notice: This email and any attachments are confidential and may also be privileged. If you have received this message by mistake, please contact us immediately and then delete the message from your computer. Any review, retransmission, dissemination, or other use of, or taking of any action in reliance upon, this information by persons or entities other than the intended recipient is prohibited.
             </p>
         
         </div>
         
         </body>
         </html>
         `,

        //   html: `<!DOCTYPE html>
        //   <html lang="en">
        //   <head>
        //       <meta charset="UTF-8">
        //       <meta name="viewport" content="width=device-width, initial-scale=1.0">
        //       <title>Continue you application</title>
        //   </head>
        //   <body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5;">

        //       <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 10px; box-shadow: 0px 3px 5px rgba(0,0,0,0.1);">
        //           <tr>
        //               <td align="center" bgcolor="#2c3e50" style="padding: 30px 0;">
        //                   <h1 style="color: #ffffff;">Continue your application</h1>
        //               </td>
        //           </tr>
        //           <tr>
        //               <td style="padding: 20px;">
        //                   <p>Dear ${req.body.firstName} ${req.body.name},</p>
        //                   <p>
        //   You have incomplete eVisa application for India.
        //   Your temporary application reference is: ${tempId} TESTING
        //   Please click on the link below to resume your application:</p>
        //                   <p>To get started, simply click the button below:</p>
        //                   <p align="center">
        //                       <a href="https://master--iridescent-fox-f31d24.netlify.app/register/${tempId}" style="display: inline-block; padding: 10px 20px; background-color: #3498db; color: #ffffff; text-decoration: none; border-radius: 5px;">Resume Application</a>
        //                   </p>
        //                   <p>By clicking the button, you'll be directed to our your application</p>

        //                   <p>Best regards,<br>E-visa support<br>123456789</p>
        //               </td>
        //           </tr>
        //       </table>

        //   </body>
        //   </html>
        // `
      };

      transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          console.log(error);
          return res.json({ message: "Error sending mail" });
        } else {
          con.query(
            "INSERT INTO passportdetails (id) VALUES (?)",
            [tempId],
            (err, result) => {
              if (err) throw err;
              // return res.json({ message: "Success", tempId: tempId });
              if(result){
                con.query(
                  "INSERT INTO otherdetails (id) VALUES (?)",
                  [tempId],
                  (err, result) => {
                    if (err) throw err;
                    if(result){
                      con.query(
                        "INSERT INTO paymentdetails (id) VALUES (?)",
                        [tempId],
                        (err, result) => {
                          if (err) throw err;
                          if(result){
                            return  res.json({ message: "Success", tempId: tempId });
                          }
                        })
                    }
                  })
              }
            }
          );
        }
      });
    }
  });
});

app.put("/update/:id", (req, res) => {
  const id = req.params.id;
  console.log(id);
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
    id,
  ];
  con.query(sql, values, (err, result) => {
    if (err) return res.json({ Error: err });
    if (result) {
      const sql =
        "UPDATE passportdetails  SET citizenship = ?,city = ?,country = ?,expiryDate = ?,issueCountry = ?,issueDate = ?,mark = ?,otherDateOfIssue = ?,otherNationality = ?,otherPassportNumber = ?,otherPlaceIssue = ?,passportNumber = ?,qualification = ?,religion = ? WHERE id = ?";

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
        id,
      ];
      con.query(sql, values, (err, result) => {
        if (err) return res.json({ Error: err });

        return res.json({ message: "Success" });
      });
    }
  });
});

const uploadFields = [
  { name: "applicantFile", maxCount: 1 }, // For field 'file1', accept 1 file
  { name: "passportFile", maxCount: 1 }, // For field 'file2', accept 1 file
  // Add more objects for additional fields as needed
];

app.get("/getLeadbyId/:id", (req,res) => {
  const id = req.params.id;
  const sql = `SELECT
  customer.*,
  passportdetails.*,
  otherdetails.*,
  paymentdetails.*
FROM
   customer
LEFT JOIN
   passportdetails ON customer.TempId = passportdetails.id
LEFT JOIN
   otherdetails ON customer.TempId = otherdetails.id
LEFT JOIN
   paymentdetails ON customer.TempId = paymentdetails.id
WHERE
  customer.TempId = ?`
  con.query(sql, [id], (err, result) => {
    if(err) throw err
    return res.json({message:"Success", data:result})
  })
 
})

app.put("/otherDetails", upload.fields(uploadFields), (req, res) => {
  con.query("SELECT * from otherdetails where id =?",[req.body.id], (err, result) => {
    console.log(result)
  })
  const sql = "UPDATE otherdetails SET street=?,village=?,addresscountry=?,state=?,postal=?,fatherName=?,fatherNation=?,fatherBirth=?,fatherCountry=?,motherName=?,motherNation=?,motherBirth=?,motherCountry=?,martialStatus=?,spouseName=?,spouseAddress=?,spouseNation=?,spousePlace=?,spouseCountry=?,spouseOccupation=?,spousePhone=?,defenceOrganization=?,defenceDesignation=?,defenceRank=?,defencePosting=?,viAddress=?,viPreviousCity=?,viCountry=?,viVisa=?,viPlaceIssue=?,viDateIssue=?,extendedControlNo=?,extendedDate=?,Q1Detail=?,Q2Detail=?,Q3Detail=?,Q4Detail=?,Q5Detail=?,Q6Detail=?,applicantFile=?,passportFile=?,Aoccupation=?,Q7Detail=?,employerAddress=?,employerName=?,FI_address=?,FI_phone=?,FI_referencename=?,FO_address=?,FO_phone=?,FO_referencename=?,AB_address=?,AB_name=?,AB_phone=?,AB_website=?,IB_address=?,IB_name=?,IB_phone=?,IB_website=?,businessFile=? WHERE id=?";
  
  const values = [
    req.body.street,
    req.body.village,
    req.body.addresscountry,
    req.body.state,
    req.body.postal,
    req.body.fatherName,
    req.body.fatherNation,
    req.body.fatherBirth,
    req.body.fatherCountry,
    req.body.motherName,
    req.body.motherNation,
    req.body.motherBirth,
    req.body.motherCountry,
    req.body.martialStatus,
    req.body.spouseName,
    req.body.spouseAddress,
    req.body.spouseNation,
    req.body.spousePlace,
    req.body.spouseCountry,
    req.body.spouseOccupation,
    req.body.spousePhone,
    req.body.defenceOrganization,
    req.body.defenceDesignation,
    req.body.defenceRank,
    req.body.defencePosting,
    req.body.viAddress,
    req.body.viPreviousCity,
    req.body.viCountry,
    req.body.viVisa,
    req.body.viPlaceIssue,
    req.body.viDateIssue,
    req.body.extendedControlNo,
    req.body.extendedDate,
    req.body.Q1Detail,
    req.body.Q2Detail,
    req.body.Q3Detail,
    req.body.Q4Detail,
    req.body.Q5Detail,
    req.body.Q6Detail,
    req.files["applicantFile"]?.[0].buffer||"",
    req.files["passportFile"]?.[0].buffer||"",
    req.body.Aoccupation,
    req.body.Q7Detail,
    req.body.employerAddress,
    req.body.employerName,
    req.body.FI_address,
    req.body.FI_phone,
    req.body.FI_referencename,
    req.body.FO_address,
    req.body.FO_phone,
    req.body.FO_referencename,
    req.body.AB_address,
    req.body.AB_name,
    req.body.AB_phone,
    req.body.AB_website,
    req.body.IB_address,
    req.body.IB_name,
    req.body.IB_phone,
    req.body.IB_website,
    req.files["businessFile"]?.[0].buffer||"",
    req.body.id
  ];

  con.query(sql, values, (err, result) => {
   
    if (err) console.log(err);
    if (result) {
      var mailOptions = {
        from: "anubh896@gmail.com",
        to: req.body.email,
        subject: `Online Visa Services-Application Completed- ${req.body.firstName} ${req.body.name}`,
        html:`<!DOCTYPE html>
        <html>
        <head>
            <style>
                @media screen and (max-width: 600px) {
                    .container {
                        width: 100% !important;
                    }
                    .content {
                        padding: 10px;
                    }
                }
            </style>
        </head>
        <body>
            <table class="container" width="100%" cellpadding="0" cellspacing="0" border="0" align="center">
                <tr>
                    <td align="center">
                      
                        <table class="content" cellpadding="0" cellspacing="0" border="0" align="center" width="600">
                          
                            <tr>
                                <td align="left">
                                    <p style="border: 1px solid #ccc; padding: 10px;">
                                        Dear  ${req.body.firstName} ${req.body.name},<br><br>
                                        Thank you for completing eVisa application for India.<br><br>
                                        Your application has been completed, and all required documents have been received.<br><br>
                                        Application reference number: ${req.body.id}<br><br>
                                        A review of your file is underway. You will receive an email which will contain your Indian eVisa approval confirmation by the Indian Immigration Authorities.<br><br>
                                        Please note that most eVisas are issued in 4 days; however, some may take longer to process, up to 7 days.<br><br>
                                        Apply for another E-Visa<br><br>
                                        Regards,<br>
                                        Customer Service Dept.
                                    </p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>`
      };

      transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          console.log(error);
          return res.json({ message: "Error sending mail" });
        }
      })
      return res.json({ message: "Success" });
    }
  });
});
app.listen(8081, () => {
  console.log("Running");
});
