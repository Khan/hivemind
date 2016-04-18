import Immutable from 'immutable'
import React, { Component, PropTypes } from 'react';
import { IndexLink, Link, browserHistory } from 'react-router';
import { createContainer } from 'meteor/react-meteor-data';

import { Entries } from '../api/entries.js';
import EntryList from './EntryList.jsx';

// App component - represents the whole app
class App extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    return (
      <div className="container">
        <header>
          <h1><IndexLink to="/">Hivemind</IndexLink></h1>
          <p>
            <input
              type="search"
              placeholder="Search"
              value={this.props.query}
              onChange={(event) => {
                const wasEmpty = (this.props.query || "") === "";
                const nowEmpty = event.target.value == "";
                const newURL = nowEmpty ? "" : `/?query=${event.target.value}`;
                browserHistory.replace(newURL);
              }}
            />
          </p>
          <p>
            {/* TODO EXTRACT */}
            {this.props.tags.map((tag) =>
              <Link to={`/?filterTag=${tag}`} activeStyle={{color: "red"}}>#{tag}</Link>)
            }
          </p>
          {this.props.home}
        </header>
      </div>
    );
  }
}

export default createContainer((props) => {
  return {
    query: props.params.query,
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
