import Lodash from 'lodash';
import React from 'react';
import URLSearchParams from 'url-search-params';
import { browserHistory } from 'react-router';

export default class SearchField extends React.Component {
  constructor(props) {
    super(props);
    this.state = {value: props.value || ""};

    this.propagateChange = Lodash.throttle(() => {
      const nowEmpty = this.state.value == "";

      let newURL = new URL(document.location);
      const params = new URLSearchParams(newURL.search.slice(1));
      if (nowEmpty) {
        params.delete("query");
      } else {
        params.set("query", nowEmpty ? "" : this.state.value);
      }

      newURL.search = params.toString();
      browserHistory.replace(newURL.toString());
    }, 500, {leading: false});

    this.onChange = (event) => {
      this.setState({value: event.target.value});
      this.propagateChange();
    };
  }

  render() {
    return <input
      type="search"
      placeholder="Search"
      className="search"
      value={(this.state.hasFocus ? this.state.value : this.props.value) || ""}
      onChange={this.onChange}
      onFocus={() => {this.setState({hasFocus: true})}}
      onBlur={() => {this.setState({hasFocus: false})}}
    />
  }
}
