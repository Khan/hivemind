import Draft, {EditorState, ContentState, DefaultDraftBlockRenderMap} from 'draft-js';
import createAlignmentPlugin, { AlignmentDecorator } from 'draft-js-alignment-plugin';
import createCleanupEmptyPlugin from 'draft-js-cleanup-empty-plugin';
import createDndPlugin, { DraggableDecorator } from 'draft-js-dnd-plugin';
import addBlock from 'draft-js-dnd-plugin/lib/modifiers/addBlock.js';
import { readFile } from 'draft-js-dnd-plugin/lib/utils/file.js';
import createEntityPropsPlugin from 'draft-js-entity-props-plugin';
import createFocusPlugin, { FocusDecorator } from 'draft-js-focus-plugin';
import createImagePlugin, { imageCreator, imageStyles } from 'draft-js-image-plugin';
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
    handleUpload: (data, success, failed, progress) => {
      // TODO(andy): Extract all this!
      
      const uploadID = new Date();
      const uploadOperations = data.files.map(file => {
        return new Promise((resolve, reject) => {
          S3.upload({
            files: [file],
            path: "noteImages",
            uploader: uploadID,
          }, (error, result) => {
            if (error) {
              reject(error);
            } else {
              // It shouldn't be necessary to read the file here, but draft-js-dnd-plugin's API surface requires the src argument here, which we can't get any other way...
              readFile(file).then(Meteor.bindEnvironment(localFileData => {
                resolve({
                  name: result.file.name,
                  size: result.file.size,
                  type: result.file.type,
                  url: result.secure_url,
                  src: localFileData.src,
                });
              }));
            }
          });
        });
      });

      const progressObserver = Tracker.autorun(() => {
        totalProgress = S3.collection.find({uploader: uploadID}).fetch().reduce((accumulator, file) => {
          return accumulator + file.percent_uploaded;
        }, 0);
        progress(totalProgress / data.files.length);
      });

      Promise.all(uploadOperations).then((uploadedFiles) => {
        success(uploadedFiles);
        progressObserver.stop();
      }, () => {
        progressObserver.stop();
      });
    }, handlePlaceholder: (state, selection, data) => {
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
  createResizeablePlugin({}),
  createImagePlugin({ component: imageComponent, type: "block-image" }),
];

export default class DescriptionEditor extends React.Component {
  constructor(props) {
    super(props);
    const editorState = EditorState.createWithContent(this.rawContentStateToContentState(props.value));
    this.state = {editorState};
    this.onFocus = () => this.refs.editor.focus();

    this.propagateChange = Lodash.debounce(() => {
      const rawContentState = Draft.convertToRaw(this.state.editorState.getCurrentContent());
      this.props.onChange(rawContentState)
    }, 300);

    this.onChange = (editorState) => {
      this.setState({editorState});
      this.propagateChange();
    };

    this.handleKeyCommand = (command) => {
      const newEditorState = Draft.RichUtils.handleKeyCommand(this.state.editorState, command);
      if (newEditorState) {
        this.onChange(newEditorState);
        return true;
      } else {
        return false;
      }
    }

    this.blockRenderMap = DefaultDraftBlockRenderMap.merge(Immutable.Map({
      'paragraph': {
        element: 'div',
      },
      'unstyled': {
        element: 'div',
      },
      'block-image': {
        element: 'div',
      },
    }));
  }

  rawContentStateToContentState(rawContentState) {
    if (rawContentState) {
      return Draft.convertFromRaw(rawContentState);
    } else {
      return ContentState.createFromText("");
    }
  }

  componentWillReceiveProps(nextProps) {
    const newContentState = this.rawContentStateToContentState(nextProps.value);
    const {editorState} = this.state;
    if (
      !editorState.getSelection().hasFocus &&
      !Immutable.is(newContentState.getBlockMap(), editorState.getCurrentContent().getBlockMap()))
    {
      this.setState({editorState: EditorState.push(editorState, newContentState)});
    }
  }

  render() {
    return (
      <div onClick={this.onFocus} className="descriptionEditor">
        <Editor
          editorState={this.state.editorState}
          blockRenderMap={this.blockRenderMap}
          onChange={this.onChange}
          handleKeyCommand={this.handleKeyCommand}
          placeholder="Notes, quotes, takeaways…"
          ref="editor"
          plugins={plugins}
          readOnly={this.props.disabled}
        />
      </div>
    );
  }
}
