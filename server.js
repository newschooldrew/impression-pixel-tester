const express = require('express')
const app = express()
const csv = require('csv-parser')
const fs = require('fs')
const neatCsv = require('neat-csv');
const axios = require('axios')
const args = require('yargs').argv;
const Excel = require('exceljs');

let arr = [];
let mappedUrls = [];
let finalURL;
let lastErrorObj = [];
let myArr = [];
// Using yargs to create variables from command line
// These variables will help build out file names
const errArg = args.error;
const dataArg = args.error;args.data;
const csvArg = args.csv;


// Read incoming CSV file from the command line
fs.readFile(__dirname + "/" + csvArg, async (err, data) => {
  // using neat-csv to parse out csv file
  const res = await neatCsv(data)
  // mapping out the parsed out response from neat-csv
  res.map(r =>{
    // the response is in object form
    
    // so we grab the impression pixel value
    // which leaves us with ["https:\/\/voken.eyereturn.com\/pix?1132530"]
    const newRow = r.impression_pixel_json;
    
    // stripping out the quotes
    // which leaves us with [https:\/\/voken.eyereturn.com\/pix?1132530]
    const strippedQuotes = newRow.replace(/['"]+/g, '')
    
    // stripping out the brackets
    // which leaves us with https:\/\/voken.eyereturn.com\/pix?1132530
    const strippedBrackets = strippedQuotes.replace(/[\[\]']/g,'' );
    
    // finally, stripping out the forward slashes
    // which leaves us with https://voken.eyereturn.com/pix?1132530
    const noBackslashes = strippedBrackets.replace(/\\/g, '');

    if (noBackslashes.indexOf(',') > -1) { 
      // many of the object have multiple impression pixels in them, separated by commas
      // to get around this, we pluck out the first URL in the list
      // we use substr to grab the contents from the first letter til the comma
      finalURL = noBackslashes.substr(0, noBackslashes.indexOf(','))
    }else{
      // if there are no commas in the string, assign the variable and continue
      finalURL = noBackslashes;
    }

    // grabbing the tactic_id associated with the impression pixel
    const tactic_id = r.tactic_id;
    
    // adding in the tactic ID and its associated impression pixel to the same object
    // and pushing it into an empty array
    mappedUrls.push({tactic_id,impression_pixel_json:finalURL})
    
    // any tactic_id that doesn't have an impression pixel gets filtered out
    mappedUrls = mappedUrls.filter(p => p.impression_pixel_json !== '')
    mappedUrls = mappedUrls.filter(p => p.impression_pixel_json !== 'NULL')
  })

  let resArr = [];

  // set up variables to count the number of times the URLs came back with 
  // a sucessful or error status code
  let successCount = 0;
  let count = 0;

  // mapping through the beautified object we created earlier
mappedUrls.map(url => {

  // grabbing the beautified URL
  const axiosURL = url.impression_pixel_json;
    // simulating a request using axios
    axios.get(axiosURL).then(async res => {
      console.log("url status:")
      console.log(axiosURL)
      console.log(res.status)

      // axios gives us a response with a status code
      // if its anything between 200 or 399, we are logging it
      // in the data file
      if(res.status >= 200 && res.status <= 399){
      successCount++
      resArr.push({status:res.status})
      // fs.writeFile("data_" + dataArg + ".txt",JSON.stringify(resArr),(err)=>{
      //   if(err)console.log(err)
      //     })
      let success_workbook = new Excel.Workbook();
      let success_worksheet = success_workbook.addWorksheet('success');
      success_worksheet.columns = [
        { header: 'status code', key: 'status', width: 10 }
      ];      

      success_worksheet.insertRows(2,resArr)

      await success_workbook.csv.writeFile("success_" + dataArg +".csv");
        }
      }).catch(async function(err){
        
        let errURL;
        // if the status code falls outside of 200 an 400
        // we should have a response that includes the URL in the response's config object
        // this code grabs that URL value
        if (err.hasOwnProperty('response')) {
            errURL = err.config.url;
        }
        
        // we then match that URL with all of the objects
        // and filter out any of the objects that dont match the URL
        const lastError = mappedUrls.filter(p =>{ 
          return p.impression_pixel_json == errURL;
        })
        console.log("errURL:")
        console.log(errURL)
        console.log("error is:")
        console.log(lastError)
          
        // we want to keep track of how many URLs do not have a successful status code
        // so we increment the value of count each time we run this function
        count++

        // creating a new object from the matched object
        const impression_pixel_json = lastError[0]["impression_pixel_json"];
        const tactic_id =lastError[0]["tactic_id"]
        lastErrorObj = [tactic_id,impression_pixel_json]

        // pushing that object in an empty array
        myArr.push(lastErrorObj)
        console.log("myArr:")
        console.log(myArr)
        // const stream = fs.createWriteStream("error_" + errArg + ".html");

      let error_workbook = new Excel.Workbook();
      let error_worksheet = error_workbook.addWorksheet('lebron');
      error_worksheet.columns = [
        { header: 'Tactic ID', key: 'tactic_id', width: 10 },
        { header: 'Impression Pixel', key: 'impression_pixel_json', width: 32 }
      ];      

      error_worksheet.insertRows(2,myArr)

      await error_workbook.csv.writeFile("error_" + errArg +".csv");

          // writing that data to the error log
        // fs.appendFile("error_" + errArg + ".txt",JSON.stringify(myArr),(err)=>{
        //     if(err)console.log(err)
        //   })
      })
    })
})

app.listen(5000,() => console.log("Server is listening on port 5000"))