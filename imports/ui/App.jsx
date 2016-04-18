import Immutable from 'immutable'
import React, { Component, PropTypes } from 'react';
import { IndexLink, Link, browserHistory } from 'react-router';
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
          <p>
            <input
              type="search"
              placeholder="Search"
              value={this.props.query || ""}
              onChange={(event) => {
                const wasEmpty = (this.props.query || "") === "";
                const nowEmpty = event.target.value == "";
                let newURL = new URL(document.location);
                if (nowEmpty) {
                  newURL.searchParams.delete("query");
                } else {
                  newURL.searchParams.set("query", nowEmpty ? "" : event.target.value);
                }
                browserHistory.replace(newURL.toString());
              }}
            />
          </p>
          <p>
            {/* TODO EXTRACT */}
            {this.props.tags.map((tag) => {
              let newURL = new URL(document.location.origin);
              newURL.searchParams.set("query", `#"${tag}"`);
              return <Link to={newURL.toString()} activeStyle={{color: "red"}}>#{tag}</Link>
            })}
          </p>
          {this.props.home}
        </header>
      </div>
    );
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
