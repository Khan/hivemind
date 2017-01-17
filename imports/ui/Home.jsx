import React, { Component, PropTypes } from 'react';
import { createContainer } from 'meteor/react-meteor-data';
import { IndexLink, browserHistory } from 'react-router';
import URLSearchParams from 'url-search-params';

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
      Meteor.call("entry.create", {tags: []}, (error, newEntryID) => {
        // TODO: remove duplication here.
        if (newEntryID) {
          const newURL = new URL(document.location);
          const params = new URLSearchParams(newURL.search.slice(1));
          params.set("entry", newEntryID);
          newURL.search = params.toString();
          browserHistory.replace(newURL.toString());
        } else {
          console.error(error);
        }
      })
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
            tags={this.props.tags}
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

const tagEntriesReactiveVar = new ReactiveVar(null);

export default createContainer((props) => {
  const entriesSubscription = Meteor.subscribe("entries");
  const usersSubscription = Meteor.subscribe("users");

  const { query, entry } = props.location.query;
  let entriesCursor = Entries.find({}, {sort: [["createdAt", "desc"]]});
  let focusedEntry = null;
  if (query && query.length > 0) {
    entriesCursor = EntriesIndex.search(query);
  } else {
    entriesCursor = Entries.find({}, {sort: [["createdAt", "desc"]]});
  }
  const entries = entriesCursor.fetch()

  if (entry && entry.length > 0) {
    focusedEntry = Entries.findOne(entry);
    if (focusedEntry) {
      focusedEntry = materializeEntryUsers(focusedEntry);
    }
  }

  const updateTagEntries = () => {
    Meteor.call("entries.fetchAllTagEntriesSortedDescending", (error, response) => {
      tagEntriesReactiveVar.set(response);
    });
  };
  Entries.find({}).observe({
    added: () => {
      if (tagEntriesReactiveVar.get() === null) {
        updateTagEntries();
        tagEntriesReactiveVar.set([]);
      }
    },
    changed: updateTagEntries,
    removed: updateTagEntries
  });

  return {
    entries: entries.map(materializeEntryUsers), // TODO: remove eagerness?,
    tags: tagEntriesReactiveVar.get(),
    query: query,
    user: Meteor.user(),
    ready: entriesSubscription.ready() && usersSubscription.ready(),
    focusedEntry: focusedEntry,
  };
}, Home);
