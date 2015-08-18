'use strict';
require('esfunctional');

let AWS = require('aws-sdk');
let web = require('axios');

spawn(function*() {
  let s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  });

  let buckets = yield s3 [promisify] ('listBuckets')({});

  let params = {
    Bucket: buckets.Buckets[0].Name,
    Key: 'test/key/path'
  };

  let getUrl = s3.getSignedUrl('getObject', params);

  let putUrl = s3.getSignedUrl(
    'putObject',
    ({ContentType: 'application/json;charset=utf-8'}) [extend] (params)
  );

  let putRes = yield web.put(putUrl, {foo: 'bar1'});

  if (!putRes || putRes.status !== 200) {
    throw 'Error uploading payload';
  }

  let getRes = yield web.get(getUrl);

  if (!getRes || getRes.status !== 200 || getRes.data.foo !== 'bar1') {
    throw 'Downloaded and uploaded payloads don\'t match';
  }

  //TODO: cloudfront goes here...

  console.log('Everything is OK');

  return 0; // success
})

// emit exit code
[thena] (process.exit)

//error handler
[catcha] ((err) => {
  console.error(
    '[FATAL ERROR] @', new Date().toISOString(),
    err ? (err.stack || err) : 'unknown error'
  );

  process.exit(1); //unhandled exception
});
