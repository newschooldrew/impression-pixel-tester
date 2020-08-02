const express = require('express')
const app = express()
const csv = require('csv-parser')
const fs = require('fs')
const axios = require('axios')
const neatCsv = require('neat-csv');
const args = require('yargs').argv;

let arr = [];
let mappedUrls = [];
let finalURL;


console.log('Error: ' + args.error);
const errArg = args.error;
console.log('data: ' + args.data);
const dataArg = args.error;args.data;
console.log('csv: ' + args.csv);
const csvArg = args.csv;


// Read incoming CSV file as argument the user has input
fs.readFile(__dirname + "/" + csvArg, async (err, data) => {

  const res = await neatCsv(data)
  res.map(r =>{
    // console.log(r)
    const newRow = r.impression_pixel_json;
    const strippedQuotes = newRow.replace(/['"]+/g, '')
    const strippedBrackets = strippedQuotes.replace(/[\[\]']/g,'' );
    const noBackslashes = strippedBrackets.replace(/\\/g, '');
    if (noBackslashes.indexOf(',') > -1) { 
      finalURL = noBackslashes.substr(0, noBackslashes.indexOf(','))
      // arr.push(firstURLinBunch)
    }else{
      finalURL = noBackslashes;
    }
    const tactic_id = r.tactic_id;
    mappedUrls.push({tactic_id,impression_pixel_json:finalURL})
    // console.log(mappedUrls.map(u => u.finalURL))
    mappedUrls = mappedUrls.filter(p => p.impression_pixel_json !== '')
    mappedUrls = mappedUrls.filter(p => p.impression_pixel_json !== 'NULL')
  })

  let resArr = [];
  let successCount = 0;
  let count = 0;
// console.log("mappedUrls:")
// console.log(mappedUrls)
mappedUrls.map(url => {
  const axiosURL = url.impression_pixel_json;
    axios.get(axiosURL).then(res => {
      console.log("url status:")
      console.log(axiosURL)
      console.log(res.status)
      if(res.status >= 200 && res.status <= 399){
      successCount++
      resArr.push({status:res.status,count:successCount})
      fs.writeFile("data_" + dataArg + ".txt",JSON.stringify(resArr),(err)=>{
        if(err)console.log(err)
          })
        }
      }).catch(function(err){

        let errURL;
        if (err.hasOwnProperty('response')) {
            errURL = err.config.url;
        }
        
        const lastError = mappedUrls.filter(p =>{ 
          return p.impression_pixel_json == errURL;
        })
        console.log("errURL:")
        console.log(errURL)
        console.log("error is:")
        console.log(lastError)
          
          count++
          const impression_pixel_json = lastError[0]["impression_pixel_json"];
          const tactic_id =lastError[0]["tactic_id"]
          const lastErrorObj = {count,tactic_id,impression_pixel_json}
          const myArr = [];
          myArr.push(lastErrorObj)
          console.log("myArr:")
          console.log(myArr)
          fs.appendFile("error_" + errArg + ".txt",JSON.stringify(myArr),(err)=>{
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