import { useNavigate } from 'react-router-dom';
import { CaretRight } from '@phosphor-icons/react';
import './Breadcrumb.css';

const Breadcrumb = ({ items }) => {
  const navigate = useNavigate();

  const handleClick = (path, state) => {
    if (path) {
      navigate(path, { state });
    }
  };

  return (
    <div className="breadcrumb">
      {items.map((item, index) => (
        <div key={index} className="breadcrumb-item">
          {index > 0 && <CaretRight size={16} weight="bold" className="breadcrumb-separator" />}
          {item.path ? (
            <button
              className="breadcrumb-link"
              onClick={() => handleClick(item.path, item.state)}
            >
              {item.label}
            </button>
          ) : (
            <span className="breadcrumb-current">{item.label}</span>
          )}
        </div>
      ))}
    </div>
  );
};

export default Breadcrumb;

