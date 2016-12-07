import Draft, {EditorState, ContentState} from 'draft-js';
import createAlignmentPlugin, { AlignmentDecorator } from 'draft-js-alignment-plugin';
import createCleanupEmptyPlugin from 'draft-js-cleanup-empty-plugin';
import createDndPlugin, { DraggableDecorator } from 'draft-js-dnd-plugin';
import addBlock from 'draft-js-dnd-plugin/lib/modifiers/addBlock.js';
import createEntityPropsPlugin from 'draft-js-entity-props-plugin';
import createFocusPlugin, { FocusDecorator } from 'draft-js-focus-plugin';
import createImagePlugin, { imageCreator, imageStyles } from 'draft-js-image-plugin';
import createLinkifyPlugin from 'draft-js-linkify-plugin';
import Editor from 'draft-js-plugins-editor-wysiwyg';
import createResizeablePlugin, { ResizeableDecorator } from 'draft-js-resizeable-plugin';
import createToolbarPlugin, { ToolbarDecorator } from 'draft-js-toolbar-plugin';
import Immutable from 'immutable';
import Lodash from 'lodash';
import React from 'react';

const imageComponent = ResizeableDecorator({
  resizeSteps: 10,
  handles: true,
  vertical: 'auto'
})(
  DraggableDecorator(
    FocusDecorator(
      AlignmentDecorator(
        ToolbarDecorator()(
          imageCreator({ theme: imageStyles })
        )
      )
    )
  )
);

// Init Plugins
const plugins = [
  createCleanupEmptyPlugin({
    types: ['block-image']
  }),
  createEntityPropsPlugin({ }),
  createToolbarPlugin({}),
  createFocusPlugin({}),
  createAlignmentPlugin({}),
  createDndPlugin({
    allowDrop: true,
    handleUpload: (data, success, failed, progress) =>
      console.log("UPLOAD"),
    handlePlaceholder: (state, selection, data) => {
      const { type } = data;
      if (type.indexOf('image/') === 0) {
        return 'block-image';
      } return undefined;
    }, handleBlock: (state, selection, data) => {
      const { type } = data;
      if (type.indexOf('image/') === 0) {
        return 'block-image';
      } return undefined;
    },
  }),
  createLinkifyPlugin(),
  createResizeablePlugin({}),
  createImagePlugin({ component: imageComponent }),
];

export default class DescriptionEditor extends React.Component {
  constructor(props) {
    super(props);
    const editorState = EditorState.createWithContent(this.rawContentStateToContentState(props.value));
    this.state = {editorState};
    this.onFocus = () => this.refs.editor.focus();

    this.propagateChange = Lodash.debounce(() => {
      const currentContentState = this.state.editorState.getCurrentContent();
      const oldContentState = this.rawContentStateToContentState(this.props.value);
      if (!currentContentState.equals(oldContentState)) {
        this.props.onChange(Draft.convertToRaw(currentContentState));
      }
    }, 3000);

    this.onChange = (editorState) => {
      this.setState({editorState});
      this.propagateChange();
    };

    this.onBlur = () => {
      this.props.onChange(Draft.convertToRaw(this.state.editorState.getCurrentContent()));
    }

    this.handleKeyCommand = (command) => {
      const newEditorState = Draft.RichUtils.handleKeyCommand(this.state.editorState, command);
      if (newEditorState) {
        this.onChange(newEditorState);
        return true;
      } else {
        return false;
      }
    }
  }

  rawContentStateToContentState(rawContentState) {
    if (rawContentState) {
      return Draft.convertFromRaw(rawContentState);
    } else {
      return ContentState.createFromText("");
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    return nextState !== this.state || nextProps.disabled !== this.props.disabled;
  }

  componentWillReceiveProps(nextProps) {
    const {editorState} = this.state;
    const newContentState = this.rawContentStateToContentState(nextProps.value);
    if (!editorState.getSelection().hasFocus &&
      !newContentState.getBlockMap().equals(editorState.getCurrentContent().getBlockMap())) {
      this.setState({editorState: EditorState.push(editorState, newContentState)});
    }
  }

  render() {
    return (
      <div onClick={this.onFocus} className="descriptionEditor">
        <Editor
          editorState={this.state.editorState}
          onChange={this.onChange}
          handleKeyCommand={this.handleKeyCommand}
          placeholder="Notes, quotes, takeaways…"
          ref="editor"
          plugins={plugins}
          readOnly={this.props.disabled}
          onBlur={this.onBlur}
        />
      </div>
    );
  }
}
