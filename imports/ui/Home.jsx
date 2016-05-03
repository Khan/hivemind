import React, { Component, PropTypes } from 'react';
import { createContainer } from 'meteor/react-meteor-data';
import { IndexLink, Link, browserHistory } from 'react-router';

import UserButton from './components/UserButton.jsx';
import EntryList from './EntryList.jsx';
import { Entries, EntriesIndex } from '../api/entries.js';
import uploadEntryImage from '../api/client/uploadEntryImage';

// Represents the standard UI
class Home extends Component {
  constructor(props) {
    super(props);
    this.addEntry = () => {
      // TODO: Reimplement this feature for unified search
      const tags = this.props.filterTag ? [this.props.filterTag] : []
      Entries.insert({
        createdAt: new Date(),
        updatedAt: new Date(),
        tags
      });
    }
  }

  updateEntry(newEntry) {
    Meteor.call("entry.update", {entryID: newEntry._id, newEntry});
  }

  deleteEntry(entryID) {
    Meteor.call("entry.remove", {entryID});
  }

  render() {
    return (
      <div id="pageContainer">
        <header id="siteHeader">
          <h1><IndexLink to="/">Hivemind</IndexLink></h1>
          <input
            type="search"
            placeholder="Search"
            className="search"
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
        <UserButton user={this.props.user} />
          <a href="#" className="add" onClick={this.addEntry} title="Add Entry">+</a>
        </header>
        <div className="home">
          <EntryList
            entries={this.props.entries}
            onChangeEntry={this.updateEntry}
            onDeleteEntry={this.deleteEntry}
            onDropImage={uploadEntryImage}
          />
        </div>
      </div>
    );
  }
}

export default createContainer((props) => {
  const { query } = props.location.query;
  let entries;
  if (query) {
    entries = EntriesIndex.search(props.location.query.query).fetch();
  } else {
    entries = Entries.find({}, {sort: [["createdAt", "desc"]]}).fetch()
  }
  return {
    entries: entries, // TODO: remove eagerness?,
    query: query,
    user: Meteor.user(),
  };
}, Home);
