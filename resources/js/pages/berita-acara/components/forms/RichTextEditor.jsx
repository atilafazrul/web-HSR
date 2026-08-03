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
  Indent,
} from "ckeditor5";
import "ckeditor5/ckeditor5.css";

const LICENSE_KEY = import.meta.env.VITE_CKEDITOR_LICENSE_KEY || "GPL";

/** Lebar satu tab stop (~1,27 cm di Word, 4 nbsp). */
const TAB_STOP = "\u00A0\u00A0\u00A0\u00A0";

function isInsideListItem(position) {
  for (const ancestor of position.getAncestors()) {
    if (ancestor.name === "listItem") return true;
  }
  return false;
}

/** Tab seperti Word: sisipkan tab stop di kursor; di list tetap nested. */
function WordTabSupport(editor) {
  editor.keystrokes.set(
    "Tab",
    (_data, cancel) => {
      const position = editor.model.document.selection.getFirstPosition();

      if (isInsideListItem(position)) {
        const indent = editor.commands.get("indent");
        if (indent?.isEnabled) {
          editor.execute("indent");
          cancel();
          return;
        }
      }

      editor.model.change((writer) => {
        writer.insertText(TAB_STOP, position);
      });
      cancel();
    },
    { priority: "high" }
  );

  editor.keystrokes.set(
    "Shift+Tab",
    (_data, cancel) => {
      const selection = editor.model.document.selection;
      const position = selection.getFirstPosition();

      if (isInsideListItem(position)) {
        const outdent = editor.commands.get("outdent");
        if (outdent?.isEnabled) {
          editor.execute("outdent");
          cancel();
          return;
        }
      }

      editor.model.change((writer) => {
        const textNode = position.textNode ?? position.nodeBefore;
        if (!textNode?.is("$text")) return;

        const offset = textNode === position.textNode ? position.offset : textNode.data.length;
        const before = textNode.data.slice(Math.max(0, offset - TAB_STOP.length), offset);

        if (before.length === 0) return;

        const removeLen = before.length >= TAB_STOP.length ? TAB_STOP.length : before.length;
        const start = writer.createPositionAt(textNode, offset - removeLen);
        const end = writer.createPositionAt(textNode, offset);
        writer.remove(writer.createRange(start, end));
      });
      cancel();
    },
    { priority: "high" }
  );
}

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
      plugins: [
        Essentials,
        Paragraph,
        Bold,
        Italic,
        Underline,
        List,
        Undo,
        Indent,
        WordTabSupport,
      ],
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
