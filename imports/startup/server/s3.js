export default function () {
  S3.config = {
  	key: Meteor.settings.S3.key,
  	secret: Meteor.settings.S3.secret,
  	bucket: Meteor.settings.S3.bucket,
  	region: Meteor.settings.S3.region,
  };
}
