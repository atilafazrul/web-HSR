import { useMemo } from "react";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import {
  ClassicEditor,
  Essentials,
  Paragraph,
  Bold,
  Italic,
  Underline,
  List,
  Undo,
} from "ckeditor5";
import "ckeditor5/ckeditor5.css";

const LICENSE_KEY = import.meta.env.VITE_CKEDITOR_LICENSE_KEY || "GPL";

export const RichTextEditor = ({
  label,
  value,
  onChange,
  minHeight = 180,
  editorKey = "default",
}) => {
  const editorConfig = useMemo(
    () => ({
      licenseKey: LICENSE_KEY,
      plugins: [Essentials, Paragraph, Bold, Italic, Underline, List, Undo],
      toolbar: [
        "undo",
        "redo",
        "|",
        "bold",
        "italic",
        "underline",
        "|",
        "bulletedList",
        "numberedList",
      ],
    }),
    []
  );

  return (
    <div>
      {label && (
        <label className="mb-2 block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <div
        className="ckeditor-wrapper overflow-hidden rounded-xl border border-gray-200"
        style={{ "--ck-editor-min-height": `${minHeight}px` }}
      >
        <CKEditor
          key={editorKey}
          editor={ClassicEditor}
          data={value || ""}
          config={editorConfig}
          onChange={(_event, editor) => {
            onChange(editor.getData());
          }}
        />
      </div>
      <style>{`
        .ckeditor-wrapper .ck-editor__editable {
          min-height: var(--ck-editor-min-height, 180px);
        }
      `}</style>
    </div>
  );
};
