const express = require("express")
const path = require('path')
const cookieParser = require('cookie-parser');
const cors = require('cors');
const app = express();
app.use(express.static(path.join(__dirname, '../frontend')));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../frontend"));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(cors({
    origin: "http://localhost:3000",
    credentials: true
}));

// AI Agent Routes
const aiAgentRoutes = require('./routes/aiAgent.routes');
app.use('/ai', aiAgentRoutes);

// Static Pages Routes
app.get('/', (req, res) => {
    res.render('landing/front');
});

app.get('/services', (req, res) => {
    res.render('landing/services');
});

app.get('/about', (req, res) => {
    res.render('landing/about');
});

app.get('/contact', (req, res) => {
    res.render('landing/contact');
});

module.exports = app;