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
    const title = entry.title || "(untitled)";
    let subject = `[hivemind] New entry: "${title}"`;
    if (entry.author) {
      subject += ` by ${entry.author}`;
    }

    let sourceLink = entry.URL ? `<p><a href="${entry.URL}">${entry.URL}</a></p>` : '';
    let tags = (entry.tags && entry.tags.length > 0) ? `<p>${entry.tags.map((tag) => `#${tag}`).join(" ")}</p>` : '';

    const entryAbsoluteURL = Meteor.absoluteUrl(relativeURLForEntryID(entry._id));

    let notes = '';
    if (entry.description) {
      notes = ReactDOM.renderToString(React.createElement(DescriptionEditor, {
        value: entry.description,
        disabled: true
      }));
    }

    const html = `<p>${getUserFirstName(user)} <a href="${entryAbsoluteURL}">added ${title} to Hivemind</a>:</p>` +
      `${sourceLink}${tags}` +
      `<blockquote>${notes}</blockquote>`;
    console.log(html);

    Email.send({
      from: Meteor.settings.notificationEmails.from,
      to: Meteor.settings.notificationEmails.to,
      subject: subject,
      html: html,
    });
  }
}
