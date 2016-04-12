import React, {PropTypes} from 'react';
import Draft, {Editor, EditorState, ContentState} from 'draft-js';
import Immutable from 'immutable';

class DescriptionEditor extends React.Component {
  constructor(props) {
    super(props);
    const editorState = EditorState.createWithContent(this.rawContentStateToContentState(props.value));
    this.state = {editorState};
    this.onFocus = () => this.refs.editor.focus();
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
      <div onClick={this.onFocus} className="descriptionEditor">
        <Editor
          editorState={this.state.editorState}
          onChange={this.onChange}
          placeholder="Notes, quotes, takeaways…"
          ref="editor"
        />
      </div>
    );
  }
}

function findTags(contentBlock, callback) {
  let currentEntityStartingLocation = 0;
  let currentEntityKey = null;
  for (let entry of contentBlock.getCharacterList().entries()) {
    const [index, characterMetadata] = entry;
    const entityKey = characterMetadata.getEntity();
    if (entityKey !== currentEntityKey) {
      if (currentEntityKey !== null) {
        if (currentEntityKey !== null && Draft.Entity.get(currentEntityKey).getType() === "tag") {
          callback(currentEntityStartingLocation, index);
        }
        currentEntityStartingLocation = index;
      }
      currentEntityKey = entityKey;
    }
  }
  if (currentEntityKey !== null) {
    callback(currentEntityStartingLocation, contentBlock.getLength());
  }
}

const Tag = (props) => {
  const {name} = Draft.Entity.get(props.entityKey).getData();
  return <span style={{color: "red", padding: "0px 10px"}}>{name}</span>
};

class TagEditor extends React.Component {
  constructor(props) {
    super(props);
    const editorState = editorStateDisplayingTags(props.tags || [], new Draft.CompositeDecorator([{
      strategy: findTags,
      component: Tag,
    }]));
    this.state = {editorState};

    this.onChange = (editorState) => {
      const contentState = editorState.getCurrentContent();
      const blockMap = contentState.getBlockMap();
      const [firstBlockKey, firstBlock] = blockMap.entries().next().value;
      let firstNonEntityCharacter = firstNonEntityCharacterInContentBlock(firstBlock);
      console.log(firstNonEntityCharacter);

      const newSelection = editorState.getSelection();
      const firstBlockSelection = newSelection.merge({
        anchorKey: firstBlockKey,
        anchorOffset: Math.max(newSelection.getAnchorOffset(), firstNonEntityCharacter),
        focusKey: firstBlockKey,
        focusOffset: Math.max(newSelection.getFocusOffset(), firstNonEntityCharacter),
      });

      let newEditorState = editorState;
      if (!editorState.getCurrentContent().equals(contentState)) {
        newEditorState = EditorState.push(editorState, contentState);
      }
      if (!firstBlockSelection.equals(newSelection)) {
        newEditorState = EditorState.forceSelection(newEditorState, firstBlockSelection);
      }
      console.log(newEditorState.toJS());
      this.setState({editorState: newEditorState});

      const newTags = tagsForContentState(contentState);
      if (!Immutable.Iterable(newTags).equals(Immutable.Iterable(this.props.tags))) {
        this.props.onChange(newTags)
      }
    };

    this.handleReturn = () => {
      const {editorState} = this.state;
      const currentContent = editorState.getCurrentContent();
      const block = currentContent.getBlockMap().first();

      const startingLocation = firstNonEntityCharacterInContentBlock(block);
      const endingLocation = block.getLength();

      const text = block.getText().substr(startingLocation, endingLocation);
      const tagEntityKey = createEntityForTag(text);

      const tagTextSelection = editorState.getSelection()
        .merge({
          anchorOffset: startingLocation,
          focusOffset: endingLocation,
        });

      let tagReplacedContent = Draft.Modifier.replaceText(
        currentContent,
        tagTextSelection,
        text,
        null,
        tagEntityKey
      );

      const newEditorState = EditorState.push(
        editorState,
        tagReplacedContent,
        'insert-tag',
      );
      this.onChange(
        EditorState.forceSelection(newEditorState, tagReplacedContent.getSelectionAfter())
      );
      console.log(newEditorState.toJS());
      return true;
    }

    this.handlePastedInput = (text) => {
      const editorState = this.state.editorState;
      const contentState = editorState.getCurrentContent();
      const newContentState = Draft.Modifier.replaceText(
        contentState,
        editorState.getSelection(),
        text.replace(/(\r\n|\n|\r)/gm,""),
      );
      this.onChange(EditorState.push(editorState, newContentState));
      return true;
    }
  }

  componentWillReceiveProps(newProps) {
    const currentTags = tagsForContentState(this.state.editorState.getCurrentContent());
    if (!Immutable.Iterable(currentTags).equals(Immutable.Iterable(newProps.tags))) {
      this.setState({
        editorState: editorStateDisplayingTags(newProps.tags, this.state.editorState.getDecorator())
      });
    }
  }

  render() {
    return <Editor
      editorState={this.state.editorState}
      handleReturn={this.handleReturn}
      handlePastedText={this.handlePastedInput}
      onChange={this.onChange}
      onBlur={() => {console.log("BLUR");}}
      stripPastedStyles={true}
      placeholder="Tags"
    />
  }
}

function createEntityForTag(tag) {
  return Draft.Entity.create('tag', 'IMMUTABLE', { name: tag });
}

function editorStateDisplayingTags(tags, decorator) {
  const contentState = Immutable.Iterable(tags).reduce((reduction, tag) => {
    return Draft.Modifier.insertText(
      reduction,
      reduction.getSelectionAfter(),
      tag,
      null,
      createEntityForTag(tag)
    );
  }, Draft.ContentState.createFromText(""));
  return EditorState.createWithContent(contentState, decorator);
}

function tagsForContentState(contentState) {
  if (contentState.getBlockMap().count() !== 1) {
    throw "contentState should have exactly one block";
  }

  const contentBlock = contentState.getBlockMap().first();
  let tags = [];
  findTags(contentBlock, (firstLocation, lastLocation) => {
    tags.push(Draft.Entity.get(contentBlock.getEntityAt(firstLocation)));
  });

  return tags.map((entity) => entity.getData().name);
}

function firstNonEntityCharacterInContentBlock(contentBlock) {
  for (let characterEntry of contentBlock.getCharacterList().entries()) {
    const [characterIndex, characterMetadata] = characterEntry;
    if (characterMetadata.getEntity() == null) {
      return characterIndex;
    }
  }
  return contentBlock.getLength();
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

    this.onChangeAuthor = (event) => {
      this.props.onChange({...this.props.entry, author: event.target.value});
    }

    this.onChangeURL = (event) => {
      this.props.onChange({...this.props.entry, URL: event.target.value});
    }

    this.onChangeTags = (newTags) => {
      this.props.onChange({...this.props.entry, tags: newTags});
    }
  }

  render() {
    return (
      <div className="entry">
      	<h2><input value={this.props.entry.title} onChange={this.onChangeTitle} placeholder="Title" /></h2>
        <p>by <input value={this.props.entry.author} onChange={this.onChangeAuthor} placeholder="Creator or author" /></p>
        <p><a href={this.props.entry.URL}>URL</a>: <input value={this.props.entry.URL} onChange={this.onChangeURL} placeholder="Primary URL" /></p>
        <p>Created on {this.props.entry.createdAt.toISOString()}</p>
        <DescriptionEditor
          value={this.props.entry.description}
          onChange={this.onChangeDescription}
        />
        <TagEditor
          onChange={this.onChangeTags}
          tags={this.props.entry.tags}
        />
        <p>
          <button onClick={this.props.onDelete}>Delete Entry</button>
        </p>
      </div>
    );
  }
}
