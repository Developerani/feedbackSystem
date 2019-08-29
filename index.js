const express = require("express");
const app = express();
const path = require("path");
const bodyParser = require("body-parser")
const port = process.env.PORT || 3000;
const json_body_parser = bodyParser.json();
const urlencoded_body_parser = bodyParser.urlencoded({ extended: true });
app.use(json_body_parser);
app.use(urlencoded_body_parser);
app.set('view engine', 'ejs');
app.set("views", path.join(__dirname,"views"))

app.listen(port,()=>{
    console.log("Live at 3000")
});

app.get("/",(req,res)=>{
    res.render("home");
});

app.post("/details",(req,res)=>{
    console.log(req.body)
    res.redirect("/")
})