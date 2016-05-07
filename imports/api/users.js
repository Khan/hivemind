import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';

if (Meteor.isServer) {
  Meteor.publish("users", () => Meteor.users.find(
    {},
    {fields: {"profile.name": 1}}
  ));
}
