import React, { Component, PropTypes } from 'react';
import { createContainer } from 'meteor/react-meteor-data';

import EntryList from './EntryList.jsx';
import { Entries } from '../api/entries.js';
import uploadEntryImage from '../api/client/uploadEntryImage';

// Represents the standard UI
class Home extends Component {
  addEntry() {
    Entries.insert({
      createdAt: new Date()
    });
  }

  updateEntry(newEntry) {
    Meteor.call("entry.update", {entryID: newEntry._id, newEntry});
  }

  deleteEntry(entryID) {
    Meteor.call("entry.remove", {entryID});
  }

  render() {
    return (
      <div className="home">
        <button onClick={this.addEntry}>Add Entry</button>
        <EntryList
          entries={this.props.entries}
          onChangeEntry={this.updateEntry}
          onDeleteEntry={this.deleteEntry}
          onDropImage={uploadEntryImage}
        />
      </div>
    );
  }
}

export default createContainer(() => {
  return {
    entries: Entries.find({}, {sort: [["createdAt", "desc"]]}).fetch(), // TODO: remove eagerness?
  };
}, Home);
