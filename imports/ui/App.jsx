import Immutable from 'immutable'
import React, { Component, PropTypes } from 'react';
import { IndexLink } from 'react-router';
import { createContainer } from 'meteor/react-meteor-data';

import { Entries } from '../api/entries.js';
import EntryList from './EntryList.jsx';

// App component - represents the whole app
class App extends Component {
  render() {
    return (
      <div className="container">
        <header>
          <h1><IndexLink to="/">Hivemind</IndexLink></h1>
          <p>{this.props.tags.map((tag) => <span>#{tag}&nbsp;</span>)}</p> {/* TODO EXTRACT */}
          {this.props.children}
        </header>
      </div>
    );
  }
}

export default createContainer(() => {
  return {
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
