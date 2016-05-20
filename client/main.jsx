import { Meteor } from 'meteor/meteor';
import { render } from 'react-dom';

import configureAccounts from '../imports/startup/accounts.js';
import configureEntriesMethods from '../imports/api/entries/methods.js';
import { renderRoutes } from '../imports/startup/client/routes.jsx';

Meteor.startup(() => {
  configureAccounts();
  configureEntriesMethods();
  render(renderRoutes(), document.getElementById('render-target'));
});
