import React, { useState, useEffect, useRef } from 'react';
import '@spectrum-css/typography';
import '@spectrum-css/table';
import {
  View,
  Flex,
  Checkbox,
  ProgressCircle,
  Button,
  ButtonGroup,
  DialogContainer,
  AlertDialog,
  ComboBox, 
  Item, 
  Section,
  ActionButton
} from '@adobe/react-spectrum';
import AceEditor from "react-ace";
import "ace-builds/src-noconflict/mode-javascript";
import "ace-builds/src-noconflict/mode-json";
import "ace-builds/src-noconflict/theme-github";
import {CopyToClipboard} from 'react-copy-to-clipboard';

export const CallItem = ({ item, key, props }) => {

  useEffect(() => {
    (async () => {
    })();
  }, []);

  return (
      <View>
      {item.hasOwnProperty('event') ? (
        <View>
            call time: {item.event['call-time']} <br/>
            call size: {item.event['call-size']} <br/>
            call body: {item.event['body']} <br/>
            call headers: {JSON.stringify(item.event['headers'])} <br/>
            <CopyToClipboard text="test">
                <ActionButton marginBottom="size-150" width="100px">Copy</ActionButton>
            </CopyToClipboard>
            <AceEditor
              placeholder="Placeholder Text"
              mode="json"
              theme="github"
              name="postman-prerequest-script"
              readOnly={true}
              width="100%"
              height="900px"
              fontSize={14}
              splits={2}
              showPrintMargin={true}
              showGutter={true}
              highlightActiveLine={false}
              value={JSON.stringify(item.event['headers'])}
              setOptions={{
                enableBasicAutocompletion: false,
                enableLiveAutocompletion: false,
                enableSnippets: false,
                showLineNumbers: true,
                tabSize: 2,
              }}/>
        </View>
      ) : (
        <View>{item['connection-message']}</View>
      )}
      </View>
  );
};