import Immutable from 'immutable'
import React, { Component, PropTypes } from 'react';
import { createContainer } from 'meteor/react-meteor-data';

import { Entries } from '../api/entries/entries.js';
import '../api/entries/methods.js';

// App component - represents the whole app
class App extends Component {
  render() {
    return (
      <div>
        {this.props.children}
      </div>
    )
  }
}

export default createContainer((props) => {
  return {
    query: props.location.query.query,
    tags: fetchAllTags(),
  };
}, App);

function fetchAllTags() {
  // TODO: Optimize. :)
  const allTagLists = Entries.find({}, {fields: {tags: 1}})
    .fetch()
    .map((entry) => Immutable.Iterable(entry.tags));
  const tags = new Set(Immutable.Iterable(allTagLists).flatten().toSet());
  return new Array(...tags).sort();
}
