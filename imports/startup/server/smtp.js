export default function () {
  process.env.MAIL_URL = Meteor.settings["mailURL"];
}
