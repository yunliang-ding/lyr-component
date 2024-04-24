import { uuid } from '@/util';
import {
  cloneElement,
  CSSProperties,
  ReactNode,
  useEffect,
  useMemo,
  useState,
} from 'react';

export interface DragWrapperProps {
  /** 配置项 */
  items?: {
    key: number | string;
    content: ReactNode;
  }[];
  /** 容器样式 */
  style?: CSSProperties;
  /** 改变的钩子 */
  onChange?: Function;
  /** 是否允许接受外部组件 */
  accept?: boolean;
  children?: ReactNode;
  dragId?: string;
}

const store: any = {}; // 全局store

export const arrayMove = (
  arr: any[],
  currentIndex: number,
  targetIndex: number,
) => {
  // 拷贝下
  const temp = arr[targetIndex];
  // 删除之前的
  arr.splice(targetIndex, 1);
  // 插入到指定的下标位置
  arr.splice(currentIndex, 0, temp);
  return [...arr];
};

const Item = ({
  index,
  dragId,
  onAdd,
  onDrop,
  children,
  virtual = false,
}: any) => {
  /** 扩展节点 */
  const Element = cloneElement(children, {
    className: 'drag-wrapper-item',
    style: {
      ...children?.props?.style,
      cursor: virtual ? 'not-allowed' : 'move',
      borderTop: '3px solid var(--color-menu-light-bg)',
    },
    draggable: true,
    onDragOver: (e) => {
      e.stopPropagation();
      e.preventDefault();
      if (String(store.index) !== String(index) || store.dragId !== dragId) {
        e.currentTarget.style.borderTop = '3px solid rgb(var(--primary-6))';
      }
    },
    onDragEnter: (e) => {
      e.stopPropagation();
      if (String(store.index) !== String(index) || store.dragId !== dragId) {
        e.currentTarget.style.borderTop = '3px solid rgb(var(--primary-6))';
      }
    },
    onDragLeave: (e) => {
      e.stopPropagation();
      e.currentTarget.style.borderTop = '3px solid var(--color-menu-light-bg)';
    },
    onDrop: (e) => {
      e.stopPropagation();
      const _dragId = store.dragId;
      const _index = store.index;
      if (store[_dragId]) {
        // 同一个模块之间的移动
        if (_dragId === dragId) {
          onDrop?.(_index, index);
        } else {
          onAdd?.(store[_dragId][_index], index); // 把这个外部的item插入到内部的index位置
        }
      }
      e.currentTarget.style.borderTop = '3px solid var(--color-menu-light-bg)';
    },
    onDragStart: (e) => {
      e.stopPropagation();
      store.index = index;
      store.dragId = dragId;
      e.currentTarget.style.opacity = '0.3';
    },
    onDragEnd: (e) => {
      e.stopPropagation();
      e.currentTarget.style.opacity = '1';
      e.currentTarget.style.borderTop = '3px solid var(--color-menu-light-bg)';
    },
  });
  return Element;
};

const DragWrapper = ({
  items = [],
  onChange = () => {},
  children,
  dragId = useMemo(() => uuid(8), []), // 唯一id
  accept = false,
}: DragWrapperProps) => {
  useEffect(() => {
    store[dragId] = items; // 存进去
    () => {
      delete store[dragId];
    };
  }, []);
  const [list, setList] = useState(items);
  return (
    <>
      {children
        ? children
        : list.map((item, index) => {
            return (
              <Item
                key={item?.key}
                index={index}
                dragId={dragId}
                onAdd={(item, index) => {
                  if (accept) {
                    list.splice(index, 0, {
                      ...item,
                      key: uuid(8),
                    });
                    // 更新视图
                    setList([...list]);
                    // 通知外部
                    onChange([...list]);
                  }
                }}
                onDrop={(targetIndex: number) => {
                  if (String(index) === String(targetIndex)) {
                    return;
                  }
                  const newList = arrayMove(list, index, targetIndex);
                  // 更新视图
                  setList(newList);
                  // 通知外部
                  onChange(newList);
                }}
              >
                {item?.content}
              </Item>
            );
          })}
    </>
  );
};

DragWrapper.Item = Item;

export default DragWrapper;
