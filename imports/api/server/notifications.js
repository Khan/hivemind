import { Email } from 'meteor/email';
import React from 'react';
import ReactDOM from 'react-dom/server';

import { Entries, relativeURLForEntryID } from '../entries/entries.js';
import DescriptionEditor from '../../ui/components/DescriptionEditor.jsx';

export function sendNewEntryEmail(entryID) {
  const entry = Entries.findOne(entryID);
  if (!entry) {
    throw new Meteor.Error("Notifications.sendNewEntryEmail.unknownEntry", `Unknown entry ${entryID}`);
  }

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
      disabled: true,
      onChange: (state) => {},
    }));
  }

  const html = `<p><a href="${entryAbsoluteURL}">${titleAndAuthor} was added to Hivemind</a>. Please reply to this thread with comments, thoughts, and discussion; or add to the entry if you have notes on the thing itself!</p>` +
    `${sourceLink}${tags}` +
    `<blockquote>${notes}</blockquote><p>Search ID: ${entryID}</p>`;

  Email.send({
    from: Meteor.settings.notificationEmails.from,
    to: Meteor.settings.notificationEmails.to,
    subject: subject,
    html: html,
  });
}
