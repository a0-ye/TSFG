import React from "react";

interface ContainerProps{
    child:HTMLElement
}

class Container extends React.Component {
  render() {
    return <div ref={ ref => ref.appendChild(this.props.child) }></div>;
  }
}