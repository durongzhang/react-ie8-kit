import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { Button, Tabs } from 'antd';
import './Home.css'

const TabPane = Tabs.TabPane;

export default class extends Component {
  handleClick = () =>{
    alert(11111)
  }
  render() {
    return (
      <div className="Home">
        <h2>
          react ie8 测试
        </h2>
        <Button type="primary" onClick={this.handleClick}>点击</Button>
        <Tabs defaultActiveKey="1">
          <TabPane tab="选项卡一" key="1">选项卡一内容</TabPane>
          <TabPane tab="选项卡二" key="2">选项卡二内容</TabPane>
          <TabPane tab="选项卡三" key="3">选项卡三内容</TabPane>
        </Tabs>
        <Link to="/list">列表页面</Link>
      </div>
    );
  }
}