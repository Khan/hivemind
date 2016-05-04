import AutosizeInput from 'react-input-autosize';
import Lodash from 'lodash';
import React from 'react';

export default class EntryTextField extends React.Component {
  constructor(props) {
    super(props);
    this.state = {value: props.value || ""}

    this.propagateChange = Lodash.debounce(() => {
      this.props.onChange(this.state.value);
    }, 400);

    this.onChange = (event) => {
      this.setState({value: event.target.value});
      this.propagateChange();
    };
  }
  render() {
    return <AutosizeInput
      {...this.props}
      onChange={this.onChange}
      onFocus={() => {this.setState({hasFocus: true})}}
      onBlur={() => {this.setState({hasFocus: false})}}
      value={this.state.hasFocus ? this.state.value : this.props.value}
    />;
  }
}
