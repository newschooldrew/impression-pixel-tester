// basic server set up
const express = require('express')
const app = express()

// using this module to read the incoming CSV
const fs = require('fs')

// using this module to parse out the CSV file
// we'll then perform actions on this parsed data
const neatCsv = require('neat-csv');

// using this to request the URLs in the URL sheet
const axios = require('axios')

// module that allows me to easily assign
// variables to node js arguments

const args = require('yargs').argv;
// module let me create excel sheets
const Excel = require('exceljs');

let mappedUrls = [];
let finalURL;
let errorObj = [];
let errArr = [];

// Using yargs to create variables from command line
// These variables will help build out file names
const errArg = args.error;
const dataArg = args.data;
const csvArg = args.csv;


// Read incoming CSV file from the command line
// by using FS module
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

  let successArr = [];

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
      successArr.push({status:res.status,url:axiosURL})

      // creating the workbook that will house the successful URLs
      let success_workbook = new Excel.Workbook();
      let success_worksheet = success_workbook.addWorksheet('success');
      // creating the headers that will live in the successful excel doc
      success_worksheet.columns = [
        { header: 'Status Code', key: 'status', width: 10 },
        { header: 'Successful URL', key: 'url', width: 100 },
      ];      
      // grabbing the object that houses the correct status and URL
      // and throwing them into rows, under their respective columns
      success_worksheet.insertRows(2,successArr)
      
      // promise based function that creates the CSV file
      // using the variable input in the command line
      await success_workbook.csv.writeFile("success_" + dataArg +".csv");
        }
        // if the URL does not return a successful response
        // we get an error
        // and we catch it here
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
        const matchedError = mappedUrls.filter(p =>{ 
          return p.impression_pixel_json == errURL;
        })

        console.log("matchedError is:")
        console.log(matchedError)
          
        // we want to keep track of how many URLs do not have a successful status code
        // so we increment the value of count each time we run this function
        count++

        // creating a new object from the matched object
        const impression_pixel_json = matchedError[0]["impression_pixel_json"];
        const tactic_id =matchedError[0]["tactic_id"]
        errorObj = [tactic_id,impression_pixel_json]

        // pushing that object in an empty array
        errArr.push(errorObj)
        console.log("errArr:")
        console.log(errArr)

        // re-creating the excel work flow but for URLs that error out
      let error_workbook = new Excel.Workbook();
      let error_worksheet = error_workbook.addWorksheet('lebron');
      error_worksheet.columns = [
        { header: 'Tactic ID', key: 'tactic_id', width: 10 },
        { header: 'Impression Pixel', key: 'impression_pixel_json', width: 32 }
      ];      

      error_worksheet.insertRows(2,errArr)

      await error_workbook.csv.writeFile("error_" + errArg +".csv");

      })
    })
})

app.listen(5000,() => console.log("Server is listening on port 5000"))