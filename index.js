// Dependencies
const express = require('express');
const path = require('path');
const mongoskin = require('mongoskin');
const bodyParser = require('body-parser');

//connect to the mongoDB
const db = mongoskin.db("mongodb://leanjunio:mynameislean@ds129024.mlab.com:29024/paperdodo_db", { w: 0});
db.bind('event');

//create express app, use public folder for static files and initiate bodyParser middleware
const app = express();
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));

// Route handler for generating test data
app.get('/init', (req, res) => {
  db.event.insert({ 
    text:"My test event B", 
    start_date: new Date(2013,8,2),
    end_date:   new Date(2013,8,6)
  });
  db.event.insert({ 
    text:"Another test event", 
    start_date: new Date(2013,8,4),
    end_date:   new Date(2013,8,9),
    color: "#CC8616"
  });

  res.send("Test events were added to the database")
});

// Load test data onto the calendar from parsing db
app.get('/data', (req, res) => {
  db.event.find().toArray((err, data) => {
    //set id property for all records
    for (let i = 0; i < data.length; i++)
      data[i].id = data[i]._id;

    //output response
    res.send(data);
  });
});

// Handler for creating, updating, and deleting data
app.post('/data', (req, res) => {
  const data = req.body;
  const mode = data["!nativeeditor_status"];
  const sid = data.id;
  const tid = sid;

  //remove properties which we do not want to save in DB
  delete data.id;
  delete data.gr_id;
  delete data["!nativeeditor_status"];

  //output confirmation response
  const update_response = (err, result) => {
    if (err)
      mode = "error";
    else if (mode == "inserted")
      tid = data._id;

    res.setHeader("Content-Type","text/xml");
    res.send("<data><action type='"+mode+"' sid='"+sid+"' tid='"+tid+"'/></data>");
  }

  //run db operation depending on mode passed
  if (mode == "updated")
    db.event.updateById( sid, data, update_response);
  else if (mode == "inserted")
    db.event.insert(data, update_response);
  else if (mode == "deleted")
    db.event.removeById( sid, update_response);
  else
    res.send("Not supported operation");
});

app.listen(process.env.PORT || 3000, () => console.log(`Listening on port 3000`));