'use strict';

//const neeoapi = require('neeo-sdk');

console.log('NEEO Discover a brain');

function DiscoverBrain() {

const brainIp = process.env.BRAINIP;
var FirstBrainIp;
if (brainIp) {
  console.log('- use NEEO Brain IP from env variable', brainIp);
  //MakeURLFromBrainIP(brainIp);
  url=brainIp;
}
else {
  console.log('- discover one NEEO Brain...');
  neeoapi.discoverOneBrain()
    .then((brain) => {
      console.log('- Brain discovered:', brain);
      url=brain.iparray[0];
      //startSdkExample(brain);
    });
    // MakeURLFromBrainIP(FirstBrainIp);
    return
    }
   console.log('Could not find a brain');
}