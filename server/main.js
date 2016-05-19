import { Meteor } from 'meteor/meteor';

import '../imports/api/entries.js';
import '../imports/api/users.js';

import configureAccounts from '../imports/startup/accounts.js';
import configureGoogleOAuth from '../imports/startup/server/google-oauth.js';
import configureS3 from '../imports/startup/server/s3.js';
import configureSMTP from '../imports/startup/server/smtp.js';

configureGoogleOAuth();
configureS3();
configureSMTP();

Meteor.startup(() => {
  configureAccounts();
});
