import React from 'react';

export default (props) => (
  <a href="#" className="userButton" onClick={() => {
    if (props.user) {
      Meteor.logout();
    } else {
      Meteor.loginWithGoogle({
        requestPermissions: ['https://www.googleapis.com/auth/userinfo.profile', 'https://www.googleapis.com/auth/userinfo.email']
      }, (err) => {
        if (err) {
          window.alert(err);
        }
      });
    }
  }}>{props.user ? "Logout" : "Login"}</a>
);
