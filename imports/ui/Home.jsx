import React, { Component, PropTypes } from 'react';
import { createContainer } from 'meteor/react-meteor-data';
import { IndexLink, browserHistory } from 'react-router';

import EntryList from './components/EntryList.jsx';
import SearchField from './components/SearchField.jsx';
import UserButton from './components/UserButton.jsx';
import { Entries, EntriesIndex } from '../api/entries/entries.js';
import uploadEntryImage from '../api/client/uploadEntryImage';
import materializeEntryUsers from '../materializeEntryUsers';

// Represents the standard UI
class Home extends Component {
  constructor(props) {
    super(props);
    this.addEntry = () => {
      // TODO: Reimplement the tag-dependent creation feature for unified search.
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

  changeURL(entryID, newURL) {
    Meteor.call("entry.setURL", {entryID: entryID, URL: newURL});
  }

  startDiscussionThread(entryID) {
    Meteor.call("entry.startDiscussionThread", {entryID: entryID});
  }

  render() {
    if (!this.props.ready) {
      return <span>Loading...</span>;
    }

    return (
      <div id="pageContainer">
        <header id="siteHeader">
          <h1><IndexLink to="/">Hivemind</IndexLink></h1>
          <SearchField value={this.props.query} />
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
            onChangeURL={this.changeURL}
            onDropImage={uploadEntryImage}
            onStartDiscussionThread={this.startDiscussionThread}
            disabled={this.props.user === null}
            focusedEntry={this.props.focusedEntry}
          />
        </div>
      </div>
    );
  }
}

export default createContainer((props) => {
  const entriesSubscription = Meteor.subscribe("entries");
  const usersSubscription = Meteor.subscribe("users");

  const { query, entry } = props.location.query;
  let entries = null;
  let focusedEntry = null;
  if (query && query.length > 0) {
    entries = EntriesIndex.search(query).fetch();
  } else {
    entries = Entries.find({}, {sort: [["createdAt", "desc"]]}).fetch()
  }

  if (entry && entry.length > 0) {
    focusedEntry = Entries.findOne(entry);
    if (focusedEntry) {
      focusedEntry = materializeEntryUsers(focusedEntry);
    }
  }

  return {
    entries: entries.map(materializeEntryUsers), // TODO: remove eagerness?,
    query: query,
    user: Meteor.user(),
    ready: entriesSubscription.ready() && usersSubscription.ready(),
    focusedEntry: focusedEntry,
  };
}, Home);
