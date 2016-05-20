import React from 'react';

export default (props) => {
  const currentURL = props.URL;

  let URLLabelNode = null;
  if (currentURL || "" !== "") {
    try {
      const URLObject = new URL(currentURL);
      URLLabelNode = (
        <a href={currentURL}>
          {URLObject.hostname}
        </a>
      );
    }
    catch (ex) {
      console.error(ex);
    }
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
};
