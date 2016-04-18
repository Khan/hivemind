import React, { Component, PropTypes } from 'react';
import { createContainer } from 'meteor/react-meteor-data';

import EntryList from './EntryList.jsx';
import { Entries } from '../api/entries.js';
import uploadEntryImage from '../api/client/uploadEntryImage';

// Represents the standard UI
class Home extends Component {
  constructor(props) {
    super(props);
    this.addEntry = () => {
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
  console.log(props);
  const { filterTag } = props.location.query;
  const query = filterTag ? {tags: filterTag} : {}
  return {
    entries: Entries.find(query, {sort: [["createdAt", "desc"]]}).fetch(), // TODO: remove eagerness?,
    filterTag
  };
}, Home);
