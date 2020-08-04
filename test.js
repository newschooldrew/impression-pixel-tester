const assert = require('assert')
const axios = require('axios')

// 1. string that describes the test
// 2. function
describe('test status code',() =>{
    it('checks the correct status',async ()=>{
        const correctURL = 'https://github.com'
        const res = await axios.get(correctURL);
        const statusCode = res.status;
        console.log(statusCode)
        assert(statusCode == 200)
    }).timeout(3500);

    it('checks the incorrect status',async ()=>{
        try{
        const incorrectURL = 'https://sfskjdfkls.com'
        const res = await axios.get(incorrectURL);
        const wrongStatusCode = res.status;
        console.log(wrongStatusCode)
        } catch(e){
            // if the response is not succesful
            // it will error out
            // and we catch that here
            console.log(e.config.url)
            assert(e)
        }
    }).timeout(3500);
});