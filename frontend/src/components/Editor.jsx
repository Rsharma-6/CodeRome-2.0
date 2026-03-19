import React, { useEffect, useRef } from 'react';
import * as Y from 'yjs';
import { CodemirrorBinding } from 'y-codemirror';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/theme/dracula.css';
import 'codemirror/addon/edit/closetag';
import 'codemirror/addon/edit/closebrackets';
import 'codemirror/lib/codemirror.css';
import CodeMirror from 'codemirror';
import { ACTIONS } from '../Actions';

function Editor({ socketRef, roomId, onCodeChange, onEditorInit }) {
  const ydocRef = useRef(null);
  const editorContainerRef = useRef(null);

  useEffect(() => {
    const init = async () => {
      const ydoc = new Y.Doc();
      ydocRef.current = ydoc;
      const yText = ydoc.getText('codemirror');
      yText.observe(() => onCodeChange(yText.toString()));

      const editor = CodeMirror.fromTextArea(
        document.getElementById('realtimeEditor'),
        {
          mode: { name: 'javascript', json: true },
          theme: 'dracula',
          autoCloseTags: true,
          autoCloseBrackets: true,
          lineNumbers: true,
          lineWrapping: false,
          tabSize: 2,
          indentWithTabs: false,
        }
      );

      editor.setSize('100%', '100%');

      new CodemirrorBinding(yText, editor);

      ydoc.on('update', (update) => {
        socketRef.current?.emit(ACTIONS.CODE_CHANGE, {
          roomId,
          update: Array.from(update),
        });
      });

      if (onEditorInit) {
        onEditorInit((code) => {
          ydoc.transact(() => {
            yText.delete(0, yText.length);
            yText.insert(0, code);
          });
        });
      }
    };

    init();
  }, []);

  useEffect(() => {
    if (!socketRef.current) return;

    socketRef.current.on(ACTIONS.CODE_CHANGE, ({ update }) => {
      if (ydocRef.current) {
        Y.applyUpdate(ydocRef.current, new Uint8Array(update));
      }
    });

    return () => {
      socketRef.current?.off(ACTIONS.CODE_CHANGE);
    };
  }, [socketRef.current]);

  return (
    <div ref={editorContainerRef} className="flex-1 overflow-hidden" style={{ minHeight: 0 }}>
      <textarea id="realtimeEditor" style={{ display: 'none' }} />
    </div>
  );
}

export default Editor;
