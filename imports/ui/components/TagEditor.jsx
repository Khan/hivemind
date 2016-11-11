import Draft, {Editor, EditorState, ContentState} from 'draft-js';
import Immutable from 'immutable';
import React from 'react';
import { Link } from 'react-router';
import {MultiSelect} from 'react-selectize';
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
    />;
  }
}

class TagEditor2 extends React.Component {
  constructor(props) {
    super(props);
    const editorState = editorStateDisplayingTags(props.tags || []);
    this.state = {editorState};

    this.onFocus = () => this.refs.editor.focus();
    this.onChange = (editorState) => {
      // If you clear focus before confirming a tag, it's cleared.
      if (this.state.editorState.getSelection().getHasFocus() && !editorState.getSelection().getHasFocus()) {
        const clearedState = editorStateDisplayingTags(tagsForContentState(this.state.editorState.getCurrentContent()));
        if (editorState.getCurrentContent().getPlainText() === clearedState.getCurrentContent().getPlainText()) {
          this.setState({editorState});
        } else {
          this.setState({editorState: clearedState});
        }
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
          onTab={this.handleReturn}
          handlePastedText={this.handlePastedInput}
          onChange={this.onChange}
          stripPastedStyles={true}
          blockRendererFn={tagBlockRenderer}
          blockStyleFn={tagBlockStyle}
          blockRenderMap={Immutable.Map({
            'tag': {
              element: 'span',
            },
            'unstyled': {
              element: 'span',
            },
          })}
          placeholder="Tags"
          ref="editor"
          readOnly={this.props.disabled}
        />
      </div>
    );
  }
}

const Tag = (props) => {
  const tagName = props.blockProps.name;

  const params = new URLSearchParams();
  params.set("query", `#"${tagName}"`);

  const newURL = new URL(document.location.origin);
  newURL.search = params.toString();
  return <span style={{
      color: "#999",
      padding: "0px 0px"
  }}><Link to={newURL.toString()}>#{tagName}</Link></span>
};

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
