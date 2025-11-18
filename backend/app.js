const express = require("express")
const path = require('path')
const cookieParser = require('cookie-parser');
const cors = require('cors');
const app = express();
app.use(express.static(path.join(__dirname, '../frontend')));
app.set("view engine","ejs");
app.set("views",path.join(__dirname,"../frontend"));

app.use(express.json({limit:"10mb"}));
app.use(express.urlencoded({extended:true}));
app.use(cookieParser());

app.use(cors({
    origin : "http://localhost:3000",
    credentials : true
}));
module.exports = app;