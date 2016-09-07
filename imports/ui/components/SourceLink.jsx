import Path from 'path';
import React from 'react';

export default (props) => {
  const currentURL = props.URL;

  let URLLabelNode = null;
  if (currentURL && currentURL !== "") {
    try {
      const URLObject = new URL(currentURL);
      const extension = Path.extname(URLObject.pathname);
      let annotation;
      if (extension) {
        annotation = extension.substring(1).toUpperCase();
      } else {
        annotation = URLObject.hostname;
      }
      URLLabelNode = (
        <a href={currentURL}>
          View reference [{annotation}]
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
