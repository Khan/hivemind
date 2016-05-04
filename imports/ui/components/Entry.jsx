import React from 'react';
import Draft, {Editor, EditorState, ContentState} from 'draft-js';
import Dropzone from 'react-dropzone';
import { Link } from 'react-router';
import Immutable from 'immutable';

import DescriptionEditor from './DescriptionEditor.jsx';
import EntryTextField from './EntryTextField.jsx';

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
  const tagName = props.blockProps.name;
  let newURL = new URL(document.location.origin);
  newURL.searchParams.set("query", `#"${tagName}"`);
  return <span style={{
      color: "#999",
      padding: "0px 0px"
  }}><Link to={newURL.toString()}>#{tagName}</Link></span>
};

class TagEditor extends React.Component {
  constructor(props) {
    super(props);
    const editorState = editorStateDisplayingTags(props.tags || []);
    this.state = {editorState};

    this.onFocus = () => this.refs.editor.focus();
    this.onChange = (editorState) => {
      // If you clear focus before confirming a tag, it's cleared.
      if (!editorState.getSelection().hasFocus) {
        this.setState({
          editorState: editorStateDisplayingTags(tagsForContentState(this.state.editorState.getCurrentContent()))
        });
        return;
      }

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
    };
  }

  componentWillReceiveProps(newProps) {
    const currentTags = tagsForContentState(this.state.editorState.getCurrentContent());
    if (!Immutable.Iterable(currentTags).equals(Immutable.Iterable(newProps.tags))) {
      this.setState({
        editorState: editorStateDisplayingTags(newProps.tags)
      });
    }
  }

  render() {
    return (
      <div onClick={this.onFocus} className="tagEditor">
        <Editor
          editorState={this.state.editorState}
          handleReturn={this.handleReturn}
          handlePastedText={this.handlePastedInput}
          onChange={this.onChange}
          stripPastedStyles={true}
          blockRendererFn={tagBlockRenderer}
          blockStyleFn={tagBlockStyle}
          placeholder="Tags"
          ref="editor"
          readOnly={this.props.disabled}
        />
      </div>
    );
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

const SourceLink = (props) => {
  const currentURL = props.URL;

  let URLLabelNode = null;
  if (currentURL || "" !== "") {
    const URLObject = new URL(currentURL);
    URLLabelNode = (
      <a href={currentURL}>
        {URLObject.hostname}
      </a>
    );
  }

  const onClick = (event) => {
    const newURL = window.prompt("Provide a source URL for this entry", currentURL || "");
    if (newURL) {
      props.onChange(newURL);
    }
    event.preventDefault();
  };

  return (
    <span className="externalLink">
        {URLLabelNode}
        {
          props.disabled ? null :
          <a
            className="edit"
            href="#"
            onClick={onClick}
          >
            edit URL
          </a>
        }
    </span>
  );
}

// Represents a single hivemind database entry
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
      this.props.onChange({...this.props.entry, URL: newURL});
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

  render() {
    const bottomControls =
      <div className="bottomControls">
        {this.props.disabled ? null : <a href="#" onClick={this.onDelete} className="delete">Delete</a>}
        <Link to={`/entry/${this.props.entry._id}`} className="permalink">Permalink</Link>
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

    const tagEditor =
      <TagEditor
        onChange={this.onChangeTags}
        tags={this.props.entry.tags}
        disabled={this.props.disabled}
      />;

    const hasValidImage = (this.props.entry.imageURL || "") !== "";
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
              {dates}
              {bottomControls}
            </div>
          </div>
          <div className="notes">
            {descriptionEditor}
            {tagEditor}
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
        >
          <div className="contents oneColumn">
            <div className="notes">
              {descriptionEditor}
              <div className="tagEditorAndControls">
                {tagEditor}
                {dates}
              </div>
              {bottomControls}
            </div>
          </div>
        </Dropzone>
      );
    }

    return (
      <div className={"entry" + (this.props.disabled ? "" : " editable")}>
        <header>
          <span className="title">
            <EntryTextField
              className="title"
              value={this.props.entry.title}
              onChange={this.onChangeTitle}
              placeholder="Title"
              disabled={this.props.disabled}
            />
          </span>
          <span className={"author " + (((this.props.entry.author || "") === "") ? "hidden-until-hover" : "")}>
            &nbsp;by&nbsp;<EntryTextField
              value={this.props.entry.author}
              onChange={this.onChangeAuthor}
              placeholder="Author"
              disabled={this.props.disabled}
            />
          </span>
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
