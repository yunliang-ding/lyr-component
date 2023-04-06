/**
 * 自定义扩展业务组件
 */
import React, { useEffect, useRef } from 'react';
import { babelParse, Button, CreateSpin } from '../index';
import Menus from './menus';
import Tabs from './tabs';
import Main, { injectScript, injectStyle } from './main';
import { downloadFile } from 'react-core-form-tools';
import { message, Upload } from 'antd';
import ReactDOM from 'react-dom';
import './index.less';

const { open, close } = CreateSpin({
  getContainer: () => {
    return document.querySelector('.cloud-component-right');
  },
  style: {
    top: 40,
  },
  mode: 'vscode',
});

export interface CloudComponentProps {
  /** 实例引用 */
  componentRef?: any;
  /** 配置依赖 */
  require?: any;
  /** ctrl + s 钩子 */
  onSave?: any;
  /** onChange */
  onChange?: any;
  /** 新增钩子 */
  onAdd?: Function;
  /** 默认值 */
  initialComponent?: any[];
  /** 配置额外操作 */
  extra?: any[];
  openDependencies?: boolean;
  /** 外部依赖 */
  initialDependencies?: any;
}

const CloudComponent = ({
  componentRef = useRef({}),
  require = {},
  onSave = async (code) => {},
  onAdd = async (code) => {},
  onChange = () => {},
  initialComponent = [],
  extra = [],
  openDependencies = true,
  initialDependencies = [],
}: CloudComponentProps) => {
  const [component, setComponent]: any = React.useState(initialComponent);
  const [_require, setRequire]: any = React.useState(require);
  const [dependencies, setDependencies]: any =
    React.useState(initialDependencies);
  const updateDepReq = async (dep) => {
    const _dep = {};
    for (let i = 0; i < dep.length; i++) {
      const item = dep[i];
      if (item.path) {
        await injectScript(item.path, item.name);
        _dep[item.name] = window[item.name];
      }
    }
    // 更新依赖
    setRequire({
      ...require,
      ..._dep,
    });
  };
  // 加载依赖
  useEffect(() => {
    updateDepReq(dependencies);
  }, [dependencies]);
  // 保存
  const save = async () => {
    open();
    try {
      await new Promise((res) => setTimeout(res, 500));
      await onSave(component.find((i) => i.selected));
    } finally {
      close();
    }
  };
  // Ctrl + S
  const keyboardEvent = async (e) => {
    if (
      (e.key === 's' || e.key === 'S') &&
      (navigator.platform.match('Mac') ? e.metaKey : e.ctrlKey)
    ) {
      e.preventDefault();
      save();
    }
  };
  React.useEffect(() => {
    // 更新 ref Api
    componentRef.current = {
      openSpin: open,
      closeSpin: close,
      component,
      setComponent,
      code: component.find((i) => i.selected),
    };
    onChange();
    window.addEventListener('keydown', keyboardEvent);
    return () => {
      window.removeEventListener('keydown', keyboardEvent);
    };
  }, [component]);
  return (
    <div className="cloud-component">
      <Menus
        component={component}
        setComponent={setComponent}
        onAdd={onAdd}
        close={close}
        open={open}
        dependencies={dependencies}
        setDependencies={setDependencies}
        openDependencies={openDependencies}
      />
      <div className="cloud-component-right">
        {component.filter((i) => i.open).length === 0 ? (
          <img
            style={{ width: 200 }}
            className="cloud-component-right-empty"
            src="https://img.alicdn.com/imgextra/i1/O1CN01ypboF828fH2ScXohX_!!6000000007959-55-tps-40-40.svg"
          />
        ) : (
          <>
            <div className="cloud-component-right-header">
              <Tabs component={component} setComponent={setComponent} />
              <div style={{ display: 'flex', gap: 10 }}>
                <Button
                  spin
                  type="primary"
                  size="small"
                  onClick={async () => {
                    const url = URL.createObjectURL(
                      new Blob(JSON.stringify(component, null, 2).split('')),
                    );
                    await downloadFile(
                      url,
                      `${new Date().toLocaleTimeString()}.json`,
                    );
                  }}
                >
                  导出
                </Button>
                <Upload
                  accept=".json"
                  itemRender={() => null}
                  onChange={async ({ file }) => {
                    if (file.status === 'done') {
                      open();
                      await new Promise((res) => setTimeout(res, 1000));
                      try {
                        const jsonArr = JSON.parse(
                          await file.originFileObj.text(),
                        );
                        if (Array.isArray(jsonArr)) {
                          // 去重
                          jsonArr.forEach((jsonItem) => {
                            // 剔除部分属性
                            delete jsonItem.open;
                            delete jsonItem.selected;
                            if (
                              !component.some((comp) => {
                                return (
                                  comp.componentName === jsonItem.componentName
                                );
                              })
                            ) {
                              component.push(jsonItem);
                            }
                          });
                          setComponent([...component]);
                        } else {
                          message.warning('导入失败');
                        }
                      } catch (err) {
                        message.warning(err);
                      } finally {
                        close();
                      }
                    }
                  }}
                >
                  <Button type="primary" size="small">
                    导入
                  </Button>
                </Upload>
                {extra}
              </div>
            </div>
            {component.map((item) => {
              return (
                item.open && (
                  <Main
                    item={item}
                    key={item.componentName}
                    require={require}
                  />
                )
              );
            })}
          </>
        )}
      </div>
    </div>
  );
};

CloudComponent.parse = (
  params: any = {
    codes: [],
    less: window.less,
    require: {},
  },
) => {
  const components = {};
  params.codes.forEach((code) => {
    components[code.componentName] = babelParse({
      require: {
        ...params.require,
        injectStyle,
      },
      code: `
      ${code.react} \n;
      // 这里开始注入css样式
      require('injectStyle')('${code.componentName}', \`${code.less}\`, ${params.less});
`,
    });
  });
  return components;
};

/** 组件渲染 */
CloudComponent.render = (Comp, root) => {
  ReactDOM.render(Comp, root);
};

export default CloudComponent;
