import { Email } from 'meteor/email';
import React from 'react';
import ReactDOM from 'react-dom/server';

import { Entries, relativeURLForEntryID } from '../entries/entries.js';
import DescriptionEditor from '../../ui/components/DescriptionEditor.jsx';
import { getUserFirstName } from '../../user.js';

export function scheduleNewEntryEmail(entryID, userID) {
  // TODO(andy): At some point we'll need to make a real job queue. For now, we'll just do this dumb thing. If the server goes down or whatever, we'll lose the job. That's OK.
  const halfAnHour = 30 * 60 * 1000;
  setTimeout(Meteor.bindEnvironment(() => sendNewEntryEmail(entryID, userID)), halfAnHour);
}

function sendNewEntryEmail(entryID, userID) {
  const entry = Entries.findOne(entryID);
  const user = Meteor.users.findOne(userID);
  if (entry && user) {
    let titleAndAuthor = `"${entry.title || "(untitled)"}"`;
    if (entry.author) {
      titleAndAuthor += ` by ${entry.author}`;
    }
    let subject = `[hivemind] ${titleAndAuthor} - Discussion Thread`;

    let sourceLink = entry.URL ? `<p>Original URL: <a href="${entry.URL}">${entry.URL}</a></p>` : '';
    let tags = (entry.tags && entry.tags.length > 0) ? `<p>Tags: ${entry.tags.map((tag) => `#${tag}`).join(" ")}</p>` : '';

    const entryAbsoluteURL = Meteor.absoluteUrl(relativeURLForEntryID(entry._id));

    let notes = '';
    if (entry.description) {
      notes = ReactDOM.renderToString(React.createElement(DescriptionEditor, {
        value: entry.description,
        disabled: true
      }));
    }

    const html = `<p>${getUserFirstName(user)} <a href="${entryAbsoluteURL}">added ${titleAndAuthor} to Hivemind</a>. Please reply to this thread with comments, thoughts, and discussion; or add to the entry if you have notes on the thing itself!</p>` +
      `${sourceLink}${tags}` +
      `<blockquote>${notes}</blockquote>`;

    Email.send({
      from: Meteor.settings.notificationEmails.from,
      to: Meteor.settings.notificationEmails.to,
      subject: subject,
      html: html,
    });
  }
}
