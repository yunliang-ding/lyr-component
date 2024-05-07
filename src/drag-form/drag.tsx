import { Space, Tooltip } from '@arco-design/web-react';
import {
  IconDragArrow,
  IconDelete,
  IconCopy,
  IconExclamationCircle,
} from '@arco-design/web-react/icon';
import './index.css';

export default ({
  virtual = false,
  label,
  dom,
  selected = false,
  mask = true,
  onCopy = () => null,
  onDelete = () => null,
}) => {
  return virtual ? (
    <div
      className="dragContainer"
      style={{
        borderColor: '#ccc',
        backgroundColor: '#f8f8f8',
        padding: 20,
      }}
    >
      <Space>
        <span>空节点元素</span>
        <Tooltip
          content="当一个容器为空的时候，会提供一个空节点元素辅助拖拽定位"
          position="right"
        >
          <IconExclamationCircle
            style={{ fontSize: 18, position: 'relative', top: 2 }}
          />
        </Tooltip>
      </Space>
    </div>
  ) : (
    <div
      className="dragContainer"
      style={{
        borderColor: selected ? 'rgb(var(--primary-6))' : '#ccc',
      }}
    >
      <div style={{ pointerEvents: mask ? 'none' : 'auto' }}>{dom}</div>
      <div className="dragContainerDargKey">{label}</div>
      {selected && (
        <>
          <div className="dragContainerDarg">
            <IconDragArrow />
          </div>
          <div className="dragContainerTools">
            <IconDelete
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            />
            <IconCopy
              onClick={(e) => {
                e.stopPropagation();
                onCopy();
              }}
            />
          </div>
        </>
      )}
    </div>
  );
};
