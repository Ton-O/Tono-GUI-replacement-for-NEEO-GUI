const host = "localhost";
const path = require('path') ;
const express = require('express')
const app = express()
const port = 5000;
const http = require("http");
const fs = require("fs").promises;

app.use(express.static(path.join(__dirname + '/public')));

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})
