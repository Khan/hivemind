import React, { Component } from 'react';
import { browserHistory } from 'react-router'
import { createContainer } from 'meteor/react-meteor-data';

import Entry from './Entry.jsx';
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
        <Entry
          entry={entry}
          onChange={this.updateEntry}
          onDelete={() => this.deleteEntry(entry._id)}
          onDropImage={(files, callback) => {uploadEntryImage(entry._id, files, callback)}}
        />
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
