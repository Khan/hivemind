import React from 'react';
import { getUserFirstName } from '../../user.js';

export default class ToggleList extends React.Component {
  render() {
    const {users, currentUser, disabled} = this.props;
    const isActive = (users && currentUser) ? users.find((user) => user._id === currentUser._id) : false;

    let names = <span className="noActiveUsers">No one yet</span>;
    if (users && users.length > 0) {
      names = users.map((user) => {
        return <span key={user._id}>{getUserFirstName(user)}</span>;
      });
    }

    const iconImage = <img src={`/images/${this.props.iconName}_${isActive ? "active" : "inactive"}.png`} />;
    const icon = (currentUser && !disabled) ? (
      <a href="#" onClick={(event) => {
        this.props.onChange(!isActive);
        event.preventDefault();
      }}>{iconImage}</a>
    ) : iconImage;

    return (<div className={"userToggleList " + this.props.className}>
      {icon}
      {names}
    </div>);
  }
}
