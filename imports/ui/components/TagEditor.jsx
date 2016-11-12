import React from 'react';
import ReactDOM from 'react-dom';
import { Link } from 'react-router';
import { MultiSelect } from 'react-selectize';
import URLSearchParams from 'url-search-params';

import 'react-selectize/themes/index.css';

export default class TagEditor extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isFocused: false,
      dropdownDirection: 1,
    };

    this.onScroll = ((event) => {
      const screenTop = ReactDOM.findDOMNode(this.refs.select).offsetTop - (event.target.scrollTop || document.documentElement.scrollTop);
      dropdownDirection = (event.target.offsetHeight - screenTop) < 215 ? -1 : 1
      if (this.state.dropdownDirection != dropdownDirection)
        this.setState({dropdownDirection: dropdownDirection});
    }).bind(this);
  }

  findScrollingParent() {
    const node = ReactDOM.findDOMNode(this);
    let currentNode = node;
    while (currentNode) {
      if (window.getComputedStyle(currentNode).getPropertyValue("overflow-y") == "scroll") {
        return currentNode;
      }
      currentNode = currentNode.parentNode;
    }
    return window;
  }

  componentDidMount() {
    const scrollingParent = this.findScrollingParent();
    scrollingParent.addEventListener("scroll", this.onScroll);
  }

  componentWillUnmount() {
    const scrollingParent = this.findScrollingParent();
    scrollingParent.removeEventListener("scroll", this.onScroll);
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
      ref="select"
      dropdownDirection = {this.state.dropdownDirection}

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
            <span style={{fontStyle: "italic"}}>Add &lsquo;{option.label}&rsquo;&hellip;</span>
          </div>;
        } else {
          return <div className="simple-option">
              <span>{option.label} ({option.count})</span>
          </div>;
        }
      }}

      placeholder = "Tags"

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
