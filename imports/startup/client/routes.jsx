import React from 'react';
import { Router, Route, IndexRoute, browserHistory } from 'react-router';

import App from '../../ui/App.jsx';
import EntryPage from '../../ui/EntryPage.jsx';
import Home from '../../ui/Home.jsx';

export const renderRoutes = () => (
  <Router history={browserHistory}>
    <Route path="/" component={App}>
      <IndexRoute component={Home} />
      <Route path="entry/:entryID" component={EntryPage}/>
    </Route>
  </Router>
);
