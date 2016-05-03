import React, { Component } from 'react';
import { createContainer } from 'meteor/react-meteor-data';
import { IndexLink, Link, browserHistory } from 'react-router';

import Entry from './components/Entry.jsx';
import { Entries } from '../api/entries.js';
import uploadEntryImage from '../api/client/uploadEntryImage';

class EntryPage extends Component {
  // TODO: Fix duplication with Home.jsx.
  updateEntry(newEntry) {
    Meteor.call("entry.update", {entryID: newEntry._id, newEntry});
  }

  deleteEntry(entryID) {
    Meteor.call("entry.remove", {entryID});
    browserHistory.push("/");
  }

  render() {
    if (this.props.entry) {
      const { entry } = this.props;
      return (
        <div id="pageContainer">
          <header id="siteHeader">
            <h1><IndexLink to="/">Hivemind</IndexLink></h1>
            <IndexLink to="/" className="allEntries">View all entries</IndexLink>
          </header>
          <Entry
            entry={entry}
            onChange={this.updateEntry}
            onDelete={() => this.deleteEntry(entry._id)}
            onDropImage={(files, callback) => {uploadEntryImage(entry._id, files, callback)}}
          />
        </div>
      );
    } else {
      return <span>Can't find entry!</span>;
    }
  }
}

export default createContainer((props) => {
  return {
    entry: Entries.findOne(props.params.entryID),
  };
}, EntryPage);
