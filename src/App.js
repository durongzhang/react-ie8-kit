import React from 'react';
import { Route, Switch } from 'react-router-dom';
import Home from './Home';
import List from './List';
import 'antd/dist/antd.css'

const App = () => (
  <Switch>
    <Route exact path="/" component={Home} />
    <Route exact path="/list" component={List} />
  </Switch>
);

export default App;
