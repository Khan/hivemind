import { convertFromRaw } from 'draft-js';
import { stateToHTML } from 'draft-js-export-html';
import { Email } from 'meteor/email';
import React from 'react';

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
  let image = (entry.imageURL) ? `<p><img src="${entry.imageURL}" width="320" /></p>` : '';

  const entryAbsoluteURL = Meteor.absoluteUrl(relativeURLForEntryID(entry._id));

  let notes = '';
  if (entry.description) {
    const contentState = convertFromRaw(entry.description);
    notes = stateToHTML(contentState);
  }

  const html = `<p><a href="${entryAbsoluteURL}">${titleAndAuthor} was added to Hivemind</a>. Please reply to this thread with comments, thoughts, and discussion; or add to the entry if you have notes on the thing itself!</p>` +
    `${sourceLink}${tags}${image}` +
    `<blockquote>${notes}</blockquote><p>Search ID: ${entryID}</p>`;

  Email.send({
    from: Meteor.settings.notificationEmails.from,
    to: Meteor.settings.notificationEmails.to,
    replyTo: Meteor.settings.notificationEmails.replyTo,
    subject: subject,
    html: html,
  });
}
