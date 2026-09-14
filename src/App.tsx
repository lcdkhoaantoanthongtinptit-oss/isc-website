import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider, App as AntdApp } from 'antd';
import viVN from 'antd/locale/vi_VN';
import { customTheme } from './theme/themeConfig';
import { AppRoutes } from './routes';

export const App: React.FC = () => {
  return (
    <ConfigProvider theme={customTheme} locale={viVN}>
      <AntdApp>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AntdApp>
    </ConfigProvider>
  );
};

export default App;
