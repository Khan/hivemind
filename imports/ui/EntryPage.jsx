import React, { Component } from 'react';
import { createContainer } from 'meteor/react-meteor-data';

import Entry from './Entry.jsx';
import { Entries } from '../api/entries.js';

class EntryPage extends Component {
  render() {
    if (this.props.entry) {
      return <Entry entry={this.props.entry} />
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
