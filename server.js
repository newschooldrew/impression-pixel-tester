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
  let successCount = 0;
  let count = 0;

  finalArr.map(url => {
    axios.get(url).then(res => {
      console.log("url status:")
      console.log(res.status)
      if(res.status == 200){
        console.log("200")
      successCount++
      resArr.push({status:res.status,count:successCount})
      fs.appendFile("data_v1.txt",JSON.stringify(resArr),(err)=>{
        if(err)console.log(err)
          })
        }
      }).catch(function(err){

        let errURL;
        if (err.hasOwnProperty('response')) {
            errURL = err.config.url;
        }
        
        console.log("error is:")
        // console.log(err.response.request.res.socket._httpMessage.connection._httpMessage)
        // console.log(Object.keys(err.request))
          const lastError = errArr.filter(p =>{
            return p.impression_pixel_json == errURL;
          })
          
          count++
          const impPixel = lastError[0]["impression_pixel_json"];
          const tac_id =lastError[0]["tac"]
          const lastErrorObj = {impPixel,tac_id,count}
          const myArr = [];
          myArr.push(lastErrorObj)
          console.log(myArr)
          fs.appendFile("err_v1.txt",JSON.stringify(myArr),(err)=>{
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