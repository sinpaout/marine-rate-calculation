import React, { Component } from 'react';
import { render } from 'react-dom';

import Header from 'js/components/Header';

import css from './index.scss';

class App extends Component {
  constructor(props) {
    super(props);

    this.updateState = this.updateState.bind(this);

    this.state = {
      // app: {},
    };
  }

  updateState() {

  }

  render() {
    return (
      <div class={`index ${css.index}`}>
        <Header />
        <div class="container">
          <h1>App</h1>
        </div>
      </div>
    );
  }
}

render(
  <App />,
  document.getElementById('root')
);

