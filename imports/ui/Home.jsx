import React, { Component, PropTypes } from 'react';
import { createContainer } from 'meteor/react-meteor-data';
import { IndexLink, Link, browserHistory } from 'react-router';

import EntryList from './components/EntryList.jsx';
import UserButton from './components/UserButton.jsx';
import { Entries, EntriesIndex } from '../api/entries.js';
import uploadEntryImage from '../api/client/uploadEntryImage';
import materializeEntryUsers from '../materializeEntryUsers';

// Represents the standard UI
class Home extends Component {
  constructor(props) {
    super(props);
    this.addEntry = () => {
      // TODO: Reimplement this feature for unified search
      Meteor.call("entry.create", {tags: []});
    }
  }

  updateEntry(newEntry) {
    Meteor.call("entry.update", {entryID: newEntry._id, newEntry});
  }

  deleteEntry(entryID) {
    Meteor.call("entry.remove", {entryID});
  }

  changeRecommending(entryID, isNewlyRecommending) {
    Meteor.call("entry.updateRecommender", {entryID: entryID, isNewlyRecommending: isNewlyRecommending});
  }

  changeViewing(entryID, isNewlyViewing) {
    Meteor.call("entry.updateViewer", {entryID: entryID, isNewlyViewing: isNewlyViewing});
  }

  render() {
    if (!this.props.ready) {
      return <span>Loading...</span>;
    }

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
          {this.props.user !== null ? (<a href="#" className="add" onClick={this.addEntry} title="Add Entry">+</a>) : null}
        </header>
        <div className="home">
          <EntryList
            entries={this.props.entries}
            onChangeEntry={this.updateEntry}
            onDeleteEntry={this.deleteEntry}
            onChangeRecommending={this.changeRecommending}
            onChangeViewing={this.changeViewing}
            onDropImage={uploadEntryImage}
            disabled={this.props.user === null}
          />
        </div>
      </div>
    );
  }
}

export default createContainer((props) => {
  const entriesSubscription = Meteor.subscribe("entries");
  const usersSubscription = Meteor.subscribe("users");

  const { query } = props.location.query;
  let entries;
  if (query) {
    entries = EntriesIndex.search(props.location.query.query).fetch();
  } else {
    entries = Entries.find({}, {sort: [["createdAt", "desc"]]}).fetch()
  }

  return {
    entries: entries.map(materializeEntryUsers), // TODO: remove eagerness?,
    query: query,
    user: Meteor.user(),
    ready: entriesSubscription.ready() && usersSubscription.ready(),
  };
}, Home);
