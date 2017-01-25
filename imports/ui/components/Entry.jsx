import Dropzone from 'react-dropzone';
import { Link } from 'react-router';
import React from 'react';

import DescriptionEditor from './DescriptionEditor.jsx';
import EntryImage from './EntryImage.jsx';
import EntryTextField from './EntryTextField.jsx';
import SourceLink from './SourceLink.jsx';
import TagEditor from './TagEditor.jsx';
import ToggleList from './ToggleList.jsx';
import { relativeURLForEntryID } from '../../api/entries/entries.js';

// Represents a single hivemind database entry--the full, editable view.
export default class Entry extends React.Component {
  constructor(props) {
    super(props);

    this.onChangeDescription = (rawContentState) => {
      this.props.onChange({...this.props.entry, description: rawContentState});
    };

    this.onChangeTitle = (newTitle) => {
      this.props.onChange({...this.props.entry, title: newTitle});
    };

    this.onChangeAuthor = (newAuthor) => {
      this.props.onChange({...this.props.entry, author: newAuthor});
    };

    this.onChangeURL = (newURL) => {
      this.props.onChangeURL(newURL);
    };

    this.onChangeTags = (newTags) => {
      this.props.onChange({...this.props.entry, tags: newTags});
    };

    this.onDelete = (event) => {
      if (window.confirm("Are you sure you want to delete this entry? There is no undo.")) {
        this.props.onDelete();
      }
      event.preventDefault();
    };
  }

  shouldComponentUpdate(nextProps, nextState) {
    if (nextState !== this.state) {
      console.log(`Updating entry ${nextProps.entry.title} due to changed state`);
      return true;
    } else {
      return nextProps.entry.updatedAt.getTime() !== this.props.entry.updatedAt.getTime() ||
        nextProps.disabled !== this.props.disabled;
    }
  }

  render() {
    const hasValidImage = (this.props.entry.imageURL || "") !== "";

    let mailingListLink;
    if (this.props.entry.mailingListID) {
      const nameForMailingListLink = this.props.entry.mailingListID.replace(" ", "$20");
      const mailingListURL = `https://groups.google.com/a/khanacademy.org/forum/#!searchin/long-term-research-team/%5Bhivemind%5D$20${nameForMailingListLink}`;
      mailingListLink = <a href={mailingListURL}>Discussion Thread</a>;
    } else {
      if (this.props.disabled) {
        mailingListLink = null;
      } else {
        mailingListLink = <a href="#" className="startDiscussionThread" onClick={(e) => {this.props.onStartDiscussionThread(); e.preventDefault()}}>Start Discussion Thread</a>;
      }
    }

    const bottomControls =
      <div className="bottomControls">
        {this.props.disabled ? null : <a href="#" onClick={this.onDelete} className="delete">Delete</a>}
        {hasValidImage ? null : <a href="#" onClick={(e) => {this.refs.dropzone.open(); e.preventDefault()}}>Add Main Image</a>}
        <Link to={relativeURLForEntryID(this.props.entry._id)} className="permalink">Permalink</Link>
        {mailingListLink}
      </div>;

    const dates =
      <div className="dates">
        <span>Added on {this.props.entry.createdAt.toLocaleDateString("en-us", {year: "2-digit", month: "2-digit", day: "2-digit"})}.</span>
        <span>Updated on {this.props.entry.updatedAt.toLocaleDateString("en-us", {year: "2-digit", month: "2-digit", day: "2-digit"})}.</span>
      </div>;

    const descriptionEditor =
      <DescriptionEditor
        value={this.props.entry.description}
        onChange={this.onChangeDescription}
        disabled={this.props.disabled}
      />;

    const recommenderList = <ToggleList
        currentUser={Meteor.user()}
        users={this.props.entry.recommenders}
        onChange={this.props.onChangeRecommending}
        iconName="heart"
        className="recommenderList"
      />;

    const viewerList = <ToggleList
        currentUser={Meteor.user()}
        users={this.props.entry.viewers}
        onChange={this.props.onChangeViewing}
        iconName="check"
        className="viewerList"
      />;

    const tagEditor =
      <TagEditor
        onChange={this.onChangeTags}
        tags={this.props.entry.tags}
        disabled={this.props.disabled}
        allTags={this.props.allTags}
      />;

    let contents;
    if (hasValidImage) {
      contents = (
        <div className="contents">
          <div className="leftColumn">
            <div className="entryImage">
              <EntryImage
                onDropImage={this.props.onDropImage}
                imageURL={this.props.entry.imageURL}
              />
            </div>
            {recommenderList}
            {viewerList}
            {bottomControls}
          </div>
          <div className="notes">
            {descriptionEditor}
            <div className="tagEditorAndDates">
              {tagEditor}
              {dates}
            </div>
          </div>
        </div>
      );
    } else {
      contents = (
        <Dropzone
          onDrop={this.props.onDropImage}
          multiple={false}
          accept="image/*"
          style={{}}
          disableClick={true}
          ref="dropzone"
        >
          <div className="contents oneColumn">
            <div className="notes">
              {descriptionEditor}
              <div className="tagEditorAndDates">
                {tagEditor}
                {dates}
              </div>
              <div className="toggleListsAndControls">
                {recommenderList}
                {viewerList}
                {bottomControls}
              </div>
            </div>
          </div>
        </Dropzone>
      );
    }

    return (
      <div className={"entry" + (this.props.disabled ? "" : " editable")}>
        <header>
          <div className="titleAndAuthor">
            <EntryTextField
              className="title"
              value={this.props.entry.title}
              onChange={this.onChangeTitle}
              placeholder="Title"
              disabled={this.props.disabled}
            />
            <span className={"author " + (((this.props.entry.author || "") === "") ? "hidden-until-hover" : "")}>
              &nbsp;by&nbsp;<EntryTextField
                value={this.props.entry.author}
                onChange={this.onChangeAuthor}
                placeholder="Author"
                disabled={this.props.disabled}
              />
            </span>
          </div>
          <SourceLink
            onChange={this.onChangeURL}
            URL={this.props.entry.URL}
            disabled={this.props.disabled}
          />
        </header>
        {contents}
      </div>
    );
  }
}
