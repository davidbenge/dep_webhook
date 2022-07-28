/*
 * <license header>
 */

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
  Section
} from '@adobe/react-spectrum';
import { useHistory } from 'react-router-dom';
import actionWebInvoke from '../utils';
import actions from '../config';
import LearnerSelect from './LearnerSelect';
import Cookies from 'js-cookie';
import { CallItem } from './CallItem';

export const PayloadList = ({ actionCallHeaders, props }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [loglist,setLoglist] = useState([]);
  const [learnerId, setLearnerId] = useState();
  const [hasFocus, setFocus] = useState(true);
  const apiKey = 'VCXCEuvhGcBDP7XhiJJUDvR1e1D3eiVjgZ9VRiaV';
  let piesocket = undefined;
  const cluster = "demo";
  const logListElement = useRef(null);

  const JsonConfig = {
    type: "front end",
    items: [{ name: 10, url: true }]
  };

  useEffect(() => {
    (async () => {
    })();

    document.addEventListener("visibilitychange", function() {
      //console.log( 'document.hidden', document.hidden );  
      activeViewChanged(document.hidden);
    });
    
    window.addEventListener('focus', function() {
     //console.log("window is active!" );
     activeViewChanged(true);
    });
    
    window.addEventListener('blur', function() {
      //console.warn("window is not active!" );
      activeViewChanged(false);
    });

  }, []);

  const activeViewChanged = (newValue) => {
    //console.info("setting focus to",newValue);
    setFocus(newValue);
    hasFocus=newValue;
  };

  const checkForCookieSet = () => {
    let cookieSelectLearner = Cookies.get('selectedLearner');
    console.log('cookie check');
    if(typeof cookieSelectLearner !== 'undefined'){
      console.log('cookie check found',cookieSelectLearner);
      learnerId = cookieSelectLearner;
    }
  }

  const addItemToLogList = (item) => {
    setLoglist(loglist => [...loglist, item]);
  };

  const handleLearnerInputChange = (plearnerId) => {
    console.log(`in payload list handleLearnerInputChange ${plearnerId}`);
    if(typeof plearnerId !== 'undefined') {
      console.log(`in payload list setting learner id ${plearnerId}`);
      //learnerId = plearnerId;
      setLearnerId(plearnerId);
      if(typeof piesocket !== 'undefined'){
        piesocket.close();
      }
      piesocket = new WebSocket(`wss://${cluster}.piesocket.com/v3/${plearnerId}?api_key=${apiKey}&notify_self`);

      piesocket.onmessage = function(message) {
        const data = JSON.parse(message.data);
        addItemToLogList(data);
        console.log(`Socket incoming message: ${message.data}`);
      }

      piesocket.onclose = function(event) {
        const data = {
          "connection-message":`Disconnected from websocket wss://${cluster}.piesocket.com/v3/${plearnerId}`
        };
        addItemToLogList(data);
        console.log(`closing socket: ${event}`);
      }

      piesocket.onopen = () => {
        const data = {
          "connection-message":`Connected to websocket wss://${cluster}.piesocket.com/v3/${plearnerId}`
        };
        addItemToLogList(data);
        console.log(`connected to websocket wss://${cluster}.piesocket.com/v3/${plearnerId}?api_key=${apiKey}&notify_self`);
      }
    }else{
      console.error(`in handleLearnerInputChange and learner object is undefined`);
    }
  };

  return (
    <View elementType="main" minHeight="100vh" marginX="size-400" onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}>
      <Flex alignItems="center" justifyContent="center" direction="column" marginY="size-400" gap="size-400">
        <h2 className="spectrum-Heading spectrum-Heading--sizeL spectrum-Heading--serif">Webhook Test Viewer</h2>
        
        <Flex width="100%" alignItems="left">
        <LearnerSelect onSelectChange={handleLearnerInputChange} {...props}></LearnerSelect>
        </Flex>

        <Flex width="100%" alignItems="left" id='logs'>
          <ul id='logListElm' ref={logListElement}>
            {typeof(loglist) !== "undefined" ? (loglist.map((message,key) => (
                <CallItem key={key} item={message}></CallItem>
            ))
            ):""}
          </ul>
        </Flex>
      </Flex>
    </View>
  );
};