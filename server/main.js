import { Meteor } from 'meteor/meteor';

import '../imports/api/entries.js';
import configureAccounts from '../imports/startup/accounts.js';
import '../imports/SECRETS.js';

Meteor.startup(() => {
  configureAccounts();
});
