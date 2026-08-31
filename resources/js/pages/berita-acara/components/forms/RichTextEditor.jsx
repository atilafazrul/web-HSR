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
  Image,
  ImageToolbar,
  ImageStyle,
  ImageResize,
  ImageUpload,
  ImageInsert,
  PictureEditing,
  AutoImage,
  FileRepository,
} from "ckeditor5";
import "ckeditor5/ckeditor5.css";
import { compressImage } from "../../../../utils/imageCompress";

const LICENSE_KEY = import.meta.env.VITE_CKEDITOR_LICENSE_KEY || "GPL";

/** Lebar satu tab stop (~1,27 cm di Word, 4 nbsp). */
const TAB_STOP = "\u00A0\u00A0\u00A0\u00A0";

function isInsideListItem(position) {
  for (const ancestor of position.getAncestors()) {
    if (ancestor.name === "listItem") return true;
  }
  return false;
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/** Upload gambar ke editor sebagai data URL (dikompres dulu agar PDF tidak membengkak). */
function CompressedImageUploadAdapter(editor) {
  const repo = editor.plugins.get(FileRepository);
  repo.createUploadAdapter = (loader) => ({
    upload() {
      return loader.file.then(async (file) => {
        const compressed = await compressImage(file, 960, 960, 0.72);
        const dataUrl = await fileToDataUrl(compressed);
        return { default: dataUrl };
      });
    },
    abort() {},
  });
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
  allowImages = false,
  hint = "",
}) => {
  const editorConfig = useMemo(() => {
    const plugins = [
      Essentials,
      Paragraph,
      Bold,
      Italic,
      Underline,
      List,
      Undo,
      Indent,
      WordTabSupport,
    ];
    const toolbar = [
      "undo",
      "redo",
      "|",
      "bold",
      "italic",
      "underline",
      "|",
      "bulletedList",
      "numberedList",
    ];

    if (allowImages) {
      plugins.push(
        Image,
        ImageToolbar,
        ImageStyle,
        ImageResize,
        ImageUpload,
        ImageInsert,
        PictureEditing,
        AutoImage,
        CompressedImageUploadAdapter
      );
      toolbar.push("|", "insertImage");
    }

    return {
      licenseKey: LICENSE_KEY,
      plugins,
      toolbar,
      ...(allowImages
        ? {
            image: {
              toolbar: ["imageTextAlternative", "|", "imageStyle:inline", "imageStyle:block", "|", "resizeImage"],
              insert: {
                integrations: ["upload"],
                type: "block",
              },
            },
          }
        : {}),
    };
  }, [allowImages]);

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
          key={`${editorKey}-${allowImages ? "img" : "plain"}`}
          editor={ClassicEditor}
          data={value || ""}
          config={editorConfig}
          onChange={(_event, editor) => {
            onChange(editor.getData());
          }}
        />
      </div>
      {hint ? <p className="mt-1 text-xs text-gray-500">{hint}</p> : null}
      <style>{`
        .ckeditor-wrapper .ck-editor__editable {
          min-height: var(--ck-editor-min-height, 180px);
        }
        .ckeditor-wrapper .ck-content img,
        .ckeditor-wrapper .ck-content figure.image img {
          max-width: 100%;
          height: auto;
        }
      `}</style>
    </div>
  );
};
