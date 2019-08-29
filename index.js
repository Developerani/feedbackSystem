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
const firebase = require("firebase-admin");
const serviceAccount = require("./Key.json");

firebase.initializeApp({
    credential: firebase.credential.cert(serviceAccount),
    databaseURL: "https://feedback-142e5.firebaseio.com"
  });
var db = firebase.database();



app.get("/",(req,res)=>{
    res.render("home");
});

app.get("/teachers_list",(req,res)=>{
    var data = app.get('data').teach;
    var dept = app.get('data').dept;
    var year = app.get('data').year;
    var div = app.get('data').div;
    var clg_id = app.get('data').clg_id;
    let p = new Promise((resolve,reject)=>{
        db.ref("/teachers/"+dept+"/"+year+"/"+div).on("value", function (snapshot) {
            var a = snapshot.val();
            if(a){
                a = snapshot.toJSON();               
            resolve(a);
            }else{
            reject("Unsuccessful")
            }
        }, function (errorObject) {
            reject(""+errorObject+"")
        });
    })
    p.then((a)=>{

        
        var teachers ={};
       
        for(key in data)
        {
            if(data[key] == "0")
            {
                teachers[key] = a[key].name;
            }
        }
        console.log("teachers list",teachers)
        res.render("teachers_list",{data :teachers,dept:dept,year:year,div:div,clg_id:clg_id});
    }).catch((msg)=>{
        console.log("error in /teachers",msg);
    });

   
})

app.post("/details",(req,res)=>{
    
    var dept = req.body.dept;
    var year = req.body.year;
    var div = req.body.div;
    var clg_id = req.body.clg_id;
    var name = req.body.name;

    let p = new Promise((resolve,reject)=>{
        db.ref("/teachers/"+dept+"/"+year+"/"+div).on("value", function (snapshot) {
            var a = snapshot.val();
            if(a){
                a = snapshot.toJSON();
                var teachers = {};
                for (key in a)
                {
                    if(key != "reviews")
                    teachers[key] = a[key].name;
                }
               
            resolve(["Success",teachers]);
            }else{
            reject("Unsuccessful")
            }
        }, function (errorObject) {
            reject(""+errorObject+"")
        });
    })
    p.then((data)=>{
        // console.log(data);
        var teach = {};
        
        for(key in data[1])
        {
            teach[key] = 0;
        } 
        console.log("teach",teach);
        //----------------------------inserting student data----------------------
       db.ref("/students/"+dept+"/"+year+"/"+div+"/"+clg_id).set({name:name,Teachers:teach},function (errorObject) {
           if(errorObject)
                {
                    console.log("Error inserting in student data ",errorObject);
                    res.render("err");
                }
            else
                {
                    var info = {dept:dept,year:year,div:div,teach:teach,clg_id:clg_id};
                    app.set('data',info);
                    res.redirect("/teachers_list");
                }
            
    });
        //----------------------------inserted student data-----------------------
        // res.render("feedback",{data:teachers})
        console.log("passing to then");
    }).catch((msg)=>{
        console.log(msg);
        res.render("err");
    })
    
})


app.post("/feed_feedback",(req,res)=>{
    console.log(req.body);
    var reviews = {
        1:req.body.q1,
        2:req.body.q2,
        3:req.body.q3,
        4:req.body.q4,
        5:req.body.q5,
        6:req.body.q6,
        7:req.body.q7,
        8:req.body.q8,
        9:req.body.q9
    }
    let p = new Promise((resolve,reject)=>{
        db.ref("/teachers/"+req.body.dept+"/"+req.body.year+"/"+req.body.div+"/"+req.body.sub_id+"/reviews/"+req.body.clg_id).set(reviews,(err)=>{
            if(err)
            {
                reject(err);
            }
            else{
                resolve("Success");
            }
        })
    })
    p.then((msg)=>{
        var update = {};
        update[req.body.sub_id] = "1";
        db.ref("/students/"+req.body.dept+"/"+req.body.year+"/"+req.body.div+"/"+req.body.clg_id+"/Teachers").update(update,(err)=>{
            if(err)
            {
                res.render("err");
            }else{
                
            }

        })
    }).then(()=>{
        
        db.ref("/students/"+req.body.dept+"/"+req.body.year+"/"+req.body.div+"/"+req.body.clg_id+"/Teachers").once("value",(snapshot)=>{
             var a = snapshot.toJSON();
            
                var info = {dept:req.body.dept,year:req.body.year,div:req.body.div,teach:a,clg_id:req.body.clg_id};
                app.set('data',info);
                console.log("redirecting to teachers list")
                res.redirect("/teachers_list")
             
            

        },(err)=>{
            if(err)
            {
                res.render("err");
            }

        })
        
    }).catch((msg)=>{
        res.render("err")
    })

    // res.redirect("/teachers_list")
})