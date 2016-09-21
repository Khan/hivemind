import Draft from 'draft-js';
import React from 'react';
import URLSearchParams from 'url-search-params';
import { browserHistory } from 'react-router';

import ToggleList from './ToggleList.jsx';

// Represents a single hivemind database entry--the collapsed view as it appears in a list.
export default class EntryCell extends React.Component {
  shouldComponentUpdate(nextProps, nextState) {
    if (nextState !== this.state) {
      return true;
    } else {
      return nextProps.entry.updatedAt.getTime() !== this.props.entry.updatedAt.getTime();
    }
  }

  navigate() {
    const newURL = new URL(document.location);
    const params = new URLSearchParams(newURL.search.slice(1));
    params.set("entry", this.props.entry._id);
    newURL.search = params.toString();
    browserHistory.replace(newURL.toString());
  }

  render() {
    let author = null;

    let recommenderList = <ToggleList
        users={this.props.entry.recommenders}
        iconName="heart"
        className="recommenderList"
        disabled="true"
      />;
    if (!this.props.entry.recommenders || this.props.entry.recommenders.length == 0) {
      recommenderList = null;
    }

    if (this.props.entry.author) {
      author = <span className="author">
        by {this.props.entry.author}
      </span>
    }

    let description = null;
    if (this.props.entry.description) {
      const contentState = Draft.convertFromRaw(this.props.entry.description);
      const descriptionText = contentState.getPlainText();
      if (descriptionText.length > 0) {
        description = descriptionText.substr(0, 300);
      }
    }

    let titleAndAuthor;
    if (description) {
      titleAndAuthor = <div className="titleAndAuthor">
        <span className="title">
          {this.props.entry.title}
        </span>
        {author}
      </div>;
    } else {
      titleAndAuthor = <div className="titleAndAuthor pending">
        {this.props.entry.title} [pending]{author}
      </div>;
    }

    let imageURL = this.props.entry.imageURL;
    let imageNode;
    if (imageURL) {
      imageNode = <img src={imageURL} />;
    } else {
      imageNode = <div className="imagePlaceholder"></div>;
    }

    return <a className="entryCell" onClick={(e) => {this.navigate(); e.preventDefault();}}>
      <div className="imageContainer">
        {imageNode}
      </div>
      <div className="content">
        <div className="heading">
          {titleAndAuthor}
          <div className="toggleLists">
            {recommenderList}
          </div>
        </div>
        <div className="description">
          {description}
        </div>
      </div>
    </a>;
  }
}
