import React from 'react';
import { Link } from 'react-router';
import { MultiSelect } from 'react-selectize';
import URLSearchParams from 'url-search-params';

import 'react-selectize/themes/index.css';

export default class TagEditor extends React.Component {
  constructor(props) {
    super(props);
    this.state = {isFocused: false};
  }

  render() {
    const propItems = (this.props.tags || []).map((tag) => {
      return {value: tag, label: tag}
    });
    const items = this.state.isFocused ? this.state.items : propItems;

    const options = this.props.allTags.map((tag) => {
      return {value: tag.tag, label: tag.tag, count: tag.count}
    })

    return <MultiSelect
      className="tagEditor"

      onFocus = {() => {
        this.setState({
          isFocused: true,
          items: propItems
        })
      }}

      onBlur = {() => {
        this.setState({
          isFocused: false
        })
      }}

      // createFromSearch :: [Item] -> [Item] -> String -> Item?
      createFromSearch = {function(options, values, search){
          labels = values.map(function(value){ 
              return value.label; 
          })
          if (search.trim().length == 0 || labels.indexOf(search.trim()) != -1)
              return null;
          return {label: search.trim(), value: search.trim()};
      }}

      values = {items}
      options = {options}

      onValuesChange = {(items) => {
        this.setState({items: items});

        const tags = items.map((item) => { return item.value; });
        this.props.onChange(tags);
      }}

      renderOption = {(option) => {
        if (option.newOption) {
          return <div className="simple-option">
            <span style={{fontStyle: "italic"}}>Add {option.label}&hellip;</span>
          </div>;
        } else {
          return <div className="simple-option">
              <span>{option.label} ({option.count})</span>
          </div>;
        }
      }}

      renderToggleButton = {() => { return null; }}
      hideResetButton = {true}

      renderValue = {(item) => {
        return <Tag tag={item.value} />;
      }}
    />;
  }
}

const Tag = (props) => {
  const tagName = props.tag;

  const params = new URLSearchParams();
  params.set("query", `#"${tagName}"`);

  const newURL = new URL(document.location.origin);
  newURL.search = params.toString();
  return <span style={{
      color: "#999",
      marginRight: "7px"
  }}><Link to={newURL.toString()}>#{tagName}</Link></span>
};
