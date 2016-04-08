import React, {PropTypes} from 'react';
import Draft, {Editor, EditorState, ContentState} from 'draft-js';
import Immutable from 'immutable';

class DescriptionEditor extends React.Component {
  constructor(props) {
    super(props);
    const editorState = EditorState.createWithContent(this.rawContentStateToContentState(props.value));
    this.state = {editorState};
    this.onChange = (editorState) => {
      this.setState({editorState});

      const rawContentState = Draft.convertToRaw(editorState.getCurrentContent());
      this.props.onChange(rawContentState)
    }
  }

  rawContentStateToContentState(rawContentState) {
    if (rawContentState) {
      const contentBlocks = Draft.convertFromRaw(rawContentState);
      return ContentState.createFromBlockArray(contentBlocks);
    } else {
      return ContentState.createFromText("");
    }
  }

  componentWillReceiveProps(nextProps) {
    const newContentState = this.rawContentStateToContentState(nextProps.value);
    const {editorState} = this.state;
    if (!Immutable.is(newContentState.getBlockMap(), editorState.getCurrentContent().getBlockMap())) {
      this.setState({editorState: EditorState.push(editorState, newContentState)});
    }
  }

  render() {
    return (
      <Editor
        editorState={this.state.editorState}
        onChange={this.onChange}
      />
    );
  }
}

// Represents a single hivemind database entry
export default class Entry extends React.Component {
  constructor(props) {
    super(props);

    this.onChangeDescription = (rawContentState) => {
      this.props.onChange({...this.props.entry, description: rawContentState});
    }

    this.onChangeTitle = (event) => {
      this.props.onChange({...this.props.entry, title: event.target.value});
    }
  }

  render() {
    return (
      <div className="entry">
      	<h2><input value={this.props.entry.title} onChange={this.onChangeTitle} /></h2>
        <DescriptionEditor
          value={this.props.entry.description}
          onChange={this.onChangeDescription}
        />
      </div>
    );
  }
}
