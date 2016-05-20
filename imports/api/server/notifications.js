import { Email } from 'meteor/email';

import { Entries, relativeURLForEntryID } from '../entries/entries.js';
import { getUserFirstName } from '../../user.js';

export function scheduleNewEntryEmail(entryID, userID) {
  setTimeout(() => Meteor.bindEnvironment(() => sendNewEntryEmail(entryID, userID)), 6000);
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

    let titleWithLink = entry.title;
    if (entry.URL) {
      titleWithLink = `<a href="${entry.URL}">${entry.title}</a>`;
    }

    const entryAbsoluteURL = Meteor.absoluteUrl(relativeURLForEntryID(entry._id));

    Email.send({
      from: Meteor.settings.notificationEmails.from,
      to: Meteor.settings.notificationEmails.to,
      subject: subject,
      html: `<p>${getUserFirstName(user)} <a href="${entryAbsoluteURL}">added notes</a> on ${titleWithLink}:</p><blockquote>${entry.description}</blockquote>`
    });
  }
}
