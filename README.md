# Impression Pixel Tester
Impression Pixel Tester is a tool for account managers and anyone who would like to 
verify that impression pixels fire correctly

The Impression Pixel Tester takes in a CSV full of impression pixels 
and outputs the successful and unsuccessful URLs, both in CSV format.

The error file will have the Tactic ID and the failing URL. <br />
The success file will have the status codes alongside their respective URL.

Please only put one URL with one Tactic ID. <br />
```diff 
- Warning: If you assign multiple impression pixels to one tactic ID,this script will only pick the first URL.
```

## Installation

``git clone git@github.com:newschooldrew/take-home-test.git``

## Install dependencies
``yarn or npm install``

## CSV Format
Please make the CSV file you've inputted has a column titled `tactic_id` with tactic IDs and `impression_pixel_json` with impression pixels

## Command Line
The Impression Pixel Tester takes in 3 arguments to name your files and versions. <br />
``node server.js --error=[version of error log] --data=[version of data log] --csv=[name of the csv file you want to test].csv``

example: 
``node server.js --error=v2 --data=v2 --csv=URLs.csv``
will out put:
- error_v2.csv
- data_v2.csv

--csv=URLs.csv represents the CSV file you are inputting

### Built With
Node.js
