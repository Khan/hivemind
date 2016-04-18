import React, { Component, PropTypes } from 'react';
import { createContainer } from 'meteor/react-meteor-data';

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
  };
}, Home);
