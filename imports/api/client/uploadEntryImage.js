import { Meteor } from 'meteor/meteor';

import { entryUploadPath } from '../entries/entries.js';

export default function(entryID, fileList, callback) {
  S3.upload({
    files: fileList,
    path: entryUploadPath,
  }, (error, result) => {
    if (error) {
      console.error(error);
    } else {
      Meteor.call("entry.setImage", {entryID, imageURL: result.secure_url});
      console.log(`Uploaded to ${result.secure_url}`);
    }
    callback();
  });
};
