import App from './App';
import { HashRouter } from 'react-router-dom';
import React from 'react';
import { render } from 'react-dom';

render(
  <HashRouter>
    <App />
  </HashRouter>,
  document.getElementById('root')
);

if (module.hot) {
  module.hot.accept();
}
