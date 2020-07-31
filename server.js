const express = require('express')
const app = express()
const csv = require('csv-parser')
const fs = require('fs')
const axios = require('axios')
const neatCsv = require('neat-csv');

let arr = [];
let errArr = [];
fs.readFile(__dirname + "/" + process.argv.slice(2), async (err, data) => {
  if (err) {
    console.error(err)
    return
  }
  const res = await neatCsv(data)

  res.map(r =>{
    console.log(r)
    const newRow = r.impression_pixel_json;

    const strippedQuotes = newRow.replace(/['"]+/g, '')
    const strippedBrackets = strippedQuotes.replace(/[\[\]']/g,'' );
    const finalURL = strippedBrackets.replace(/\\/g, '')
    arr.push(finalURL)

    const tac = r.tactic_id;
    errArr.push({tac,impression_pixel_json:finalURL})

  })

  const noNull = arr.filter(a => a !== 'NULL')
  const finalArr = noNull.filter(a => a !== '')
  console.log(finalArr)
  let resArr = [];

  finalArr.map(fa => {
    axios.get(fa).then(res => {
      resArr.push(res.status)
      fs.writeFile("data.txt",resArr,(err)=>{
        if(err)console.log(err)
        })
      }).catch(function(err){
        const errURL = err.response.config.url;
        console.log("error is:")
        console.log(errURL)
          const lastError = errArr.filter(p =>{
            return p.impression_pixel_json == errURL;
          })
          console.log(lastError)
          const impPixel = lastError[0]["impression_pixel_json"];
          console.log(typeof impPixel)
          const tac_id =lastError[0]["tac"]
          const myObj ={tac_id,impPixel}
          fs.writeFile("err_v3.txt",JSON.stringify(myObj),(err)=>{
            if(err)console.log(err)
            })
      })
    })

  // axios.get(finalURL)
  // .then( res => {
  //   const msg = "the status of: " + finalURL + " is " + res.status;
  //   arr.push(msg)
  // })

})

// fs.createReadStream(__dirname + "/" + process.argv.slice(2))
//   .pipe(csv())
//   .on('data', async (row) => {
//     const newRow = row.impression_pixel_json;
      
//       const strippedQuotes = newRow.replace(/['"]+/g, '')
//       const strippedBrackets = strippedQuotes.replace(/[\[\]']/g,'' );
//       const finalURL = strippedBrackets.replace(/\\/g, '')
//       arr.push(finalURL)
//       arr.map
//       const myRes = await axios.get(finalURL).catch(err =>console.log(row.tactic_id + " does not have an impression pixel"))

//   })


app.listen(5000,() => console.log("Server is listening on port 5000"))