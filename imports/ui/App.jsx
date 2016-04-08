import React, { Component, PropTypes } from 'react';
import { createContainer } from 'meteor/react-meteor-data';
import {EJSON} from 'meteor/ejson'

import { Entries } from '../api/entries.js';
import Entry from './Entry.jsx';

// App component - represents the whole app
class App extends Component {
  handleEntryChange(newEntry) {
    // The description is fancy--can't store it directly.
    const stringifiedRawContent = EJSON.stringify(newEntry.description);
    Entries.update(newEntry._id, {$set: {description: stringifiedRawContent}})
  }

  renderEntries() {
    return this.props.entries.map((entry) => (
      <Entry
        key={entry._id}
        entry={entry}
        onChange={this.handleEntryChange}
      />
    ));
  }

  render() {
    return (
      <div className="container">
        <header>
          <h1>Entries</h1>
        </header>
        {this.renderEntries()}
      </div>
    );
  }
}

App.propTypes = {
  entries: PropTypes.array.isRequired,
};

export default createContainer(() => {
  return {
    entries: Entries.find({})
      .fetch() // A shame this can't stay lazy...
      // Deserialize the fancy description.
      .map((entry) => {
        return {...entry, description: EJSON.parse(entry.description)}
      }),
  };
}, App);
