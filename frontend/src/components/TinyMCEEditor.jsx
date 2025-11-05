import { useRef } from 'react';
import { Editor } from '@tinymce/tinymce-react';

const TinyMCEEditor = ({ content, onChange, placeholder = 'Start typing...', className = '' }) => {
  const editorRef = useRef(null);

  const handleEditorChange = (newContent) => {
    onChange(newContent);
  };

  return (
    <div className="tinymce-container">
      <Editor
        apiKey="aohi6nbxa4pcj84r8cwiej5gi2bqafsxeclqo4d406fxm6qk"
        onInit={(evt, editor) => editorRef.current = editor}
        value={content || ''}
        onEditorChange={handleEditorChange}
        init={{
          height: className.includes('main') ? 400 : 150,
          menubar: false,
          plugins: [
            'lists', 'link', 'image', 'charmap', 'preview',
            'searchreplace', 'visualblocks', 'code', 'fullscreen',
            'insertdatetime', 'media', 'table', 'help', 'wordcount'
          ],
          toolbar: 'undo redo | formatselect | ' +
            'bold italic underline strikethrough | alignleft aligncenter ' +
            'alignright alignjustify | bullist numlist outdent indent | ' +
            'removeformat | help',
          content_style: 'body { font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6; }',
          placeholder: placeholder,
          skin: 'oxide',
          content_css: 'default',
          branding: false,
          promotion: false,
        }}
      />
    </div>
  );
};

export default TinyMCEEditor;

