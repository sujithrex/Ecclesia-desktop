import { useRef } from 'react';
import { Editor } from '@tinymce/tinymce-react';

// Import TinyMCE
import tinymce from 'tinymce/tinymce';

// Import TinyMCE theme
import 'tinymce/themes/silver';

// Import TinyMCE icons
import 'tinymce/icons/default';

// Import TinyMCE models
import 'tinymce/models/dom';

// Import TinyMCE plugins
import 'tinymce/plugins/lists';
import 'tinymce/plugins/link';
import 'tinymce/plugins/image';
import 'tinymce/plugins/charmap';
import 'tinymce/plugins/preview';
import 'tinymce/plugins/searchreplace';
import 'tinymce/plugins/visualblocks';
import 'tinymce/plugins/code';
import 'tinymce/plugins/fullscreen';
import 'tinymce/plugins/insertdatetime';
import 'tinymce/plugins/media';
import 'tinymce/plugins/table';
import 'tinymce/plugins/wordcount';

// Import TinyMCE skins
import 'tinymce/skins/ui/oxide/skin.css';

const TinyMCEEditor = ({ content, onChange, placeholder = 'Start typing...', className = '' }) => {
  const editorRef = useRef(null);

  const handleEditorChange = (newContent) => {
    onChange(newContent);
  };

  return (
    <div className="tinymce-container">
      <Editor
        tinymceScriptSrc={false}
        onInit={(evt, editor) => editorRef.current = editor}
        value={content || ''}
        onEditorChange={handleEditorChange}
        init={{
          height: className.includes('main') ? 400 : 150,
          menubar: false,
          plugins: [
            'lists', 'link', 'image', 'charmap', 'preview',
            'searchreplace', 'visualblocks', 'code', 'fullscreen',
            'insertdatetime', 'media', 'table', 'wordcount'
          ],
          toolbar: 'undo redo | formatselect | ' +
            'bold italic underline strikethrough | alignleft aligncenter ' +
            'alignright alignjustify | bullist numlist outdent indent | ' +
            'removeformat',
          content_style: 'body { font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6; }',
          placeholder: placeholder,
          skin: false,
          content_css: false,
          branding: false,
          promotion: false,
          license_key: 'gpl',
        }}
      />
    </div>
  );
};

export default TinyMCEEditor;

