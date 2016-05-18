import React, { Component } from 'react';
import { createContainer } from 'meteor/react-meteor-data';
import { IndexLink, Link, browserHistory } from 'react-router';

import Entry from './components/Entry.jsx';
import UserButton from './components/UserButton';
import { Entries } from '../api/entries.js';
import uploadEntryImage from '../api/client/uploadEntryImage';
import materializeEntryUsers from '../materializeEntryUsers';

class EntryPage extends Component {
  // TODO: Fix duplication with Home.jsx.
  updateEntry(newEntry) {
    Meteor.call("entry.update", {entryID: newEntry._id, newEntry});
  }

  deleteEntry(entryID) {
    Meteor.call("entry.remove", {entryID});
    browserHistory.push("/");
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

    console.log(this.props.entry)
    if (this.props.entry) {
      const { entry, user } = this.props;
      return (
        <div id="pageContainer">
          <header id="siteHeader">
            <h1><IndexLink to="/">Hivemind</IndexLink></h1>
            <IndexLink to="/" className="allEntries">View all entries</IndexLink>
            <UserButton user={user} />
          </header>
          <Entry
            entry={entry}
            onChange={this.updateEntry}
            onChangeRecommending={(isNewlyRecommending) => this.changeRecommending(entry._id, isNewlyRecommending)}
            onChangeViewing={(isNewlyViewing) => this.changeViewing(entry._id, isNewlyViewing)}
            onDelete={() => this.deleteEntry(entry._id)}
            onDropImage={(files, callback) => {uploadEntryImage(entry._id, files, callback)}}
            disabled={this.props.user === null}
          />
        </div>
      );
    } else {
      return <span>Can't find entry!</span>;
    }
  }
}

export default createContainer((props) => {
  const entryID = props.params.entryID;

  const entrySubscription = Meteor.subscribe("entry", entryID);
  const usersSubscription = Meteor.subscribe("users");

  return {
    entry: Entries.findOne(entryID, {transform: materializeEntryUsers}),
    user: Meteor.user(),
    ready: entrySubscription.ready() && usersSubscription.ready(),
  };
}, EntryPage);
