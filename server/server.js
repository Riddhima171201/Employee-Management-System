import express, { response } from 'express'
import mysql from 'mysql'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import multer from 'multer'
import path from 'path'

const app = express();
app.use(cors(
    {
        origin: ["http://localhost:5173"],
        methods: ["POST", "GET", "PUT"],
        credentials: true
    }
));
app.use(cookieParser());
app.use(express.json());
app.use(express.static('public'));

const con = mysql.createConnection({
    host : "localhost",
    user : "root",
    password : "",
    database : "signup"
})

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/images')
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + "_" + Date.now() + path.extname(file.originalname));
    }
})

const upload = multer({
    storage: storage
})

con.connect(function(err) {
    if (err) {
        console.log("Error in Connection");
    } else {
        console.log("Connected");
    }
})

app.get('/getEmployee', (req, res) => {
    const sql = "SELECT * FROM employee";
    con.query(sql, (err, result) => {
        if(err) return res.json({Error: "Get employee error in sql"});
        return res.json({Status: "Success", Result: result})
    })
})

app.get('/get/:ID', (req, res) => {
    const ID = req.params.ID;
    const sql = "SELECT * FROM employee where ID = ?";
    con.query(sql, [ID], (err, result) => {
        if(err) return res.json({Error: "Get employee error in sql"});
        return res.json({Status: "Success", Result: result})
    })
})

app.put('/update/:ID', (req, res) => {
    const ID = req.params.ID;
    const sql = "UPDATE employee set salary = ? WHERE ID = ?";
    con.query(sql, [req.body.salary, ID], (err, result) => {
        if(err) return res.json({Error: "Update employee error in sql"});
        return res.json({Status: "Success"})
    })
})

app.delete('/delete/:ID', (req, res) => {
    const ID = req.params.ID;
    const sql = "Delete FROM employee WHERE ID = ?";
    con.query(sql, [ID], (err, result) => {
        if(err) return res.json({Error: "Delete employee error in sql"});
        return res.json({Status: "Success"})
    })
})

const verifyUser = (req, res, next) => {
    const token = req.cookies.token;
    if(!token) {
        return res.json({Error: "You are not Authenticated"});
    } else {
        jwt.verify(token, "jwt-secret-key", (err, decoded) => {
            if (err) return res.json({Error: "Token wrong"});
            req.role = decoded.role;
            req.ID = decoded.ID;
            next();
        })
    }
}

app.get('/dashboard',verifyUser, (req, res) => {
    return res.json({Status: "Success", role: req.role, ID: req.ID})
})

app.get('/adminCount', (req, res) => {
    const sql = "Select count(ID) as admin from users";
    con.query(sql, (err, result) => {
        if(err) return res.json({Error: "Error in running query"});
        return res.json(result);
    })
})

app.get('/employeeCount', (req, res) => {
    const sql = "Select count(ID) as employee from employee";
    con.query(sql, (err, result) => {
        if(err) return res.json({Error: "Error in running query"});
        return res.json(result);
    })
})

app.get('/salary', (req, res) => {
    const sql = "Select sum(Salary) as sumOfSalary from employee";
    con.query(sql, (err, result) => {
        if(err) return res.json({Error: "Error in running query"});
        return res.json(result);
    })
})

app.post('/login', (req, res) => {
    const sql = "SELECT * FROM users Where email = ? AND password = ?";
    con.query(sql, [req.body.email, req.body.password], (err, result) => {
        if(err) return res.json({Status: "Error", Error: "Error in running query"});
        if(result.length > 0) {
            const ID = result[0].ID
            const token = jwt.sign({role: "admin"}, "jwt-secret-key", {expiresIn: '1d'});
            res.cookie('token', token);
            return res.json({Status: "Success"})
        } else {
            return res.json({Status: "Error", Error: "Wrong Email or Password"});
        }
    })
})

app.post('/employeelogin', (req, res) => {
    const sql = "SELECT * FROM employee Where email = ?";
    con.query(sql, [req.body.email], (err, result) => {
        if(err) return res.json({Status: "Error", Error: "Error in running query"});
        if(result.length > 0) {
            bcrypt.compare(req.body.password.toString(), result[0].password, (err, response) => {
                if(response) {
                    const token = jwt.sign({role: "employee", ID: result[0].ID}, "jwt-secret-key", {expiresIn: '1d'});
                    res.cookie('token', token);
                    return res.json({Status: "Success", ID: result[0].ID})
                } else {
                    return res.json({Error: "Wrong Email or Password"})
                }
                
                
            })
            
        } else {
            return res.json({Status: "Error", Error: "Wrong Email or Password"});
        }
    })
})

// app.get('/employee/:ID', (req, res) => {
//     const ID = req.params.ID;
//     const sql = "SELECT * FROM employee where ID = ?";
//     con.query(sql, [ID], (err, result) => {
//         if(err) return res.json({Error: "Get employee error in sql"});
//         return res.json({Status: "Success", Result: result})
//     })
// })

app.get('/logout', (req, res) => {
    res.clearCookie('token');
    return res.json({Status: "Success"});
})

app.post('/create', upload.single('image'), (req, res) => {
    const sql = "INSERT INTO employee (`name`,`email`,`password`,`address`, `salary`, `image`) VALUES (?)";
    bcrypt.hash(req.body.password.toString(), 10, (err, hash) => {
        if(err) return res.json({Error: "Error in hashing password"});
        const values = [
            req.body.name,
            req.body.email,
            hash,
            req.body.address,
            req.body.salary,
            req.file.filename
        ]
        con.query(sql, [values], (err, result) => {
            if(err) return res.json({Error: "Inside signup query"});
            return res.json({Status: "Success"});
        })
    })
})

app.listen(8081, ()=> {
    console.log("Running");
})