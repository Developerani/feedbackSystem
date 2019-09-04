const functions = require('firebase-functions');
const express = require("express");
const app = express();
const path = require("path");
const bodyParser = require("body-parser")
const json_body_parser = bodyParser.json();
const urlencoded_body_parser = bodyParser.urlencoded({ extended: true });
app.use(json_body_parser);
app.use(urlencoded_body_parser);
app.set('view engine', 'ejs');
app.set("views", path.join(__dirname,"views"))

const firebase = require("firebase-admin");
const serviceAccount = require("./Key.json");

firebase.initializeApp({
    credential: firebase.credential.cert(serviceAccount),
    databaseURL: "https://feedback-142e5.firebaseio.com"
  });
var db = firebase.database();

//-----------------------------------------------------------
var passInfo = {ab:"abcd"};



//-----------------------------------------------------------

app.get("/",(req,res)=>{
    res.render("home");
});

app.get("/thankyou",(req,res)=>{
    res.render("thankyou")
})

app.get("/teachers_list/:dept&:year&:div&:id",(req,res)=>{
    console.log(req.params.info);
    
    
    
    console.log("Passing to teach");
    var clg = req.params.clg;
    console.log("clg=>"+clg);
    
   
    var dept = req.params.dept;
    console.log("department is ",dept)
    var year = req.params.year;
    console.log("Year is ",year);
    var div = req.params.div;
    console.log("Div is ",div);
    var clg_id = req.params.id;
    let p = new Promise((resolve,reject)=>{
        db.ref("/teachers/"+dept+"/"+year+"/"+div).once("value", function (snapshot) {
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

        db.ref("/students/"+dept+"/"+year+"/"+div+"/"+clg_id+"/Teachers").once("value", function (snapshot) {

            var teachers ={};
            var data = snapshot.val();
            console.log("tl data ",data)
            for(key in data)
            {
                if(data[key] == "0")
                {
                    teachers[key] = a[key].name;
                }
            }
            console.log("teachers list",teachers)
            res.render("teachers_list",{data :teachers,dept:dept,year:year,div:div,clg_id:clg_id});
        },(err)=>{
            if(err)
            {
                console.log("Error retrieving student data in teachers_list",err)
            }
        });
       
    }).catch((msg)=>{
        console.log("error in /teachers",msg);
    });

   
})
app.post("/data",(req,res)=>{
    var dept = req.body.dept;
    var year = req.body.year;
    var div = req.body.div;
    var clg_id = req.body.clg_id;
    var name = req.body.name;
    res.redirect("/otp/"+dept+"&"+year+"&"+div+"&"+clg_id+"&"+name);
});

app.get("/otp/:dept&:year&:div&:id&:name",(req,res)=>{
    var dept = req.params.dept;
    var year = req.params.year;
    var div = req.params.div;
    var clg_id = req.params.id;
    var name = req.params.name;
    let p = new Promise((resolve,reject)=>{
        db.ref("/phone/"+clg_id).once("value", function (snapshot) {
            var a = snapshot.val();
            if(a){
            resolve(a);
            }else{
            reject("Unsuccessful")
            }
        }, function (errorObject) {
            reject(errorObject)
        });
    });
    p.then((result)=>{
        var no = result.number;
        console.log(result.number);
        res.render("otp",{dept:dept,year:year,div:div,clg_id:clg_id,no:no,name:name})
    }).catch((err)=>{
        console.log(err);
    });
});

app.get("/info/:",(req,res)=>{
    res.render("info")
})

app.get("/details/:dept&:year&:div&:id&:name",(req,res)=>{
    
    var dept = req.params.dept;
    var year = req.params.year;
    var div = req.params.div;
    var clg_id = req.params.id;
    var name = req.params.name;

    let p = new Promise((resolve,reject)=>{
        db.ref("/teachers/"+dept+"/"+year+"/"+div).once("value", function (snapshot) {
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
            reject(errorObject)
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
        db.ref("/students/"+dept+"/"+year+"/"+div+"/"+clg_id).once('value',function(shapsht){
            var student = shapsht.val();

            if(student)
            {
                console.log("Ridireting to"+'data'+clg_id);
                    
                res.redirect("/teachers_list/"+dept+"&"+year+"&"+div+"&"+clg_id);

            }
            else{
                console.log("student data not present ")
                //----------------------------inserting student data----------------------
       db.ref("/students/"+dept+"/"+year+"/"+div+"/"+clg_id).set({name:name,Teachers:teach},function (errorObject) {
        if(errorObject)
             {
                 console.log("Error inserting in student data ",errorObject);
                 res.render("err");
             }
         else
             {
                 
                
                
                 console.log("Ridireting to"+'data'+clg_id);
                 
                 res.redirect("/teachers_list/"+dept+"&"+year+"&"+div+"&"+clg_id);
             }
         
 });
     //----------------------------inserted student data-----------------------
     // res.render("feedback",{data:teachers})
     console.log("passing to then");
            }
        },(err)=>{
            if(err)
            {
                console.log("err in student data retrieval in details ",err);
            }
        })
        
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
       
                
                console.log("redirecting to teachers list")
                res.redirect("/teachers_list/"+req.body.dept+"&"+req.body.year+"&"+req.body.div+"&"+req.body.clg_id)
             
            

       
        
    }).catch((msg)=>{
        res.render("err")
    })

    // res.redirect("/teachers_list")
})
// Create and Deploy Your First Cloud Functions
// https://firebase.google.com/docs/functions/write-firebase-functions

exports.app = functions.https.onRequest(app);