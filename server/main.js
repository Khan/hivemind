import { Meteor } from 'meteor/meteor';

import '../imports/api/entries.js';
import '../imports/api/users.js';

import configureAccounts from '../imports/startup/accounts.js';
import configureS3 from '../imports/startup/server/s3.js';
import configureGoogleOAuth from '../imports/startup/server/google-oauth.js';

configureS3();
configureGoogleOAuth();

Meteor.startup(() => {
  configureAccounts();
});
