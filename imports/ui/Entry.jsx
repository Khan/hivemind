import React, {PropTypes} from 'react';
import Draft, {Editor, EditorState, ContentState} from 'draft-js';
import Dropzone from 'react-dropzone';
import { Link } from 'react-router';
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
          handleKeyCommand={this.handleKeyCommand}
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
      if (currentEntityKey !== null && Draft.Entity.get(currentEntityKey).getType() === "tag") {
        callback(currentEntityStartingLocation, index);
      }
      currentEntityStartingLocation = index;
      currentEntityKey = entityKey;
    }
  }
  if (currentEntityKey !== null) {
    callback(currentEntityStartingLocation, contentBlock.getLength());
  }
}

const Tag = (props) => {
  return <span style={{
      color: "#999",
      padding: "0px 0px"
  }}>#{props.blockProps.name}</span>
};

class TagEditor extends React.Component {
  constructor(props) {
    super(props);
    const editorState = editorStateDisplayingTags(props.tags || []/*, new Draft.CompositeDecorator([{
      strategy: findTags,
      component: Tag,
    }])*/);
    this.state = {editorState};

    this.onChange = (editorState) => {
      let contentState = editorState.getCurrentContent();
      const lastBlock = contentState.getBlockMap().last();
      if (lastBlock.getType() == "tag") {
        const penultimateBlock = contentState.getBlockBefore(lastBlock.getKey());
        editorState = EditorState.push(editorState, Draft.Modifier.removeRange(
          contentState,
          new Draft.SelectionState({
            anchorKey: penultimateBlock.getKey(),
            anchorOffset: penultimateBlock.getLength(),
            focusKey: lastBlock.getKey(),
            focusOffset: lastBlock.getLength(),
            hasFocus: true,
            isBackward: false,
          }),
          "backward"
        ));
      }
      this.setState({editorState});
      console.log(editorState)

      // Update tags model.
      const newTags = tagsForContentState(editorState.getCurrentContent());
      if (!Immutable.Iterable(newTags).equals(Immutable.Iterable(this.props.tags))) {
        this.props.onChange(newTags)
      }
    };

    this.handleReturn = () => {
      const {editorState} = this.state;
      let currentContent = editorState.getCurrentContent();
      const block = currentContent.getBlockForKey(editorState.getSelection().getFocusKey());

      const startingLocation = firstNonEntityCharacterInContentBlock(block);
      const endingLocation = block.getLength();

      const text = block.getText().substr(startingLocation, endingLocation);
      const tagEntityKey = createEntityForTag(text);

      currentContent = Draft.Modifier.splitBlock(currentContent, editorState.getSelection().merge({
        anchorOffset: startingLocation,
        focusOffset: startingLocation,
      }));
      currentContent = Draft.Modifier.setBlockType(currentContent, currentContent.getSelectionAfter(), "tag")
      const splitBlockKey = currentContent.getSelectionAfter().getFocusKey();
      const tagTextSelection = editorState.getSelection()
        .merge({
          anchorKey: splitBlockKey,
          anchorOffset: 0,
          focusKey: splitBlockKey,
          focusOffset: currentContent.getBlockForKey(splitBlockKey).getLength(),
          isBackward: false,
        });

      const insertedTagBlock = tagContentBlock(tagEntityKey, text);
      const emptyBlock = emptyContentBlock();

      currentContent = Draft.Modifier.replaceWithFragment(
        currentContent,
        tagTextSelection,
        Immutable.OrderedMap([
          [insertedTagBlock.getKey(), insertedTagBlock],
          [emptyBlock.getKey(), emptyBlock],
        ]),
      );

      const newEditorState = EditorState.push(
        editorState,
        currentContent,
        'insert-tag',
      );

      this.onChange(EditorState.forceSelection(newEditorState, currentContent.getSelectionAfter()));
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
      onBlur={() => {console.log("BLUR");}} // TODO
      stripPastedStyles={true}
      blockRendererFn={tagBlockRenderer}
      blockStyleFn={tagBlockStyle}
      placeholder="Tags"
    />
  }
}

function tagBlockStyle(contentBlock) {
  if (contentBlock.getType() === 'tag') {
    return 'tagBlock';
  } else {
    return 'unconfirmedTagBlock';
  }
}

function tagBlockRenderer(contentBlock) {
  const firstCharacter = contentBlock.getCharacterList().first();
  if (contentBlock.getType() === 'tag' && firstCharacter && firstCharacter.getEntity()) {
    return {
      component: Tag,
      editable: false,
      props: {
        name: Draft.Entity.get(firstCharacter.getEntity()).getData().name
      }
    }
  }
}

function tagContentBlock(tagEntityKey, name) {
  return new Draft.ContentBlock({
    key: Draft.genKey(),
    type: 'tag',
    text: name,
    characterList: Immutable.List(Immutable.Repeat(Draft.CharacterMetadata.create({ entity: tagEntityKey }), name.length)),
  });
}

function emptyContentBlock() {
  return new Draft.ContentBlock({
    key: Draft.genKey(),
    tag: 'unstyled',
    text: "",
    characterList: Immutable.List(),
  });
}

function createEntityForTag(tag) {
  return Draft.Entity.create('tag', 'IMMUTABLE', { name: tag });
}

function editorStateDisplayingTags(tags, decorator) {
  const contentBlockArray = Immutable.Iterable(tags).reduce((reduction, tag) => {
    reduction.push(tagContentBlock(createEntityForTag(tag), tag))
    reduction.push(emptyContentBlock());
    return reduction;
  }, [emptyContentBlock()]);
  const contentState = Draft.ContentState.createFromBlockArray(contentBlockArray);
  return EditorState.createWithContent(contentState, decorator);
}

function tagsForContentState(contentState) {
  let tags = [];
  for (block of contentState.getBlockMap().values()) {
    // TODO: assume one tag per block?
    findTags(block, (firstLocation, lastLocation) => {
      tags.push(Draft.Entity.get(block.getEntityAt(firstLocation)));
    });
  }

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

class EntryImage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {uploading: null};
    this.onDropImage = (files) => {
      this.setState({uploading: files});
      this.props.onDropImage(files, () => {
        if (files == this.state.uploading) {
          this.setState({uploading: null});
        }
      });
    }
  }

  componentWillReceiveProps(newProps) {
    if (this.state.uploading && newProps.imageURL !== props.imageURL) {
      this.setState({uploading: null});
    }
  }

  render() {
    if (this.state.uploading) {
      return <span>Uploading</span>;
    } else {
      return (
        <Dropzone
          onDrop={this.onDropImage}
          multiple={false}
          accept="image/*"
          style={{}}
        >
          <img src={this.props.imageURL} />
        </Dropzone>
      )
    }
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
      	<h2>
          <input value={this.props.entry.title} onChange={this.onChangeTitle} placeholder="Title" />
        </h2>
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
          <Link to={`/entry/${this.props.entry._id}`}>Permalink</Link>
        </p>
        <EntryImage
          onDropImage={this.props.onDropImage}
          imageURL={this.props.entry.imageURL}
        />
      </div>
    );
  }
}
