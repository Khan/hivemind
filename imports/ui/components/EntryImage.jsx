import Dropzone from 'react-dropzone';
import React from 'react';

export default class EntryImage extends React.Component {
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
